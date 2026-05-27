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
  herbalDirection: string[];
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
    herbalDirection: Array.isArray(input.herbalDirection) ? input.herbalDirection.map(String).slice(0, 16) : [],
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

async function createPdf(payload: ReportPayload) {
  const doc = new PDFDocument({
    size: "LETTER",
    margin: 48,
    info: {
      Title: "Tongue Test: TCM AI Report",
      Author: "Tongue Test: TCM AI",
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
  doc.fillColor("#211f1a").font("Times-Roman").fontSize(27).text("Tongue Test: TCM AI", 48, 48);
  doc.fillColor("#766f65").font("Helvetica").fontSize(10).text("Educational tongue observation report", 48, 82);
  doc.moveTo(48, 106).lineTo(doc.page.width - 48, 106).strokeColor("#ded6ca").stroke();

  doc.y = 130;
  doc.fillColor("#55745c").font("Helvetica-Bold").fontSize(9).text("PRIMARY PATTERN INSIGHT", { characterSpacing: 1.2 });
  doc.moveDown(0.4);
  doc.fillColor("#211f1a").font("Times-Roman").fontSize(22).text(payload.primaryTitle, { lineGap: 2 });
  doc.moveDown(0.4);
  doc.fillColor("#211f1a").font("Helvetica").fontSize(10.5).text(payload.primarySummary, { lineGap: 2 });

  addSection(doc, "Pattern Scores", undefined, payload.patternScores.map((item) => `${item.title}: ${item.score} matched signals`));
  addSection(doc, "Matched Signs", undefined, payload.matchedSigns);

  addSection(
    doc,
    "Organ / System Focus",
    undefined,
    payload.organSystems.map((item) => `${item.title}: ${item.body ?? ""}`),
  );

  addSection(doc, "Food Direction", undefined, payload.foodDirection);
  addSection(doc, "Lifestyle Direction", undefined, payload.lifestyleDirection);
  addSection(doc, "Top 3 Formula Families To Research", undefined, payload.herbalDirection);

  addSection(
    doc,
    "Intake Pattern Summary",
    undefined,
    payload.intakeHighlights.map((item) => `${item.question} — ${item.answer}`),
  );

  addSection(doc, "Visible Tongue Signs", undefined, payload.visibleSigns);

  if (payload.notes) addSection(doc, "User Notes", payload.notes);

  addSection(
    doc,
    "TCM Well-Being Education",
    "Traditional Chinese Medicine reads the tongue as one visible clue among many. Color, coat, moisture, shape, and location are compared with energy, digestion, sleep, stress, temperature, stool, thirst, and emotional rhythm. The photo starts the reflection; the intake gives it context.",
  );

  addSection(doc, "Foundations of Traditional Chinese Medicine Well-Being", undefined, tcmFoundations);

  doc.moveDown(1);
  doc.fillColor("#766f65").font("Helvetica").fontSize(8.5).text(
    "Informational only. Tongue Test: TCM AI is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. The information provided is for informational and educational purposes only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment. If you are experiencing a medical emergency, call emergency services immediately.",
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
      subject: "Your Tongue Test: TCM AI report",
      text: [
        "Your Tongue Test: TCM AI report is attached.",
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
