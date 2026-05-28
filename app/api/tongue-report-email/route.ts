import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ReportSection = {
  title: string;
  items?: string[];
  body?: string;
};

type ReportPayload = {
  email: string;
  primaryTitle: string;
  primarySummary: string;
  matchedSigns: string[];
  organSystems: ReportSection[];
  foodDirection: string[];
  lifestyleDirection: string[];
  herbSuggestions: Array<{
    name: string;
    why: string;
    functions: string[];
    simple: string;
  }>;
  dietarySuggestion?: {
    principle: string;
    favor: string[];
    reduce: string[];
    daily: string[];
    meals: string[];
    recipe: string;
  };
  technicalReading?: {
    color: string;
    shape: string[];
    coating: string[];
    moisture: string;
    regions: string[];
    impressions: string[];
  };
  intakeHighlights: Array<{ question: string; answer: string }>;
  visibleSigns: string[];
  patternScores: Array<{ title: string; score: number }>;
  notes?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const tcmFoundations = [
  "Protect Your Energy, Don’t Constantly Spend It — TCM views health as the preservation and intelligent use of Qi. Rest is part of restoration and balance.",
  "Eat Warm, Nourishing Foods Regularly — warm, cooked, easy-to-digest meals are often emphasized over excessive cold, iced, or heavily processed foods.",
  "Digestion Is Central to Well-Being — eating quickly, while stressed, distracted, or overstimulated may weaken digestive balance over time.",
  "Emotions Affect the Organ Systems — stress and frustration are traditionally linked with the Liver system, worry with digestion, grief with the Lung system, fear with the Kidney system, and overstimulation with the Heart and mind.",
  "Sleep Restores the Body — consistent sleep, reduced nighttime stimulation, and recovery rhythm are major TCM foundations.",
  "Gentle Daily Movement Keeps Energy Flowing — walking, stretching, qigong, tai chi, yoga, breathwork, and mindful movement may support circulation and internal balance.",
  "Live More in Rhythm With Nature — TCM emphasizes adapting to seasonal and natural cycles rather than constantly resisting them.",
  "Calmness Supports Healing — slowing down, mindful breathing, quiet reflection, time in nature, and reducing excessive stimulation are traditionally considered restorative.",
  "Closing Reflection — TCM views health as balance, adaptability, and harmony. Small consistent changes are traditionally considered more supportive than extreme short-term interventions.",
];

const threeWeekRetakePlan = [
  "Retake the tongue test in 3 weeks using similar lighting, time of day, and camera distance so the comparison is cleaner.",
  "Try to take the photo before coffee, strongly colored food, tongue scraping, brushing, or mouthwash.",
  "Look for changes in coating thickness, color intensity, moisture, cracks, tooth marks, and whether the center or sides look less reactive.",
  "Use the 3-week comparison as a wellness tracking tool, not proof of diagnosis or treatment response.",
];

function normalizePayload(value: unknown): ReportPayload {
  if (!value || typeof value !== "object") throw new Error("Report payload is required.");
  const input = value as Record<string, any>;
  const email = String(input.email ?? "").trim().toLowerCase();
  if (!emailPattern.test(email)) throw new Error("Enter a valid email address.");

  return {
    email,
    primaryTitle: String(input.primaryTitle ?? "Tongue Observation Report").slice(0, 160),
    primarySummary: String(input.primarySummary ?? "").slice(0, 1800),
    matchedSigns: Array.isArray(input.matchedSigns) ? input.matchedSigns.map(String).slice(0, 16) : [],
    organSystems: Array.isArray(input.organSystems) ? input.organSystems.slice(0, 8) : [],
    foodDirection: Array.isArray(input.foodDirection) ? input.foodDirection.map(String).slice(0, 16) : [],
    lifestyleDirection: Array.isArray(input.lifestyleDirection) ? input.lifestyleDirection.map(String).slice(0, 16) : [],
    herbSuggestions: Array.isArray(input.herbSuggestions)
      ? input.herbSuggestions
          .map((item: any) => ({
            name: String(item?.name ?? "").slice(0, 160),
            why: String(item?.why ?? "").slice(0, 700),
            functions: Array.isArray(item?.functions) ? item.functions.map(String).slice(0, 6) : [],
            simple: String(item?.simple ?? "").slice(0, 500),
          }))
          .filter((item) => item.name)
          .slice(0, 5)
      : [],
    dietarySuggestion:
      input.dietarySuggestion && typeof input.dietarySuggestion === "object"
        ? {
            principle: String(input.dietarySuggestion.principle ?? "").slice(0, 900),
            favor: Array.isArray(input.dietarySuggestion.favor) ? input.dietarySuggestion.favor.map(String).slice(0, 16) : [],
            reduce: Array.isArray(input.dietarySuggestion.reduce) ? input.dietarySuggestion.reduce.map(String).slice(0, 16) : [],
            daily: Array.isArray(input.dietarySuggestion.daily) ? input.dietarySuggestion.daily.map(String).slice(0, 16) : [],
            meals: Array.isArray(input.dietarySuggestion.meals) ? input.dietarySuggestion.meals.map(String).slice(0, 16) : [],
            recipe: String(input.dietarySuggestion.recipe ?? "").slice(0, 700),
          }
        : undefined,
    technicalReading:
      input.technicalReading && typeof input.technicalReading === "object"
        ? {
            color: String(input.technicalReading.color ?? "").slice(0, 900),
            shape: Array.isArray(input.technicalReading.shape) ? input.technicalReading.shape.map(String).slice(0, 8) : [],
            coating: Array.isArray(input.technicalReading.coating) ? input.technicalReading.coating.map(String).slice(0, 8) : [],
            moisture: String(input.technicalReading.moisture ?? "").slice(0, 700),
            regions: Array.isArray(input.technicalReading.regions) ? input.technicalReading.regions.map(String).slice(0, 8) : [],
            impressions: Array.isArray(input.technicalReading.impressions) ? input.technicalReading.impressions.map(String).slice(0, 5) : [],
          }
        : undefined,
    intakeHighlights: Array.isArray(input.intakeHighlights)
      ? input.intakeHighlights
          .map((item: any) => ({
            question: String(item?.question ?? "").slice(0, 240),
            answer: String(item?.answer ?? "").slice(0, 500),
          }))
          .filter((item) => item.question && item.answer)
          .slice(0, 12)
      : [],
    visibleSigns: Array.isArray(input.visibleSigns) ? input.visibleSigns.map(String).slice(0, 16) : [],
    patternScores: Array.isArray(input.patternScores)
      ? input.patternScores
          .map((item: any) => ({
            title: String(item?.title ?? "").slice(0, 160),
            score: Number.isFinite(Number(item?.score)) ? Number(item.score) : 0,
          }))
          .filter((item) => item.title)
          .slice(0, 5)
      : [],
    notes: String(input.notes ?? "").slice(0, 1200),
  };
}

function addWrappedList(doc: PDFKit.PDFDocument, items: string[]) {
  if (!items.length) {
    doc.fillColor("#766f65").fontSize(10).text("No items recorded.");
    return;
  }

  doc.fillColor("#211f1a").fontSize(10);
  for (const item of items) {
    doc.text(`• ${item}`, { paragraphGap: 4, indent: 8 });
  }
}

function addSection(doc: PDFKit.PDFDocument, title: string, body?: string, items?: string[]) {
  doc.moveDown(0.9);
  doc.fillColor("#55745c").font("Helvetica-Bold").fontSize(9).text(title.toUpperCase(), {
    characterSpacing: 1.2,
  });
  doc.moveDown(0.3);
  if (body) doc.fillColor("#211f1a").font("Helvetica").fontSize(10).text(body, { lineGap: 2 });
  if (items) addWrappedList(doc, items);
}

function graphTone(index: number) {
  return ["#55745c", "#8d6a46", "#9f5a3f", "#5f6f8f", "#7f5b79"][index % 5];
}

function graphPercent(score: number, maxScore: number) {
  if (maxScore <= 0) return 0;
  return Math.max(12, Math.round((score / maxScore) * 100));
}

function patternStrengthLabel(score: number, maxScore: number) {
  if (score <= 0) return "Trace";
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.85) return "Primary";
  if (ratio >= 0.55) return "Secondary";
  return "Background";
}

function drawPatternSignature(doc: PDFKit.PDFDocument, scores: ReportPayload["patternScores"]) {
  const graphScores = scores.slice(0, 3);
  if (!graphScores.length) return;

  const startY = doc.y + 14;
  const left = 48;
  const sealX = left + 58;
  const sealY = startY + 72;
  const maxScore = Math.max(...graphScores.map((item) => item.score), 1);

  doc.moveDown(1);
  doc.fillColor("#55745c").font("Helvetica-Bold").fontSize(9).text("PATTERN SIGNATURE", left, doc.y, {
    characterSpacing: 1.2,
  });
  doc.fillColor("#766f65").font("Helvetica").fontSize(9).text(
    "This graph supports the Primary Pattern Insight by showing why this direction rose to the top and which secondary directions are still present.",
    left,
    doc.y + 6,
    { width: 480 },
  );

  doc.save();
  doc.circle(sealX, sealY, 52).fillAndStroke("#f2eadf", "#ded6ca");
  graphScores.forEach((item, index) => {
    const radius = 50 - index * 11;
    const lineWidth = 8;
    doc.circle(sealX, sealY, radius).lineWidth(lineWidth).strokeColor("#e7ded1").stroke();
    doc
      .moveTo(sealX, sealY - radius)
      .circle(sealX, sealY, radius)
      .dash(Math.max(4, graphPercent(item.score, maxScore) * 1.15), { space: 240 })
      .lineWidth(lineWidth)
      .strokeColor(graphTone(index))
      .stroke()
      .undash();
  });
  doc.circle(sealX, sealY, 27).fillAndStroke("#fffdf8", "#ded6ca");
  doc.fillColor("#211f1a").font("Times-Roman").fontSize(27).text(String(graphScores[0].score), sealX - 12, sealY - 17, {
    width: 24,
    align: "center",
  });
  doc.fillColor("#766f65").font("Helvetica-Bold").fontSize(6.5).text("PRIMARY", sealX - 24, sealY + 12, {
    width: 48,
    align: "center",
    characterSpacing: 1,
  });
  doc.restore();

  const listX = left + 142;
  let rowY = startY + 44;
  graphScores.forEach((item, index) => {
    const percent = graphPercent(item.score, maxScore);
    doc.roundedRect(listX, rowY, 350, 42, 2).fillAndStroke("#f8f4ed", "#e3d8ca");
    doc.fillColor("#211f1a").font("Helvetica-Bold").fontSize(9).text(item.title, listX + 10, rowY + 8, { width: 225 });
    doc
      .fillColor("#766f65")
      .font("Helvetica-Bold")
      .fontSize(7)
      .text(`${patternStrengthLabel(item.score, maxScore)} · ${item.score} signals`, listX + 250, rowY + 9, {
        width: 80,
        align: "right",
      });
    doc.rect(listX + 10, rowY + 28, 318, 6).fill("#ebe2d5");
    doc.rect(listX + 10, rowY + 28, Math.round(318 * (percent / 100)), 6).fill(graphTone(index));
    rowY += 50;
  });

  doc.y = Math.max(rowY + 8, sealY + 68);
}

async function createPdf(payload: ReportPayload) {
  const doc = new PDFDocument({
    size: "LETTER",
    margin: 48,
    info: {
      Title: "Tongue Test TCM Report",
      Author: "Tongue Test TCM",
      Subject: "Educational TCM-style tongue observation report",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fffdf8");
  doc.fillColor("#211f1a").font("Times-Roman").fontSize(27).text("Tongue Test TCM", 48, 48);
  doc.fillColor("#766f65").font("Helvetica").fontSize(10).text("Educational tongue observation report", 48, 82);
  doc.moveTo(48, 106).lineTo(doc.page.width - 48, 106).strokeColor("#ded6ca").stroke();

  doc.y = 130;
  doc.fillColor("#55745c").font("Helvetica-Bold").fontSize(9).text("PRIMARY PATTERN INSIGHT", { characterSpacing: 1.2 });
  doc.moveDown(0.4);
  doc.fillColor("#211f1a").font("Times-Roman").fontSize(22).text(payload.primaryTitle, { lineGap: 2 });
  doc.moveDown(0.4);
  doc.fillColor("#211f1a").font("Helvetica").fontSize(10.5).text(payload.primarySummary, { lineGap: 2 });

  drawPatternSignature(doc, payload.patternScores);
  addSection(doc, "Matched Signs", undefined, payload.matchedSigns);

  if (payload.technicalReading) {
    addSection(doc, "Technical TCM Tongue Reading", "This is a traditional pattern impression, not a medical diagnosis.", [
      `Tongue Body Color: ${payload.technicalReading.color}`,
      ...payload.technicalReading.shape.map((item) => `Tongue Shape: ${item}`),
      ...payload.technicalReading.coating.map((item) => `Tongue Coating: ${item}`),
      `Moisture Level: ${payload.technicalReading.moisture}`,
      ...payload.technicalReading.regions.map((item) => `Regional Map: ${item}`),
      ...payload.technicalReading.impressions.map((item) => `Pattern Impression: ${item}`),
    ]);
  }

  addSection(
    doc,
    "Organ / System Focus",
    undefined,
    payload.organSystems.map((item) => `${item.title}: ${item.body ?? ""}`),
  );

  addSection(doc, "Food Direction", undefined, payload.foodDirection);
  addSection(doc, "Lifestyle Direction", undefined, payload.lifestyleDirection);
  if (payload.dietarySuggestion) {
    addSection(doc, "Food & Dietary Suggestions", payload.dietarySuggestion.principle, [
      ...payload.dietarySuggestion.favor.map((item) => `Favor: ${item}`),
      ...payload.dietarySuggestion.reduce.map((item) => `Reduce: ${item}`),
      ...payload.dietarySuggestion.daily.map((item) => `Daily: ${item}`),
      ...payload.dietarySuggestion.meals.map((item) => `Meal idea: ${item}`),
      `Simple recipe: ${payload.dietarySuggestion.recipe}`,
    ]);
  }

  if (payload.herbSuggestions.length) {
    addSection(
      doc,
      "Herb Suggestions",
      "Educational only. These herbs are traditionally used in TCM for pattern directions similar to this result; they are not a diagnosis, prescription, or treatment plan.",
      payload.herbSuggestions.flatMap((herb) => [
        `${herb.name}: ${herb.why}`,
        `Traditional functions: ${herb.functions.join("; ")}`,
        `Plain-English benefit: ${herb.simple}`,
        "Vendor guidance: Copy and paste this herb name into a trusted Chinese herb supplier such as Kamwo, Mayway, ActiveHerb, Plum Flower, ChineseHerbsDirect, or Mountain Rose Herbs.",
      ]),
    );
  }

  addSection(doc, "Visible Tongue Signs", undefined, payload.visibleSigns);

  if (payload.notes) addSection(doc, "User Notes", payload.notes);

  addSection(doc, "Retake The Tongue Test In 3 Weeks", undefined, threeWeekRetakePlan);

  addSection(
    doc,
    "TCM Well-Being Education",
    "Traditional Chinese Medicine reads the tongue as one visible clue among many. Color, coat, moisture, shape, and location are compared with energy, digestion, sleep, stress, temperature, stool, thirst, and emotional rhythm. This report is meant to organize traditional pattern reflection in plain language.",
  );

  addSection(doc, "Foundations of Traditional Chinese Medicine Well-Being", undefined, tcmFoundations);

  doc.moveDown(1);
  doc.fillColor("#766f65").font("Helvetica").fontSize(8.5).text(
    "Informational only. Tongue Test TCM is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. The information provided is for informational and educational purposes only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment. If you are experiencing a medical emergency, call emergency services immediately.",
    { lineGap: 1 },
  );
  doc.moveDown(0.8);
  doc.text("Instagram: https://instagram.com/thetonguetest · Newsletter: /#updates");

  doc.end();
  return finished;
}

async function sendResendReport(payload: ReportPayload, pdf: Buffer) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured. Add it in Vercel before sending PDF reports.");
  }

  const from = process.env.REPORT_FROM_EMAIL || process.env.WAITLIST_FROM_EMAIL || "reports@thetonguetest.com";
  const replyTo = process.env.REPORT_REPLY_TO_EMAIL || process.env.WAITLIST_NOTIFY_EMAIL;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.email,
      reply_to: replyTo,
      subject: "Your Tongue Test TCM report",
      text: [
        "Your Tongue Test TCM report is attached.",
        "",
        "This is an educational Traditional Chinese Medicine-style wellness reflection, not a diagnosis or treatment plan.",
        "",
        "Informational only. Not medical advice. Consult a qualified healthcare professional for medical concerns.",
      ].join("\n"),
      attachments: [
        {
          filename: "tongue-test-tcm-ai-report.pdf",
          content: pdf.toString("base64"),
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Report email failed: ${detail || response.statusText}`);
  }
}

export async function POST(request: Request) {
  try {
    const payload = normalizePayload(await request.json());
    const pdf = await createPdf(payload);
    await sendResendReport(payload, pdf);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send report email.";
    const status = /RESEND_API_KEY|configured|valid email/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
