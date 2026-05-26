"use client";

import { useMemo, useState } from "react";

import {
  BasisOfInsightDisclosure,
  EmergencyWarning,
  FullMedicalDisclaimer,
  ShortResultDisclaimer,
  WellnessPurposeDisclosure,
} from "@/components/compliance/disclosures";

type ChoiceKey =
  | "pale"
  | "red"
  | "deepRed"
  | "purple"
  | "normalPink"
  | "thinCoat"
  | "thickCoat"
  | "whiteCoat"
  | "yellowCoat"
  | "greasyCoat"
  | "peeledCoat"
  | "dry"
  | "wet"
  | "swollen"
  | "thin"
  | "teethMarks"
  | "cracks"
  | "redTip"
  | "redSides"
  | "centerCoat"
  | "rootCoat"
  | "bloating"
  | "poorSleep"
  | "stress"
  | "lowEnergy"
  | "heat"
  | "cold"
  | "thirst"
  | "looseStool"
  | "constipation";

type VisualChoiceKey = Exclude<
  ChoiceKey,
  | "bloating"
  | "poorSleep"
  | "stress"
  | "lowEnergy"
  | "heat"
  | "cold"
  | "thirst"
  | "looseStool"
  | "constipation"
>;

type Choice = {
  key: ChoiceKey;
  label: string;
  hint: string;
};

type OrganSignal = {
  system: string;
  meaning: string;
  why: string;
};

type Theme = {
  title: string;
  score: number;
  plain: string;
  meaning: string;
  signs: string[];
  organs: OrganSignal[];
  support: {
    foods: string[];
    lifestyle: string[];
    formulaFamilies: string[];
  };
  tryFirst: string[];
  observe: string[];
  questions: string[];
};

type VisionResult = {
  image_quality?: {
    usable?: boolean;
    notes?: string;
    lighting?: string;
    blur?: string;
  };
  detected_signs: Array<{
    key: VisualChoiceKey;
    label: string;
    confidence: "low" | "medium" | "high";
    evidence: string;
  }>;
  uncertain_signs?: string[];
  overall_note?: string;
};

const MAX_UPLOAD_EDGE = 1400;
const JPEG_QUALITY = 0.82;

const observationGroups: Array<{ title: string; note: string; choices: Choice[] }> = [
  {
    title: "Body Color",
    note: "Look at the tongue body itself, not the coating.",
    choices: [
      { key: "normalPink", label: "Soft pink", hint: "Even color, not very pale or red" },
      { key: "pale", label: "Pale", hint: "Light, washed out, or low color" },
      { key: "red", label: "Red", hint: "More red than usual" },
      { key: "deepRed", label: "Deep red", hint: "Strong red, especially with heat signs" },
      { key: "purple", label: "Purple / dusky", hint: "Dark, bluish, or stagnant-looking color" },
    ],
  },
  {
    title: "Coating",
    note: "Notice thickness, color, and whether the coat looks wet, greasy, dry, or missing.",
    choices: [
      { key: "thinCoat", label: "Thin coat", hint: "Light visible coating" },
      { key: "thickCoat", label: "Thick coat", hint: "Coating obscures the tongue body" },
      { key: "whiteCoat", label: "White coat", hint: "White or pale coating" },
      { key: "yellowCoat", label: "Yellow coat", hint: "Yellow tone in the coating" },
      { key: "greasyCoat", label: "Greasy / sticky", hint: "Coating looks slick, stuck, or heavy" },
      { key: "peeledCoat", label: "Peeled / missing", hint: "Patchy, peeled, or low coating" },
    ],
  },
  {
    title: "Shape + Surface",
    note: "Shape can reflect how the system is holding fluid, energy, dryness, or tension.",
    choices: [
      { key: "swollen", label: "Swollen / puffy", hint: "Large, soft, fills the mouth" },
      { key: "thin", label: "Thin", hint: "Narrow, small, or depleted-looking" },
      { key: "teethMarks", label: "Teeth marks", hint: "Scalloped edges" },
      { key: "cracks", label: "Cracks", hint: "Visible lines or fissures" },
      { key: "dry", label: "Dry", hint: "Dry surface, low shine, dry mouth" },
      { key: "wet", label: "Wet", hint: "Very moist or glossy" },
    ],
  },
  {
    title: "Location Clues",
    note: "Where a sign appears can matter. Tap only what is obvious.",
    choices: [
      { key: "redTip", label: "Red tip", hint: "Tip is redder than the rest" },
      { key: "redSides", label: "Red sides", hint: "Edges/sides are redder" },
      { key: "centerCoat", label: "Center coat", hint: "Coat is strongest in the middle" },
      { key: "rootCoat", label: "Back/root coat", hint: "Coat is strongest toward the back" },
    ],
  },
  {
    title: "How You Feel",
    note: "Tongue signs mean more when they are paired with what you feel.",
    choices: [
      { key: "bloating", label: "Bloating", hint: "Gas, heaviness, or distention" },
      { key: "poorSleep", label: "Poor sleep", hint: "Hard to fall asleep or stay asleep" },
      { key: "stress", label: "Stress / tension", hint: "Pressure, irritability, tightness" },
      { key: "lowEnergy", label: "Low energy", hint: "Fatigue, heaviness, or crash" },
      { key: "heat", label: "Heat signs", hint: "Flushing, irritability, burning, warm body" },
      { key: "cold", label: "Cold signs", hint: "Cold hands/feet, chill, wants warmth" },
      { key: "thirst", label: "Thirst / dry mouth", hint: "Wants fluids or mouth feels dry" },
      { key: "looseStool", label: "Loose stool", hint: "Loose, urgent, or frequent stool" },
      { key: "constipation", label: "Constipation", hint: "Dry, hard, infrequent, or incomplete" },
    ],
  },
];

const visualChoiceKeys = new Set<ChoiceKey>(
  observationGroups
    .filter((group) => group.title !== "How You Feel")
    .flatMap((group) => group.choices.map((choice) => choice.key)),
);

const tongueZones = [
  {
    zone: "Tip",
    systems: "Heart / Lung",
    meaning: "sleep, spirit, chest, breath, emotional heat",
  },
  {
    zone: "Sides",
    systems: "Liver / Gallbladder",
    meaning: "stress, constraint, tension, irritability, flow",
  },
  {
    zone: "Center",
    systems: "Spleen / Stomach",
    meaning: "digestion, appetite, coating, fluids, post-meal comfort",
  },
  {
    zone: "Root",
    systems: "Kidney / Lower Burner",
    meaning: "deep fluids, elimination, lower body, chronic depletion",
  },
];

const visualSourceBooks = [
  "Barbara Kirschbaum, Atlas of Chinese Tongue Diagnosis",
  "Giovanni Maciocia, Tongue Diagnosis in Chinese Medicine",
  "Claus C. Schnorrenberger and Beate Schnorrenberger, Pocket Atlas of Tongue Diagnosis",
];

const themeRules: Omit<Theme, "score" | "signs">[] = [
  {
    title: "Damp / Sluggish Digestion Pattern",
    plain:
      "The clearest reading is heaviness in the digestive-fluid system: the body may be struggling to transform food and fluids cleanly.",
    meaning:
      "In plain English, this often means digestion and fluid metabolism are the first places to look. If meals leave you heavy, foggy, bloated, loose, sticky, or tired, this pattern becomes more convincing.",
    organs: [
      {
        system: "Spleen / Stomach",
        meaning: "Food and fluid transformation may be the main area to watch.",
        why: "Thick, greasy, swollen, tooth-marked, or center/root coating signs often point this way in Chinese medicine.",
      },
      {
        system: "Middle Burner",
        meaning: "The pattern may be strongest around meals, bloating, appetite, stool, and post-meal energy.",
        why: "The middle of the tongue and digestive symptoms are read together rather than separately.",
      },
    ],
    support: {
      foods: [
        "Favor warm cooked meals, soups, congee, rice, squash, cooked greens, and simple proteins.",
        "Reduce iced drinks, cold smoothies, grazing, greasy foods, late heavy meals, and excess sugar during the test.",
      ],
      lifestyle: [
        "Use a consistent meal rhythm and a short walk after the largest meal.",
        "Eat without screens or rushing for the first five minutes of the meal.",
      ],
      formulaFamilies: [
        "TCM formula families commonly discussed for damp/sluggish digestion include Liu Jun Zi Tang, Xiang Sha Liu Jun Zi Tang, and related Spleen-transforming approaches.",
        "Use practitioner review before herbs or formulas, especially with medications, pregnancy, chronic illness, or strong symptoms.",
      ],
    },
    tryFirst: [
      "Use warm, simple cooked meals for three days: soup, congee, rice, cooked vegetables, easy protein.",
      "Pause iced drinks, grazing, raw-heavy meals, late heavy meals, and very greasy foods during the test.",
      "Take a slow 10-minute walk after the largest meal and notice bloating, fog, and stool the next morning.",
    ],
    observe: [
      "Track bloating 30, 60, and 120 minutes after meals.",
      "Track whether the tongue coat is thicker in the morning or after heavier foods.",
      "Track stool texture, heaviness, stickiness, and energy after eating.",
    ],
    questions: [
      "Is appetite dull, variable, or strong?",
      "Is stool loose, sticky, incomplete, or normal?",
      "Does warm cooked food improve comfort compared with cold/raw food?",
    ],
  },
  {
    title: "Heat / Irritation Pattern",
    plain:
      "This tongue leans toward a Heat / Irritation Pattern with digestive-center involvement. In Chinese medicine tongue observation, a redder tongue body can suggest that the system is running warmer, more reactive, or more irritated. The center of the tongue is commonly associated with the Spleen / Stomach area, so the visible center coating suggests digestion, appetite, reflux, bloating, meal timing, and post-meal comfort should be checked before making a stronger interpretation.",
    meaning:
      "In plain English, this does not point to one single conclusion yet. The strongest early signal is that warmth, irritation, digestion, stress, and hydration may be connected. If you also notice reflux, thirst, dry mouth, irritability, restless sleep, constipation, bitter taste, or stronger symptoms after coffee, alcohol, spicy food, fried food, or late meals, this heat/digestion direction becomes more likely.",
    organs: [
      {
        system: "Stomach / Spleen",
        meaning: "Digestion, appetite, coating, bloating, food response, and post-meal energy are the first areas to compare with the tongue photo.",
        why: "The center of the tongue is commonly read in relation to the Spleen/Stomach digestive center.",
      },
      {
        system: "Heart / Upper Body Heat",
        meaning: "This becomes more relevant if the tongue read is paired with poor sleep, restlessness, anxiety, mouth dryness, or a red tip.",
        why: "Redder upper/tip signs can shift the read toward sleep, spirit, chest, and upper-body heat patterns.",
      },
      {
        system: "Liver / Gallbladder",
        meaning: "This becomes more relevant if paired with stress, irritability, tension, headaches, rib tightness, bitter taste, or symptoms worsened by pressure.",
        why: "The sides are commonly used as a Liver/Gallbladder map area in tongue observation.",
      },
    ],
    support: {
      foods: [
        "Favor simple cooling foods when tolerated: cooked greens, rice, cucumber, melon, mung-style foods, and lighter evening meals.",
        "Reduce alcohol, spicy foods, fried foods, coffee on an empty stomach, and late heavy meals.",
      ],
      lifestyle: [
        "Lower evening heat load: cooler room, lighter dinner, less late work, and reduced stimulation before sleep.",
        "Track whether heat signs respond better to cooling or whether cooling weakens digestion.",
      ],
      formulaFamilies: [
        "TCM formula families commonly discussed for heat signs depend on location, such as Stomach heat, Heart heat, Liver/Gallbladder heat, or yin-fluid deficiency heat.",
        "A practitioner should decide whether the pattern is excess heat, deficient heat, damp-heat, or heat mixed with weak digestion before herbs are considered.",
      ],
    },
    tryFirst: [
      "For a short test, reduce alcohol, spicy foods, fried foods, coffee on an empty stomach, and late heavy dinners.",
      "Use simpler meals: rice, cooked greens, cucumber if tolerated, soups, lighter evening food.",
      "Keep the evening cooler and lower stimulation before sleep.",
    ],
    observe: [
      "Track thirst, dry mouth, flushing, irritability, reflux, and night heat.",
      "Notice whether yellow coat or red areas increase after spicy, fried, alcohol, or late meals.",
      "Track whether sleep changes when dinner is earlier and lighter.",
    ],
    questions: [
      "Is the heat more in the stomach, chest, face, sleep, emotions, or whole body?",
      "Is there burning, reflux, thirst, mouth sores, or bitter taste?",
      "Does cooling food help or make digestion weaker?",
    ],
  },
  {
    title: "Constraint / Tension Pattern",
    plain:
      "The tongue and symptoms suggest a stress-movement pattern: pressure may be affecting digestion, sleep, head/neck tension, or mood.",
    meaning:
      "In plain English, the body may be showing a pattern where stress and pressure change how things move. If symptoms shift with tension, deadlines, holding emotions in, skipped meals, jaw/neck tightness, or needing to sigh, this direction gets stronger.",
    organs: [
      {
        system: "Liver / Gallbladder",
        meaning: "Stress, tension, irritability, red sides, or purple tone may suggest constrained movement in Chinese medicine language.",
        why: "The sides of the tongue plus stress-location symptoms are treated as a flow pattern, not just a mood pattern.",
      },
      {
        system: "Spleen / Stomach",
        meaning: "When stress changes appetite, bloating, stool, or reflux, digestion becomes part of the same pattern.",
        why: "Chinese medicine often reads stress and digestion together when qi movement affects the middle burner.",
      },
    ],
    support: {
      foods: [
        "Favor steady meals that prevent stress-related skipping, caffeine spikes, and late heavy eating.",
        "If digestion tightens under stress, choose warm easy meals before adding strong cleansing or restrictive diets.",
      ],
      lifestyle: [
        "Use movement to move constraint: walking, gentle stretching, shaking out tension, or breath before meals.",
        "Create a decompression ritual after high-pressure blocks before eating or sleeping.",
      ],
      formulaFamilies: [
        "TCM formula families commonly discussed for Liver qi constraint include Xiao Yao San and Jia Wei Xiao Yao San when the pattern fits.",
        "Practitioner review is important because constraint can combine with heat, dampness, blood deficiency, or weak digestion.",
      ],
    },
    tryFirst: [
      "Before meals, take 60 seconds to unclench jaw, lower shoulders, and breathe slowly.",
      "Use a walk, gentle stretching, or quiet expression after stressful blocks instead of pushing straight into the next task.",
      "Keep caffeine and skipped meals steady for three days so stress-digestion signals are easier to read.",
    ],
    observe: [
      "Track where stress lands first: chest, throat, ribs, stomach, head, jaw, shoulders, bowels, or sleep.",
      "Track whether symptoms improve from movement, pressure, sighing, warmth, quiet, or being alone.",
      "Notice whether red sides, purple tone, or tongue tension appear on higher-stress days.",
    ],
    questions: [
      "Does stress change appetite, stool, sleep, headache, or body tension?",
      "Do symptoms improve after movement or worsen after exertion?",
      "Is irritability, holding in, or feeling stuck part of the pattern?",
    ],
  },
  {
    title: "Dryness / Fluid Depletion Pattern",
    plain:
      "The signs lean toward dryness or reduced nourishment: the system may need moisture, recovery, and less depletion before stronger changes.",
    meaning:
      "In plain English, the photo may be pointing toward a system that needs moisture, steadier nourishment, and recovery. If you also notice dry mouth, thirst, dry skin, hard stool, night waking, or feeling depleted after overwork, this pattern becomes more important.",
    organs: [
      {
        system: "Stomach / Kidney Fluid",
        meaning: "Dryness, cracks, peeled coat, thirst, or constipation may suggest fluids are not adequately moistening tissues.",
        why: "Tongue coat, cracks, moisture, and stool/thirst signs are read together for fluid status.",
      },
      {
        system: "Heart / Shen",
        meaning: "If dryness appears with poor sleep or red tip, recovery and nighttime settling become important.",
        why: "Sleep and tip signs can shift the read toward Heart/shen involvement.",
      },
    ],
    support: {
      foods: [
        "Favor moist cooked foods: soups, stews, porridges, warm fluids, cooked pears if tolerated, sesame/tahini-style moist foods, and adequate meal substance.",
        "Reduce dehydrating routines: late caffeine, alcohol, dry snacks, overwork, under-sleeping, and excessive heat exposure.",
      ],
      lifestyle: [
        "Protect recovery and sleep before adding stronger interventions.",
        "Track hydration, stool dryness, dry mouth, skin dryness, and whether warm fluids change the tongue surface.",
      ],
      formulaFamilies: [
        "TCM formula families for dryness/fluid depletion depend on whether the pattern is Stomach yin, Kidney yin, blood deficiency, or heat damaging fluids.",
        "Do not self-select nourishing formulas if there is thick greasy coating or strong dampness; that combination needs practitioner sorting.",
      ],
    },
    tryFirst: [
      "Use warm fluids, soups, stews, cooked moist foods, and steady meals rather than dry snacks or erratic eating.",
      "Reduce dehydrating routines for a short test: late caffeine, alcohol, dry foods, overwork, and too little sleep.",
      "Protect sleep and recovery first if dryness appears with low energy or night waking.",
    ],
    observe: [
      "Track dry mouth, thirst, dry skin, constipation, cracked tongue, and night waking.",
      "Notice whether warm fluids and moist cooked foods change stool, mouth dryness, or energy.",
      "Track whether the tongue looks more cracked or peeled after poor sleep or overwork.",
    ],
    questions: [
      "Is thirst strong or absent despite dryness?",
      "Is stool dry/hard or just infrequent?",
      "Does rest improve the pattern more than stimulation?",
    ],
  },
  {
    title: "Cold / Low Transformation Pattern",
    plain:
      "The signs lean cold or underactive: digestion and energy may respond better to warmth, regularity, and gentle activation than restriction.",
    meaning:
      "In plain English, this can look like a system that does better with warmth, rhythm, and gentle support. If cold food, iced drinks, irregular meals, or overexertion make you more tired, bloated, loose, or chilled, this direction becomes more likely.",
    organs: [
      {
        system: "Spleen / Stomach",
        meaning: "Cold, pale, wet, swollen, tooth-marked, low-energy signs may point toward weak transformation.",
        why: "Pale/wet/swollen tongue signs paired with bloating or loose stool often make digestion the first area to support.",
      },
      {
        system: "Kidney Yang / Lower Burner",
        meaning: "If cold is deep, chronic, or paired with low back, low libido, frequent urination, or deep fatigue, lower burner context matters.",
        why: "Root area coating, cold signs, and chronic depletion clues help decide whether the pattern is deeper than digestion.",
      },
    ],
    support: {
      foods: [
        "Favor warm breakfasts, warm drinks, soups, stews, cooked grains, and gentle warming spices if heat/reflux is not present.",
        "Reduce cold drinks, cold smoothies, raw-heavy meals, and irregular meal timing.",
      ],
      lifestyle: [
        "Use morning light, warmth to abdomen/feet, and gentle walking to test energy and digestion response.",
        "Avoid pushing intense exercise if it creates next-day fatigue.",
      ],
      formulaFamilies: [
        "TCM formula families commonly discussed for cold/low transformation depend on whether the focus is Spleen qi, Spleen yang, Kidney yang, or cold-damp.",
        "Practitioner review is needed before warming herbs/formulas, especially if heat signs, reflux, hypertension concerns, pregnancy, or medications are present.",
      ],
    },
    tryFirst: [
      "Use warm breakfast and warm drinks for three mornings; avoid starting the day with cold smoothies or iced drinks.",
      "Choose cooked meals with gentle spices such as ginger, cumin, or fennel if heat/reflux is not present.",
      "Use morning light and a short easy walk to test whether gentle warmth and movement improve energy.",
    ],
    observe: [
      "Track cold hands/feet, low appetite, bloating after cold food, loose stool, and low morning energy.",
      "Notice whether warmth improves comfort or creates heat/reflux.",
      "Track whether the tongue looks pale, wet, swollen, or tooth-marked on low-energy days.",
    ],
    questions: [
      "Are symptoms better from warmth and worse from cold?",
      "Is appetite low, variable, or heavy after meals?",
      "Does exercise restore energy or drain you the next day?",
    ],
  },
];

function scoreThemes(selected: Set<ChoiceKey>): Theme[] {
  const scores = [
    {
      index: 0,
      keys: ["thickCoat", "greasyCoat", "whiteCoat", "swollen", "teethMarks", "centerCoat", "rootCoat", "bloating", "lowEnergy", "looseStool"] as ChoiceKey[],
    },
    {
      index: 1,
      keys: ["red", "deepRed", "yellowCoat", "redTip", "redSides", "dry", "heat", "thirst", "poorSleep"] as ChoiceKey[],
    },
    {
      index: 2,
      keys: ["purple", "redSides", "redTip", "stress", "poorSleep", "bloating"] as ChoiceKey[],
    },
    {
      index: 3,
      keys: ["dry", "cracks", "peeledCoat", "thin", "thirst", "constipation", "poorSleep"] as ChoiceKey[],
    },
    {
      index: 4,
      keys: ["pale", "whiteCoat", "wet", "swollen", "teethMarks", "cold", "lowEnergy", "looseStool", "bloating"] as ChoiceKey[],
    },
  ];

  return scores
    .map(({ index, keys }) => {
      const signs = keys.filter((key) => selected.has(key));
      return { ...themeRules[index], score: signs.length, signs: signs.map(labelForChoice) };
    })
    .filter((theme) => theme.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function labelForChoice(key: ChoiceKey) {
  return observationGroups.flatMap((group) => group.choices).find((choice) => choice.key === key)?.label ?? key;
}

function selectionGuidance(count: number) {
  if (count < 4) return "Add a few more observations before trusting the pattern.";
  if (count < 8) return "Good first read. More symptom context will sharpen it.";
  return "Enough detail for a useful first-pass pattern reflection.";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Could not read this image file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image format could not be opened. Try a JPEG or PNG photo."));
    image.src = dataUrl;
  });
}

async function prepareTonguePhoto(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  const scale = Math.min(1, MAX_UPLOAD_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare this photo for analysis.");
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

function readableVisionError(body: any) {
  const rawDetail = typeof body?.detail === "string" ? body.detail : "";
  let detailMessage = rawDetail;
  try {
    const parsed = JSON.parse(rawDetail);
    detailMessage = parsed?.error?.message || detailMessage;
  } catch {
    // Keep the original detail text when the API returns plain text.
  }

  if (/unsupported|invalid|image|format|parse/i.test(detailMessage)) {
    return "This photo format could not be read by the AI. Try taking a fresh tongue photo with the camera or upload a JPEG/PNG image.";
  }
  if (/quota|billing|credits/i.test(detailMessage)) {
    return "The AI account needs active API credits before this photo can be analyzed.";
  }

  return body?.error || detailMessage || "Could not analyze this tongue photo.";
}

function ToggleCard({
  choice,
  active,
  onToggle,
}: {
  choice: Choice;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`min-h-[5.8rem] border p-3 text-left transition ${
        active ? "border-ink bg-ink text-white" : "border-ink/10 bg-white/78 text-ink hover:border-moss/35"
      }`}
    >
      <span className="block text-sm font-semibold leading-5">{choice.label}</span>
      <span className={`mt-2 block text-xs leading-5 ${active ? "text-white/70" : "text-ink/50"}`}>{choice.hint}</span>
    </button>
  );
}

export function TongueAssessmentApp() {
  const [selected, setSelected] = useState<Set<ChoiceKey>>(new Set());
  const [notes, setNotes] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState("");
  const [imagePreparing, setImagePreparing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const themes = useMemo(() => scoreThemes(selected), [selected]);
  const primary = themes[0];

  function toggle(key: ChoiceKey) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function analyzeTonguePhoto() {
    if (!imageDataUrl) {
      setVisionError("Upload a tongue photo first.");
      return;
    }
    setVisionError("");
    setVisionLoading(true);
    try {
      const response = await fetch("/api/tongue-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(readableVisionError(body));
      const result = body as VisionResult;
      setVisionResult(result);
      setSelected((current) => {
        const next = new Set([...current].filter((key) => !visualChoiceKeys.has(key)));
        for (const sign of result.detected_signs) {
          next.add(sign.key);
        }
        return next;
      });
    } catch (error) {
      setVisionError(error instanceof Error ? error.message : "Could not analyze this tongue photo.");
    } finally {
      setVisionLoading(false);
    }
  }

  function clearPhoto() {
    setImagePreview("");
    setImageDataUrl("");
    setVisionResult(null);
    setVisionError("");
    setSelected((current) => new Set([...current].filter((key) => !visualChoiceKeys.has(key))));
  }

  function clearSession() {
    setSelected(new Set());
    setNotes("");
    setImagePreview("");
    setImageDataUrl("");
    setVisionResult(null);
    setVisionError("");
    setFeedbackStatus("");
  }

  async function sendFeedback() {
    setFeedbackStatus("");
    setFeedbackSending(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: feedbackMessage,
          email: feedbackEmail,
          source: "tongue-test-app",
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not send feedback.");
      setFeedbackMessage("");
      setFeedbackEmail("");
      setFeedbackStatus("Thanks. Your feedback was sent.");
    } catch (error) {
      setFeedbackStatus(error instanceof Error ? error.message : "Could not send feedback.");
    } finally {
      setFeedbackSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6]">
      <div className="container-shell max-w-6xl py-8 md:py-12">
        <section className="border border-ink/10 bg-white p-5 shadow-card md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow mb-3">The Tongue Test</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] md:text-6xl">
                Upload a Tongue Photo. Discover What Your Tongue May Be Telling You.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-ink/68">
                AI-guided tongue observation inspired by Traditional Chinese Medicine — translated into
                plain-English wellness insights, food direction, and lifestyle reflections. The result is
                an educational pattern insight, not a medical diagnosis or treatment plan.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="border border-ink/10 bg-fog/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Free Preview</p>
                  <p className="mt-2 text-sm leading-6 text-ink/58">
                    Photo quality plus a short visible-feature preview.
                  </p>
                </div>
                <div className="border border-moss/25 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">$4.99 Full Report</p>
                  <p className="mt-2 text-sm leading-6 text-ink/58">
                    Full report plus one follow-up comparison.
                  </p>
                </div>
              </div>
              <div className="mt-5 max-w-2xl">
                <WellnessPurposeDisclosure compact />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {["Photo first", "Compare visible signs", "Read organ-system patterns"].map((item) => (
                  <div key={item} className="border border-ink/10 bg-fog/60 p-3 text-sm leading-6 text-ink/66">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-ink/10 bg-[#f7f4ed] p-4">
              <div className="mb-4 grid gap-4 sm:grid-cols-[7.5rem_1fr] sm:items-center">
                <div className="overflow-hidden border border-ink/10 bg-[#f7f4ed]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/tongue-assessment/tongue-map-logo.png"
                    alt="Chinese medicine tongue map"
                    className="aspect-[2/3] w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Tongue Map Lens</p>
                  <p className="mt-2 text-sm leading-6 text-ink/62">
                    The app reads visible tongue areas as a traditional Chinese medicine map, then compares
                    those signs with coating, color, moisture, and user context.
                  </p>
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Tongue Photo</p>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                The goal is to compare your photo against TCM tongue-atlas patterns. In this first version,
                the photo anchors the observation while you mark the signs the app should interpret for
                wellness education and self-reflection.
              </p>
              <p className="mt-2 text-xs leading-5 text-ink/48">
                Privacy note: your photo is prepared in the browser, then sent for AI-assisted review only
                when you tap analyze. Use the clear controls below to remove the current photo from this session.
              </p>
              <div className="mt-3 grid gap-2 text-xs leading-5 text-ink/54 sm:grid-cols-3">
                <span className="border border-ink/10 bg-white/62 p-2">Natural light</span>
                <span className="border border-ink/10 bg-white/62 p-2">No flash or filters</span>
                <span className="border border-ink/10 bg-white/62 p-2">Photo before food/coffee</span>
              </div>
              <div className="mt-4 border border-ink/10 bg-white/65 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Photo Guide</p>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  Open your mouth, relax the tongue, and center the full tongue inside the guide. Keep the
                  camera close enough to see color, coating, edges, and the center line.
                </p>
              </div>
              <label className="mt-4 block border border-dashed border-ink/18 bg-white/70 p-4 text-sm text-ink/60">
                Add tongue photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="mt-3 block w-full text-xs"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    setVisionResult(null);
                    setVisionError("");
                    if (!file) {
                      setImagePreview("");
                      setImageDataUrl("");
                      return;
                    }
                    setImagePreparing(true);
                    try {
                      const prepared = await prepareTonguePhoto(file);
                      setImagePreview(prepared);
                      setImageDataUrl(prepared);
                    } catch (error) {
                      setImagePreview("");
                      setImageDataUrl("");
                      setVisionError(error instanceof Error ? error.message : "Could not prepare this photo.");
                    } finally {
                      setImagePreparing(false);
                    }
                  }}
                />
              </label>
              {imagePreview ? (
                <div className="relative mt-4 overflow-hidden border border-ink/10 bg-ink">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Tongue reference preview" className="aspect-[4/3] w-full object-cover" />
                  <div className="pointer-events-none absolute inset-x-[24%] top-[18%] h-[64%] rounded-[50%] border-2 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.18)]" />
                  <div className="absolute inset-x-3 bottom-3 bg-ink/72 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.13em] text-white">
                    Tongue centered in guide
                  </div>
                </div>
              ) : (
                <div className="relative mt-4 flex aspect-[4/3] items-center justify-center overflow-hidden border border-ink/10 bg-[#efe9dd] text-sm text-ink/42">
                  <div className="absolute inset-x-[24%] top-[18%] h-[64%] rounded-[50%] border-2 border-ink/28" />
                  <div className="max-w-[15rem] px-5 text-center leading-6">
                    Center the full tongue inside the guide
                  </div>
                </div>
              )}
              {imagePreview ? (
                <button type="button" className="button-secondary mt-3 w-full" onClick={clearPhoto}>
                  Retake Or Replace Photo
                </button>
              ) : null}
              <button
                type="button"
                className="button-primary mt-4 w-full"
                disabled={!imageDataUrl || imagePreparing || visionLoading}
                onClick={analyzeTonguePhoto}
              >
                {imagePreparing ? "Preparing Photo..." : visionLoading ? "Reading Photo..." : "Analyze Tongue Photo With AI"}
              </button>
              {visionError ? (
                <p className="mt-3 border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{visionError}</p>
              ) : null}
              {visionResult ? (
                <article className="mt-4 border border-ink/10 bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">AI Visible Signs</p>
                  <p className="mt-2 text-xs leading-5 text-ink/50">
                    {visionResult.image_quality?.notes || visionResult.overall_note || "First-pass visual read."}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-ink/45">
                    Free preview: visible features and quality notes. The paid report expands this into a
                    structured review, clarifying questions, tracking notes, and follow-up comparison.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visionResult.detected_signs.map((sign) => (
                      <span key={sign.key} className="border border-ink/10 bg-fog px-2.5 py-1 text-xs text-ink/64">
                        {sign.label} · {sign.confidence}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-ink/10 pt-3">
                    <ShortResultDisclaimer />
                  </div>
                </article>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-4">
            {observationGroups.map((group) => (
              <article key={group.title} className="border border-ink/10 bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">{group.title}</p>
                    <p className="mt-1 text-sm leading-6 text-ink/58">{group.note}</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.14em] text-ink/42">
                    {group.choices.filter((choice) => selected.has(choice.key)).length} selected
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {group.choices.map((choice) => (
                    <ToggleCard
                      key={choice.key}
                      choice={choice}
                      active={selected.has(choice.key)}
                      onToggle={() => toggle(choice.key)}
                    />
                  ))}
                </div>
              </article>
            ))}

            <article className="border border-ink/10 bg-white p-5 shadow-card">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Your Notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  className="mt-3 w-full resize-y border border-ink/10 bg-fog/60 p-3 text-sm leading-6 outline-none focus:border-moss"
                  placeholder="Timing, digestion, sleep, stress, thirst, stool, cravings, anything that changed..."
                />
              </label>
            </article>

            <article className="border border-ink/10 bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Visual Comparison Library</p>
              <p className="mt-2 text-sm leading-6 text-ink/58">
                The photo-reading language is organized around picture-heavy tongue diagnosis references.
                These are the core visual sources for the app direction:
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/68">
                {visualSourceBooks.map((book) => (
                  <li key={book}>{book}</li>
                ))}
              </ul>
            </article>

            <article className="border border-ink/10 bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Tongue Map</p>
              <p className="mt-2 text-sm leading-6 text-ink/58">
                Chinese medicine reads tongue signs by location. This map helps explain why the result mentions specific organ systems.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {tongueZones.map((zone) => (
                  <div key={zone.zone} className="border border-ink/10 bg-fog/55 p-3">
                    <p className="text-sm font-semibold text-ink">{zone.zone}: {zone.systems}</p>
                    <p className="mt-1 text-xs leading-5 text-ink/58">{zone.meaning}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <section className="border border-ink/10 bg-white p-5 shadow-card md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow mb-3">TCM Photo Read</p>
                  <h2 className="text-3xl font-semibold leading-tight">
                    {primary?.title ?? "Add observations to build a tongue pattern."}
                  </h2>
                </div>
                <span className="border border-ink/10 bg-fog px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-ink/54">
                  {selected.size} signs
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-ink/62">{selectionGuidance(selected.size)}</p>

              {primary ? (
                <div className="mt-5 space-y-4">
                  <article className="border border-moss/20 bg-[#f8f7f1] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Primary Pattern Insight</p>
                    <p className="mt-2 text-sm leading-6 text-ink/72">{primary.plain}</p>
                    <p className="mt-3 text-xs leading-5 text-ink/48">Matched: {primary.signs.join(", ")}</p>
                    <div className="mt-3">
                      <ShortResultDisclaimer />
                    </div>
                  </article>

                  <OrganFocus organs={primary.organs} />
                  <PlainMeaning meaning={primary.meaning} />
                  <ResultList title="What To Try First" items={primary.tryFirst} />
                  <ResultList title="What To Observe Next" items={primary.observe} />
                  <FollowUpQuestions questions={primary.questions} />
                  <SupportDirection support={primary.support} />

                  {themes.slice(1).length ? (
                    <article className="border border-ink/10 bg-fog/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Secondary Signals</p>
                      <div className="mt-3 space-y-2">
                        {themes.slice(1).map((theme) => (
                          <p key={theme.title} className="text-sm leading-6 text-ink/68">
                            {theme.title}: {theme.signs.join(", ")}
                          </p>
                        ))}
                      </div>
                    </article>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-ink/58">
                  Start with color, coat, moisture, and one symptom. The result will appear here.
                </p>
              )}

              <div className="mt-5 space-y-3">
                <BasisOfInsightDisclosure />
                <FullMedicalDisclaimer compact />
                <EmergencyWarning />
                <ShortResultDisclaimer />
              </div>
            </section>
          </aside>
        </div>
        <section className="mt-5 grid gap-3 border border-ink/10 bg-white/72 p-5 md:grid-cols-[1fr_1fr]">
          <FullMedicalDisclaimer compact />
          <div className="space-y-3">
            <WellnessPurposeDisclosure compact />
            <EmergencyWarning />
          </div>
        </section>

        <section className="mt-5 border border-moss/20 bg-[#f8f7f1] p-5 shadow-card md:p-6">
          <div className="grid gap-5 md:grid-cols-[0.85fr_1.15fr] md:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Paid Report Path</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight">Unlock the full scan report.</h2>
              <p className="mt-3 text-sm leading-6 text-ink/58">
                The launch product is a $4.99 report with one follow-up comparison. The free layer stays
                limited to photo quality and a short visible-feature preview.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border border-ink/10 bg-white/75 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">One Scan</p>
                <p className="mt-3 font-serif text-4xl text-ink">$4.99</p>
                <p className="mt-2 text-sm leading-6 text-ink/60">Full report plus one follow-up comparison.</p>
              </div>
              <div className="border border-ink/10 bg-white/75 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Tracking</p>
                <p className="mt-3 font-serif text-4xl text-ink">$15/mo</p>
                <p className="mt-2 text-sm leading-6 text-ink/60">Up to 15 scans, history, and comparisons.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 border border-ink/10 bg-white/72 p-5 shadow-card md:p-6">
          <div className="grid gap-5 md:grid-cols-[0.85fr_1.15fr] md:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Privacy Controls</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight">Clear this session.</h2>
              <p className="mt-3 text-sm leading-6 text-ink/58">
                This removes the current photo preview, notes, AI visible signs, and selected observations from this browser session.
              </p>
            </div>
            <button type="button" className="button-secondary self-start" onClick={clearSession}>
              Clear Current Photo And Notes
            </button>
          </div>
        </section>

        <section className="mt-5 border border-ink/10 bg-white p-5 shadow-card md:p-6">
          <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Feedback</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight">Help shape The Tongue Test</h2>
              <p className="mt-3 text-sm leading-6 text-ink/58">
                Tell us what felt useful, confusing, missing, or inaccurate. Early feedback helps make the
                result clearer before public launch.
              </p>
            </div>
            <div>
              <textarea
                value={feedbackMessage}
                onChange={(event) => setFeedbackMessage(event.target.value)}
                rows={4}
                className="w-full resize-y border border-ink/10 bg-fog/60 p-3 text-sm leading-6 outline-none focus:border-moss"
                placeholder="What should we improve, add, remove, or explain better?"
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={feedbackEmail}
                  onChange={(event) => setFeedbackEmail(event.target.value)}
                  className="border border-ink/10 bg-fog/60 px-3 py-3 text-sm outline-none focus:border-moss"
                  placeholder="Email optional"
                  type="email"
                />
                <button
                  type="button"
                  className="button-secondary"
                  disabled={feedbackSending}
                  onClick={sendFeedback}
                >
                  {feedbackSending ? "Sending..." : "Send Feedback"}
                </button>
              </div>
              {feedbackStatus ? <p className="mt-3 text-sm leading-6 text-ink/58">{feedbackStatus}</p> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SupportDirection({ support }: { support: Theme["support"] }) {
  return (
    <article className="border border-moss/20 bg-[#f8f7f1] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Final Step · TCM Support Direction</p>
      <p className="mt-2 text-sm leading-6 text-ink/62">
        These are tradition-based educational possibilities to discuss or explore carefully with a qualified professional.
        They are not instructions, prescriptions, or medical recommendations.
      </p>
      <div className="mt-4 grid gap-3">
        <SupportColumn title="Food Direction" items={support.foods} />
        <SupportColumn title="Lifestyle Direction" items={support.lifestyle} />
        <SupportColumn title="Formula / Herb Families" items={support.formulaFamilies} />
      </div>
    </article>
  );
}

function SupportColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border border-ink/10 bg-white/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">{title}</p>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-ink/68">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function OrganFocus({ organs }: { organs: OrganSignal[] }) {
  return (
    <article className="border border-ink/10 bg-white/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Organ / System Focus</p>
      <div className="mt-3 space-y-3">
        {organs.map((organ) => (
          <div key={organ.system} className="border-l-2 border-moss/35 pl-3">
            <p className="text-sm font-semibold leading-6 text-ink">{organ.system}</p>
            <p className="mt-1 text-sm leading-6 text-ink/68">{organ.meaning}</p>
            <p className="mt-1 text-xs leading-5 text-ink/45">{organ.why}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function PlainMeaning({ meaning }: { meaning: string }) {
  return (
    <article className="border border-ink/10 bg-white/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">What This May Mean In Plain English</p>
      <p className="mt-2 text-sm leading-6 text-ink/70">{meaning}</p>
    </article>
  );
}

function FollowUpQuestions({ questions }: { questions: string[] }) {
  return (
    <article className="border border-ink/10 bg-white/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Make This More Precise</p>
      <p className="mt-2 text-sm leading-6 text-ink/66">
        The photo gives a first read. Answering a few follow-up questions would help separate similar
        patterns and make the wellness direction more precise.
      </p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
        {questions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <button type="button" className="button-secondary mt-4 w-full">
        Answer Follow-Up Questions
      </button>
    </article>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="border border-ink/10 bg-white/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
