#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = resolve(process.cwd());
const RUN_ID = new Date().toISOString().slice(0, 10);
const OUT_DIR = join(ROOT, "test-runs", `tongue-test-${RUN_ID}`);
const IMAGE_DIR = join(OUT_DIR, "images");
const REPORT_DIR = join(OUT_DIR, "reports");

const explainOption = "Let me explain in my own words";

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
};

const intakeQuestions = [
  ["wake_energy", "Do you usually feel energized when you wake up?", ["I usually wake feeling refreshed and clear", "I wake up tired and need time to function", "I feel exhausted even after sleeping", explainOption], ["lowEnergy"]],
  ["energy_crash", "What time of day does your energy crash the most?", ["Morning", "Afternoon", "Evening/night", explainOption], ["lowEnergy"]],
  ["push_exhaustion", "Do you often push through exhaustion instead of resting?", ["Rarely", "Sometimes", "Almost constantly", explainOption], ["lowEnergy", "stress"]],
  ["heavy_after_eating", "Do you feel physically heavy, sluggish, or foggy after eating?", ["Rarely", "Occasionally", "Frequently", explainOption], ["bloating", "lowEnergy"]],
  ["drained_type", "Do you feel more drained mentally or physically lately?", ["Mostly mentally drained", "Mostly physically drained", "Both equally", explainOption], ["lowEnergy", "stress"]],
  ["overthink", "Do you tend to overthink while eating or working?", ["Rarely", "Sometimes", "Constantly", explainOption], ["stress", "bloating"]],
  ["bloating_frequency", "How often do you experience bloating or sluggish digestion?", ["Rarely", "A few times a week", "Almost daily", explainOption], ["bloating"]],
  ["comfort_foods", "Do you crave sugar, bread, or comfort foods when stressed?", ["Rarely", "Sometimes", "Very often", explainOption], ["bloating", "stress"]],
  ["warm_or_cold_food", "Do you generally feel better with warm foods or cold/raw foods?", ["Warm cooked foods", "Cold/raw foods", "I notice no difference", explainOption], ["cold", "heat"]],
  ["stress_appetite", "Does stress strongly affect your appetite?", ["I lose my appetite", "I eat more when stressed", "My appetite changes unpredictably", explainOption], ["stress", "bloating"]],
  ["meal_nourishment", "Do you feel nourished after meals?", ["Usually energized and grounded", "Sometimes tired afterward", "Often heavy or depleted afterward", explainOption], ["lowEnergy", "bloating"]],
  ["suppressed_frustration", "Do you suppress frustration until it builds internally?", ["Rarely", "Sometimes", "Frequently", explainOption], ["stress"]],
  ["irritability", "Do you experience irritability or emotional tension easily?", ["Rarely", "Sometimes", "Very easily", explainOption], ["stress", "heat"]],
  ["emotionally_stuck", "Do you feel emotionally “stuck” right now?", ["Not really", "Somewhat", "Strongly", explainOption], ["stress"]],
  ["body_tension", "Do you experience chest, rib, neck, or shoulder tension?", ["Rarely", "Sometimes", "Frequently", explainOption], ["stress"]],
  ["night_waking", "Do you wake during the night?", ["Rarely", "Occasionally", "Frequently, especially between 1–3 AM", explainOption], ["poorSleep", "stress"]],
  ["stress_reaction", "When stressed, how do you usually react?", ["I withdraw inward", "I become emotionally reactive", "I become controlling or impatient", explainOption], ["stress", "heat"]],
  ["resting_mind", "Does your mind feel calm when you try to rest?", ["Usually calm", "Somewhat restless", "Constantly active or racing", explainOption], ["poorSleep", "stress"]],
  ["presence", "Do you struggle to feel fully present or settled?", ["Rarely", "Sometimes", "Frequently", explainOption], ["stress", "lowEnergy"]],
  ["racing_thoughts", "Do you experience racing thoughts or overstimulation?", ["Rarely", "Sometimes", "Frequently", explainOption], ["poorSleep", "stress", "heat"]],
  ["emotional_connection", "Do you feel emotionally connected to others lately?", ["Mostly yes", "Sometimes disconnected", "Often isolated or emotionally distant", explainOption], ["stress", "lowEnergy"]],
  ["sleep_description", "How would you describe your sleep?", ["Deep and restorative", "Light or interrupted", "Restless with vivid dreams or waking", explainOption], ["poorSleep", "heat"]],
  ["inner_state", "How would you describe your inner emotional state lately?", ["Peaceful and balanced", "Stressed or unsettled", "Overwhelmed or emotionally scattered", explainOption], ["stress", "poorSleep"]],
  ["grief_heaviness", "Is there grief, sadness, or emotional heaviness you haven’t processed?", ["Not really", "Somewhat", "Deeply", explainOption], ["lowEnergy", "stress"]],
  ["guarded", "Do you feel emotionally guarded or disconnected?", ["Rarely", "Sometimes", "Frequently", explainOption], ["stress"]],
  ["chest_breath_tension", "Do you hold tension in your chest, shoulders, or breath?", ["Rarely", "Sometimes", "Constantly", explainOption], ["stress"]],
  ["breathing", "How would you describe your breathing?", ["Deep and relaxed", "Sometimes shallow", "Often tight or restricted", explainOption], ["stress"]],
  ["safe_supported", "Do you feel safe and supported in your life right now?", ["Mostly yes", "Somewhat uncertain", "Frequently unsafe, unstable, or unsupported", explainOption], ["stress", "lowEnergy"]],
  ["survival_pressure", "Do you feel driven by fear, urgency, or survival pressure?", ["Rarely", "Sometimes", "Constantly", explainOption], ["stress", "poorSleep"]],
  ["burnout", "Do you feel chronically depleted or burnt out?", ["Rarely", "Occasionally", "Deeply and consistently", explainOption], ["lowEnergy", "poorSleep"]],
].map(([id, question, options, mapsTo]) => ({ id, question, options, mapsTo }));

const wikimediaTitles = [
  "File:Human geographic tongue.jpg",
  "File:Tongue.agr.jpg",
  "File:Tongue (19158606366).jpg",
  "File:Picture of a tongue.jpg",
  "File:Dorso de língua.png",
  "File:Borda lateral da língua (lado direito).png",
  "File:Borda lateral da língua (lado esquerdo).png",
  "File:Mongolian tongue.jpg",
  "File:Scorbutic tongue (cropped).jpg",
  "File:Tongue keel.jpg",
  "File:Cloverleaf-tongue.jpg",
  "File:ElevatedTongueLA.jpg",
  "File:Papillite linguale familiale.png",
  "File:Male human mouth.jpg",
  "File:AciD.jpg",
  "File:Papilla.jpg",
  "File:Papilla2.jpg",
  "File:Tongue mass.jpg",
  "File:Poking the Tongue (5931369130).jpg",
  "File:Visible epiglottis.jpg",
];

const intakeProfiles = [
  { name: "warm digestion support", bias: ["lowEnergy", "bloating", "cold"], picks: [1, 1, 1, 2, 1, 1, 2, 1, 0, 2, 2, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1] },
  { name: "heat and restlessness", bias: ["heat", "poorSleep", "stress", "thirst"], picks: [1, 2, 2, 1, 0, 2, 1, 1, 1, 0, 1, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 0, 1, 2, 1, 1, 2, 1] },
  { name: "constraint and tension", bias: ["stress", "bloating", "poorSleep"], picks: [1, 1, 2, 1, 0, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1] },
  { name: "dryness and depletion", bias: ["dry", "cracks", "poorSleep", "lowEnergy", "constipation"], picks: [2, 1, 2, 0, 2, 1, 0, 1, 2, 2, 1, 1, 1, 1, 0, 2, 0, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2] },
  { name: "mostly balanced baseline", bias: ["normalPink", "thinCoat"], picks: [0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
];

const themeRules = [
  {
    title: "Damp / Sluggish Digestion Pattern",
    keys: ["thickCoat", "greasyCoat", "whiteCoat", "swollen", "teethMarks", "centerCoat", "rootCoat", "bloating", "lowEnergy", "looseStool"],
    summary: "The strongest direction is heaviness in the digestive-fluid system. In everyday language, food, fluids, meal timing, and post-meal energy are the first areas to watch.",
    foods: ["Warm cooked breakfasts", "Soups, congee, rice, squash, cooked greens", "Simple proteins with regular meal times", "Reduce iced drinks, grazing, late heavy meals, greasy foods, and excess sugar"],
    lifestyle: ["Take a slow 10-minute walk after the largest meal", "Eat the first five minutes without screens", "Track bloating 30, 60, and 120 minutes after meals"],
    herbs: ["Formula families commonly discussed for this direction include Liu Jun Zi Tang and Xiang Sha Liu Jun Zi Tang when the full pattern fits", "Use practitioner review before herbs or formulas"],
    organs: ["Spleen / Stomach", "Middle Burner"],
  },
  {
    title: "Heat / Irritation Pattern",
    keys: ["red", "deepRed", "yellowCoat", "redTip", "redSides", "dry", "heat", "thirst", "poorSleep"],
    summary: "This points toward warmth, irritation, restlessness, or digestive heat. It becomes stronger if paired with reflux, thirst, irritability, red tip, yellow coat, dry mouth, constipation, or poor sleep.",
    foods: ["Lighter evening meals", "Cooked greens, rice, cucumber or melon if tolerated", "Warm or room-temperature fluids rather than extremes", "Reduce alcohol, spicy food, fried food, and coffee on an empty stomach"],
    lifestyle: ["Lower evening stimulation", "Keep the room cooler for sleep", "Track whether late meals increase heat, reflux, or restless sleep"],
    herbs: ["Formula families depend on location: Stomach heat, Liver/Gallbladder heat, Heart heat, damp-heat, or yin-fluid deficiency heat", "Practitioner review is needed before cooling or clearing formulas"],
    organs: ["Stomach / Spleen", "Heart / Upper Body", "Liver / Gallbladder"],
  },
  {
    title: "Constraint / Tension Pattern",
    keys: ["purple", "redSides", "redTip", "stress", "poorSleep", "bloating"],
    summary: "The pattern suggests stress and pressure may be affecting movement: digestion, sleep, head/neck tension, breath, or mood may shift when pressure builds.",
    foods: ["Steady meals to prevent caffeine spikes and skipped-meal crashes", "Warm easy meals during stress-heavy days", "Avoid using strict restriction as the first move if digestion tightens under stress"],
    lifestyle: ["Use walking, stretching, breath, or quiet expression after high-pressure blocks", "Pause before meals to unclench jaw and lower shoulders", "Track where stress lands first in the body"],
    herbs: ["Formula families commonly discussed for Liver qi constraint include Xiao Yao San and Jia Wei Xiao Yao San when the full picture fits", "Constraint can combine with heat, dampness, blood deficiency, or weak digestion"],
    organs: ["Liver / Gallbladder", "Spleen / Stomach", "Chest and diaphragm region"],
  },
  {
    title: "Dryness / Fluid Depletion Pattern",
    keys: ["dry", "cracks", "peeledCoat", "thin", "thirst", "constipation", "poorSleep"],
    summary: "This direction suggests the body may need moisture, recovery, and steadier nourishment before stronger intervention. It becomes stronger with dry mouth, dry skin, hard stool, night waking, or depletion.",
    foods: ["Soups, stews, porridges, warm fluids", "Cooked pears or sesame/tahini-style moist foods if tolerated", "Adequate meal substance instead of dry snacks", "Reduce late caffeine, alcohol, under-sleeping, and excessive heat exposure"],
    lifestyle: ["Protect sleep and recovery first", "Track dry mouth, stool dryness, skin dryness, and night waking", "Notice whether warm fluids change the tongue surface"],
    herbs: ["Formula families depend on whether the pattern is Stomach yin, Kidney yin, blood deficiency, or heat damaging fluids", "Do not self-select nourishing formulas when thick greasy coating is also present"],
    organs: ["Stomach fluids", "Kidney fluids", "Heart / Shen when sleep is involved"],
  },
  {
    title: "Cold / Low Transformation Pattern",
    keys: ["pale", "whiteCoat", "wet", "swollen", "teethMarks", "cold", "lowEnergy", "looseStool", "bloating"],
    summary: "This suggests an underactive or cold-leaning pattern where digestion and energy may respond better to warmth, rhythm, and gentle activation than restriction.",
    foods: ["Warm breakfast and warm drinks", "Soups, stews, cooked grains, and gently warming spices if heat/reflux is not present", "Reduce cold smoothies, iced drinks, raw-heavy meals, and irregular timing"],
    lifestyle: ["Morning light and an easy walk", "Warmth to abdomen or feet", "Avoid pushing intense exercise if it creates next-day fatigue"],
    herbs: ["Formula families depend on Spleen qi, Spleen yang, Kidney yang, or cold-damp direction", "Practitioner review is needed before warming herbs or formulas"],
    organs: ["Spleen / Stomach", "Kidney Yang / Lower Burner"],
  },
];

function loadEnv() {
  const path = join(ROOT, ".env.local");
  if (!existsSync(path)) return;
  return readFile(path, "utf8").then((text) => {
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  });
}

function safeName(value) {
  return value.replace(/^File:/, "").replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

async function fetchJson(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": "TongueTestTCMAI/0.1 local launch QA (lukebdemuth@gmail.com)",
      Accept: "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  return response.json();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWikimediaImages() {
  const titles = wikimediaTitles.map(encodeURIComponent).join("|");
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${titles}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;
  const json = await fetchJson(url);
  return Object.values(json.query.pages)
    .filter((page) => page.imageinfo?.[0]?.url)
    .slice(0, 20)
    .map((page, index) => {
      const info = page.imageinfo[0];
      const meta = info.extmetadata ?? {};
      return {
        index: index + 1,
        title: page.title,
        url: info.url,
        pageUrl: info.descriptionurl,
        author: meta.Artist?.value?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Wikimedia Commons contributor",
        license: meta.LicenseShortName?.value || "See Wikimedia source page",
      };
    });
}

async function downloadImage(image) {
  const response = await fetch(image.url, {
    headers: {
      "User-Agent": "TongueTestTCMAI/0.1 local launch QA (lukebdemuth@gmail.com)",
    },
  });
  if (!response.ok) throw new Error(`Could not download ${image.title}: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const extension = image.url.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
  const filePath = join(IMAGE_DIR, `${String(image.index).padStart(2, "0")}-${safeName(image.title)}.${extension}`);
  await writeFile(filePath, bytes);
  return filePath;
}

async function analyzeImage(imagePath) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured in the shell or .env.local.");
  const bytes = await readFile(imagePath);
  const extension = imagePath.split(".").pop()?.toLowerCase();
  const mime = extension === "png" ? "image/png" : "image/jpeg";
  const imageDataUrl = `data:${mime};base64,${bytes.toString("base64")}`;
  const prompt = [
    "You are a careful Chinese medicine tongue-observation assistant for a wellness education app.",
    "Analyze only visible tongue features from the uploaded image.",
    "Do not diagnose disease. Do not prescribe treatment. Do not identify the person.",
    "Return JSON only, with keys: image_quality, detected_signs, uncertain_signs, overall_note.",
    "detected_signs must be an array of objects: { key, label, confidence, evidence }.",
    "Use only these keys:",
    Object.entries(visualChoiceLabels).map(([key, label]) => `${key}: ${label}`).join("; "),
    "If lighting, blur, angle, food/coffee staining, lipstick, or tongue not visible limits confidence, say so in image_quality.notes.",
    "Use confidence as low, medium, or high.",
  ].join("\n");

  const raw = await fetchJson("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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

  const text =
    raw.output_text ||
    (raw.output ?? [])
      .flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n");
  const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? text);
  const allowed = new Set(Object.keys(visualChoiceLabels));
  return {
    image_quality: parsed.image_quality ?? { usable: true, notes: "Image quality was not specified." },
    detected_signs: Array.isArray(parsed.detected_signs)
      ? parsed.detected_signs.filter((sign) => allowed.has(sign.key)).slice(0, 10)
      : [],
    uncertain_signs: Array.isArray(parsed.uncertain_signs) ? parsed.uncertain_signs.slice(0, 8) : [],
    overall_note: parsed.overall_note || "Use this as a first-pass visual observation.",
  };
}

function buildIntake(profile) {
  const answers = {};
  for (const [index, question] of intakeQuestions.entries()) {
    const pick = profile.picks[index] ?? 1;
    answers[question.id] = { selected: question.options[pick] };
  }
  return answers;
}

function intakeKeys(answers, profile) {
  const keys = new Set(profile.bias ?? []);
  for (const question of intakeQuestions) {
    const answer = answers[question.id];
    const optionIndex = question.options.indexOf(answer?.selected);
    if (optionIndex >= 1 || answer?.selected === explainOption) {
      question.mapsTo.forEach((key) => keys.add(key));
    }
  }
  return keys;
}

function scoreThemes(signKeys) {
  return themeRules
    .map((theme) => {
      const matched = theme.keys.filter((key) => signKeys.has(key));
      return { ...theme, score: matched.length, matched };
    })
    .filter((theme) => theme.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function graphBars(themes) {
  const max = Math.max(1, ...themes.map((theme) => theme.score));
  return themes
    .map(
      (theme) => `<div class="bar-row"><div><strong>${escapeHtml(theme.title)}</strong><span>${theme.score} signals</span></div><div class="bar"><i style="width:${Math.round((theme.score / max) * 100)}%"></i></div></div>`,
    )
    .join("");
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function answerHighlights(answers) {
  return intakeQuestions
    .map((question) => ({ question: question.question, answer: answers[question.id]?.selected }))
    .filter((item) => item.answer)
    .slice(0, 10);
}

function reportHtml({ test, image, vision, profile, answers, themes }) {
  const primary = themes[0] ?? {
    title: "General Tongue Observation",
    score: 0,
    summary: "The photo did not produce a strong single pattern. The report should ask for a clearer image and rely more on intake context.",
    foods: ["Use steady meals and hydration while retesting with a clearer photo"],
    lifestyle: ["Retake the photo in natural light with the tongue relaxed"],
    herbs: ["No formula-family direction from this image alone"],
    organs: ["Unclear from image"],
    matched: [],
  };
  const detected = vision.detected_signs.map((sign) => `${visualChoiceLabels[sign.key] || sign.label} (${sign.confidence})`);
  const highlights = answerHighlights(answers);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tongue Test: TCM AI - Test Report ${test}</title>
  <style>
    @page { size: Letter; margin: 0.45in; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #201d19; background: #f7f3ed; font-family: Inter, Arial, sans-serif; line-height: 1.45; }
    .page { background: #fffdf8; border: 1px solid #ded6ca; padding: 32px; min-height: 10in; }
    .brand { display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #d9d0c3; padding-bottom: 18px; }
    .brand img { width: 68px; height: 68px; object-fit: cover; border-radius: 16px; }
    .brand h1 { margin: 0; font-family: Georgia, serif; font-size: 30px; font-weight: 500; }
    .brand p, .muted { color: #766f65; margin: 3px 0 0; }
    .eyebrow { margin: 0 0 8px; color: #8b6e3d; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; font-weight: 700; }
    h2 { font-family: Georgia, serif; font-size: 24px; font-weight: 500; margin: 8px 0 10px; }
    h3 { margin: 0 0 8px; font-size: 13px; letter-spacing: .12em; text-transform: uppercase; }
    section { margin-top: 22px; padding-top: 22px; border-top: 1px solid #e5ded3; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card { background: #f8f4ed; border: 1px solid #e3d8ca; padding: 18px; }
    .result { background: #201d19; color: #fffaf1; padding: 22px; }
    .result .muted { color: #d7cfc2; }
    ul { padding-left: 18px; margin: 8px 0 0; }
    li { margin: 5px 0; }
    .bar-row { display: grid; grid-template-columns: 210px 1fr; gap: 14px; align-items: center; margin: 12px 0; }
    .bar-row strong { display: block; font-size: 12px; }
    .bar-row span { display: block; color: #81786d; font-size: 11px; }
    .bar { height: 8px; background: #e8dfd4; overflow: hidden; }
    .bar i { display: block; height: 100%; background: #9f5a3f; }
    .small { font-size: 11px; color: #766f65; }
    .source { font-size: 10px; color: #7f766d; }
  </style>
</head>
<body>
  <main class="page">
    <div class="brand">
      <img src="file://${join(ROOT, "public/images/tongue-assessment/tongue-map-logo.png")}" alt="Tongue Test logo" />
      <div>
        <h1>Tongue Test: TCM AI</h1>
        <p>Educational tongue observation report · Test ${test}</p>
        <p class="small">No tongue photo is included in this PDF. Image source is documented for internal testing only.</p>
      </div>
    </div>

    <section class="result">
      <p class="eyebrow">Primary Pattern Insight</p>
      <h2>${escapeHtml(primary.title)}</h2>
      <p>${escapeHtml(primary.summary)}</p>
      <p class="muted">This is an educational TCM-style wellness reflection, not a diagnosis or treatment plan.</p>
    </section>

    <section>
      <p class="eyebrow">Pattern Graph</p>
      ${graphBars(themes)}
    </section>

    <section class="grid">
      <div class="card">
        <h3>Visible Tongue Signs</h3>
        ${detected.length ? list(detected) : "<p class='muted'>No strong visible signs detected.</p>"}
        <p class="small">${escapeHtml(vision.image_quality?.notes || vision.overall_note || "")}</p>
      </div>
      <div class="card">
        <h3>Organ / System Focus</h3>
        ${list(primary.organs)}
      </div>
    </section>

    <section class="grid">
      <div class="card">
        <h3>Food Direction</h3>
        ${list(primary.foods)}
      </div>
      <div class="card">
        <h3>Lifestyle Direction</h3>
        ${list(primary.lifestyle)}
      </div>
    </section>

    <section class="grid">
      <div class="card">
        <h3>Herbal / Formula Direction</h3>
        ${list(primary.herbs)}
      </div>
      <div class="card">
        <h3>Intake Pattern Summary</h3>
        <p class="muted">Profile used for this test: ${escapeHtml(profile.name)}.</p>
        ${list(highlights.map((item) => `${item.question} — ${item.answer}`))}
      </div>
    </section>

    <section>
      <h3>TCM Well-Being Education</h3>
      <p>Traditional Chinese Medicine reads the tongue as one visible clue among many. Color, coat, moisture, shape, and location are compared with energy, digestion, sleep, stress, temperature, stool, thirst, and emotional rhythm. A strong report should not treat the photo as the whole story. The photo starts the reflection; the intake gives it context.</p>
    </section>

    <section>
      <h3>Stay Connected</h3>
      <p>Instagram: https://instagram.com/thetonguetest · Newsletter: /#updates</p>
      <p class="small">Informational only. Not medical advice. Consult a qualified healthcare professional for medical concerns. If you are experiencing a medical emergency, call emergency services immediately.</p>
      <p class="source">Internal test image: ${escapeHtml(image.title)} · ${escapeHtml(image.license)} · ${escapeHtml(image.pageUrl)}</p>
    </section>
  </main>
</body>
</html>`;
}

function chromePath() {
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function makePdf(htmlPath, pdfPath) {
  const chrome = chromePath();
  if (!chrome) return false;
  const result = spawnSync(chrome, ["--headless", "--disable-gpu", `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`], {
    stdio: "pipe",
    encoding: "utf8",
  });
  return result.status === 0 && existsSync(pdfPath);
}

async function main() {
  await loadEnv();
  await mkdir(IMAGE_DIR, { recursive: true });
  await mkdir(REPORT_DIR, { recursive: true });

  const images = await getWikimediaImages();
  if (images.length < 20) throw new Error(`Only found ${images.length} usable Wikimedia image records.`);

  const manifest = [];
  for (const image of images) {
    const testNumber = String(image.index).padStart(2, "0");
    const profile = intakeProfiles[(image.index - 1) % intakeProfiles.length];
    const answers = buildIntake(profile);
    await wait(750);
    const imagePath = await downloadImage(image);
    await wait(750);
    const vision = await analyzeImage(imagePath);
    const signKeys = new Set([...profile.bias, ...vision.detected_signs.map((sign) => sign.key), ...intakeKeys(answers, profile)]);
    const themes = scoreThemes(signKeys);
    const html = reportHtml({ test: testNumber, image, vision, profile, answers, themes });
    const htmlPath = join(REPORT_DIR, `${testNumber}-tongue-test-report.html`);
    const pdfPath = join(REPORT_DIR, `${testNumber}-tongue-test-report.pdf`);
    const jsonPath = join(REPORT_DIR, `${testNumber}-tongue-test-report.json`);
    await writeFile(htmlPath, html);
    await writeFile(jsonPath, JSON.stringify({ image, profile, answers, vision, themes }, null, 2));
    const pdfCreated = makePdf(htmlPath, pdfPath);
    manifest.push({ test: testNumber, recipient: "lukebdemuth@gmail.com", image, profile: profile.name, htmlPath, pdfPath: pdfCreated ? pdfPath : null, jsonPath, topPattern: themes[0]?.title ?? "No strong pattern" });
    console.log(`${testNumber}: ${themes[0]?.title ?? "No strong pattern"} (${pdfCreated ? "pdf" : "html only"})`);
  }

  await writeFile(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  await writeFile(
    join(OUT_DIR, "EMAIL_SEND_BLOCKED.txt"),
    [
      "Email sending was not performed.",
      "Reason: no RESEND_API_KEY or SMTP sender is configured in this project.",
      "Recipient requested: lukebdemuth@gmail.com",
      "Each manifest row contains a PDF path that can be sent once Resend or SMTP is connected.",
      "",
    ].join("\n"),
  );
  console.log(`\nBatch complete: ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
