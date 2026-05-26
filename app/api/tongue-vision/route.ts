import { NextResponse } from "next/server";

export const runtime = "nodejs";

const visualChoiceLabels = {
  pale: "Pale",
  red: "Red",
  deepRed: "Deep red",
  purple: "Purple / dusky",
  normalPink: "Soft pink",
  thinCoat: "Thin coat",
  thickCoat: "Thick coat",
  whiteCoat: "White coat",
  yellowCoat: "Yellow coat",
  greasyCoat: "Greasy / sticky",
  peeledCoat: "Peeled / missing",
  dry: "Dry",
  wet: "Wet",
  swollen: "Swollen / puffy",
  thin: "Thin",
  teethMarks: "Teeth marks",
  cracks: "Cracks",
  redTip: "Red tip",
  redSides: "Red sides",
  centerCoat: "Center coat",
  rootCoat: "Back/root coat",
} as const;

type VisualChoiceKey = keyof typeof visualChoiceLabels;

const visualChoiceKeys = new Set(Object.keys(visualChoiceLabels));
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function extractOutputText(response: any): string {
  if (typeof response.output_text === "string") return response.output_text;
  const chunks: string[] = [];
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") chunks.push(content.text);
    }
  }
  return chunks.join("\n");
}

function parseJsonObject(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Vision response did not contain JSON.");
    return JSON.parse(match[0]);
  }
}

function rateLimitKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "local";
}

function checkRateLimit(request: Request) {
  const now = Date.now();
  const key = rateLimitKey(request);
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { ok: false, resetAt: current.resetAt };
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return { ok: true, resetAt: current.resetAt };
}

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request);
    if (!rateLimit.ok) {
      return NextResponse.json(
        {
          error: "Too many tongue photo reads. Please wait a little before trying again.",
          resetAt: new Date(rateLimit.resetAt).toISOString(),
        },
        { status: 429 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key is not configured." }, { status: 500 });
    }

    const { imageDataUrl } = await request.json();
    if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "A base64 image data URL is required." }, { status: 400 });
    }
    if (imageDataUrl.length > 10_000_000) {
      return NextResponse.json({ error: "Image is too large. Please upload a smaller tongue photo." }, { status: 400 });
    }

    const prompt = [
      "You are a careful Chinese medicine tongue-observation assistant for a wellness education app.",
      "Analyze only visible tongue features from the uploaded image.",
      "Do not diagnose disease. Do not prescribe treatment. Do not identify the person.",
      "Return JSON only, with keys: image_quality, detected_signs, uncertain_signs, overall_note.",
      "detected_signs must be an array of objects: { key, label, confidence, evidence }.",
      "Use only these keys:",
      Object.entries(visualChoiceLabels)
        .map(([key, label]) => `${key}: ${label}`)
        .join("; "),
      "If lighting, blur, angle, food/coffee staining, lipstick, or tongue not visible limits confidence, say so in image_quality.notes.",
      "Use confidence as low, medium, or high.",
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: imageDataUrl, detail: "high" },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: "Tongue vision analysis failed.", detail }, { status: 502 });
    }

    const raw = await response.json();
    const parsed = parseJsonObject(extractOutputText(raw));
    const detectedSigns = Array.isArray(parsed.detected_signs)
      ? parsed.detected_signs
          .filter((sign: any) => visualChoiceKeys.has(sign?.key))
          .map((sign: any) => ({
            key: sign.key as VisualChoiceKey,
            label: visualChoiceLabels[sign.key as VisualChoiceKey],
            confidence: ["low", "medium", "high"].includes(sign.confidence) ? sign.confidence : "medium",
            evidence: typeof sign.evidence === "string" ? sign.evidence : "",
          }))
      : [];

    return NextResponse.json({
      image_quality: parsed.image_quality ?? {
        usable: detectedSigns.length > 0,
        notes: "Image quality was not specified by the vision model.",
      },
      detected_signs: detectedSigns,
      uncertain_signs: Array.isArray(parsed.uncertain_signs) ? parsed.uncertain_signs.slice(0, 8) : [],
      overall_note:
        typeof parsed.overall_note === "string"
          ? parsed.overall_note
          : "Use these signs as a first-pass visual observation, then compare with symptoms.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown tongue vision error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
