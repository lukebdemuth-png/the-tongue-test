"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

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

type HerbSuggestion = {
  name: string;
  why: string;
  functions: string[];
  simple: string;
};

type DietarySuggestion = {
  principle: string;
  favor: string[];
  reduce: string[];
  daily: string[];
  meals: string[];
  recipe: string;
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

type IntakeQuestion = {
  id: string;
  question: string;
  options: [string, string, string, string];
  mapsTo: ChoiceKey[];
};

type IntakeAnswer = {
  selected: string;
  custom?: string;
};

type AccessChoice = "trial" | "one-time" | null;

const MAX_UPLOAD_EDGE = 1400;
const JPEG_QUALITY = 0.82;
const MIN_INTAKE_ANSWERS = 10;

const explainOption = "Let me explain in my own words";

const intakeQuestions: IntakeQuestion[] = [
  {
    id: "wake_energy",
    question: "Do you usually feel energized when you wake up?",
    options: ["I usually wake feeling refreshed and clear", "I wake up tired and need time to function", "I feel exhausted even after sleeping", explainOption],
    mapsTo: ["lowEnergy"],
  },
  {
    id: "energy_crash",
    question: "What time of day does your energy crash the most?",
    options: ["Morning", "Afternoon", "Evening/night", explainOption],
    mapsTo: ["lowEnergy"],
  },
  {
    id: "push_exhaustion",
    question: "Do you often push through exhaustion instead of resting?",
    options: ["Rarely", "Sometimes", "Almost constantly", explainOption],
    mapsTo: ["lowEnergy", "stress"],
  },
  {
    id: "heavy_after_eating",
    question: "Do you feel physically heavy, sluggish, or foggy after eating?",
    options: ["Rarely", "Occasionally", "Frequently", explainOption],
    mapsTo: ["bloating", "lowEnergy"],
  },
  {
    id: "drained_type",
    question: "Do you feel more drained mentally or physically lately?",
    options: ["Mostly mentally drained", "Mostly physically drained", "Both equally", explainOption],
    mapsTo: ["lowEnergy", "stress"],
  },
  {
    id: "overthink",
    question: "Do you tend to overthink while eating or working?",
    options: ["Rarely", "Sometimes", "Constantly", explainOption],
    mapsTo: ["stress", "bloating"],
  },
  {
    id: "bloating_frequency",
    question: "How often do you experience bloating or sluggish digestion?",
    options: ["Rarely", "A few times a week", "Almost daily", explainOption],
    mapsTo: ["bloating"],
  },
  {
    id: "comfort_foods",
    question: "Do you crave sugar, bread, or comfort foods when stressed?",
    options: ["Rarely", "Sometimes", "Very often", explainOption],
    mapsTo: ["bloating", "stress"],
  },
  {
    id: "warm_or_cold_food",
    question: "Do you generally feel better with warm foods or cold/raw foods?",
    options: ["Warm cooked foods", "Cold/raw foods", "I notice no difference", explainOption],
    mapsTo: ["cold", "heat"],
  },
  {
    id: "stress_appetite",
    question: "Does stress strongly affect your appetite?",
    options: ["I lose my appetite", "I eat more when stressed", "My appetite changes unpredictably", explainOption],
    mapsTo: ["stress", "bloating"],
  },
  {
    id: "meal_nourishment",
    question: "Do you feel nourished after meals?",
    options: ["Usually energized and grounded", "Sometimes tired afterward", "Often heavy or depleted afterward", explainOption],
    mapsTo: ["lowEnergy", "bloating"],
  },
  {
    id: "suppressed_frustration",
    question: "Do you suppress frustration until it builds internally?",
    options: ["Rarely", "Sometimes", "Frequently", explainOption],
    mapsTo: ["stress"],
  },
  {
    id: "irritability",
    question: "Do you experience irritability or emotional tension easily?",
    options: ["Rarely", "Sometimes", "Very easily", explainOption],
    mapsTo: ["stress", "heat"],
  },
  {
    id: "emotionally_stuck",
    question: "Do you feel emotionally “stuck” right now?",
    options: ["Not really", "Somewhat", "Strongly", explainOption],
    mapsTo: ["stress"],
  },
  {
    id: "body_tension",
    question: "Do you experience chest, rib, neck, or shoulder tension?",
    options: ["Rarely", "Sometimes", "Frequently", explainOption],
    mapsTo: ["stress"],
  },
  {
    id: "night_waking",
    question: "Do you wake during the night?",
    options: ["Rarely", "Occasionally", "Frequently, especially between 1–3 AM", explainOption],
    mapsTo: ["poorSleep", "stress"],
  },
  {
    id: "stress_reaction",
    question: "When stressed, how do you usually react?",
    options: ["I withdraw inward", "I become emotionally reactive", "I become controlling or impatient", explainOption],
    mapsTo: ["stress", "heat"],
  },
  {
    id: "resting_mind",
    question: "Does your mind feel calm when you try to rest?",
    options: ["Usually calm", "Somewhat restless", "Constantly active or racing", explainOption],
    mapsTo: ["poorSleep", "stress"],
  },
  {
    id: "presence",
    question: "Do you struggle to feel fully present or settled?",
    options: ["Rarely", "Sometimes", "Frequently", explainOption],
    mapsTo: ["stress", "lowEnergy"],
  },
  {
    id: "racing_thoughts",
    question: "Do you experience racing thoughts or overstimulation?",
    options: ["Rarely", "Sometimes", "Frequently", explainOption],
    mapsTo: ["poorSleep", "stress", "heat"],
  },
  {
    id: "emotional_connection",
    question: "Do you feel emotionally connected to others lately?",
    options: ["Mostly yes", "Sometimes disconnected", "Often isolated or emotionally distant", explainOption],
    mapsTo: ["stress", "lowEnergy"],
  },
  {
    id: "sleep_description",
    question: "How would you describe your sleep?",
    options: ["Deep and restorative", "Light or interrupted", "Restless with vivid dreams or waking", explainOption],
    mapsTo: ["poorSleep", "heat"],
  },
  {
    id: "inner_state",
    question: "How would you describe your inner emotional state lately?",
    options: ["Peaceful and balanced", "Stressed or unsettled", "Overwhelmed or emotionally scattered", explainOption],
    mapsTo: ["stress", "poorSleep"],
  },
  {
    id: "grief_heaviness",
    question: "Is there grief, sadness, or emotional heaviness you haven’t processed?",
    options: ["Not really", "Somewhat", "Deeply", explainOption],
    mapsTo: ["lowEnergy", "stress"],
  },
  {
    id: "guarded",
    question: "Do you feel emotionally guarded or disconnected?",
    options: ["Rarely", "Sometimes", "Frequently", explainOption],
    mapsTo: ["stress"],
  },
  {
    id: "chest_breath_tension",
    question: "Do you hold tension in your chest, shoulders, or breath?",
    options: ["Rarely", "Sometimes", "Constantly", explainOption],
    mapsTo: ["stress"],
  },
  {
    id: "breathing",
    question: "How would you describe your breathing?",
    options: ["Deep and relaxed", "Sometimes shallow", "Often tight or restricted", explainOption],
    mapsTo: ["stress"],
  },
  {
    id: "safe_supported",
    question: "Do you feel safe and supported in your life right now?",
    options: ["Mostly yes", "Somewhat uncertain", "Frequently unsafe, unstable, or unsupported", explainOption],
    mapsTo: ["stress", "lowEnergy"],
  },
  {
    id: "survival_pressure",
    question: "Do you feel driven by fear, urgency, or survival pressure?",
    options: ["Rarely", "Sometimes", "Constantly", explainOption],
    mapsTo: ["stress", "poorSleep"],
  },
  {
    id: "burnout",
    question: "Do you feel chronically depleted or burnt out?",
    options: ["Rarely", "Occasionally", "Deeply and consistently", explainOption],
    mapsTo: ["lowEnergy", "poorSleep"],
  },
];

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
  "Giovanni Maciocia, The Foundations of Chinese Medicine",
  "Giovanni Maciocia, Diagnosis in Chinese Medicine: A Comprehensive Guide",
  "Giovanni Maciocia, Tongue Diagnosis in Chinese Medicine",
  "Barbara Kirschbaum, Atlas of Chinese Tongue Diagnosis",
  "Claus C. Schnorrenberger and Beate Schnorrenberger, Pocket Atlas of Tongue Diagnosis",
];

const reportLinks = {
  instagram: "https://instagram.com/thetonguetest",
  newsletter: "/#updates",
  website: "/",
};

const vendorGuidance =
  "Copy and paste this herb name into a trusted Chinese herb supplier such as Kamwo, Mayway, ActiveHerb, Plum Flower, ChineseHerbsDirect, or Mountain Rose Herbs.";

const herbSuggestionsByPattern: Record<string, HerbSuggestion[]> = {
  "Damp / Sluggish Digestion Pattern": [
    {
      name: "Bai Zhu 白术 — Atractylodes Rhizome",
      why: "Chosen because this tongue pattern may suggest Spleen Qi weakness with Dampness, and Bai Zhu is traditionally used in TCM to strengthen the Spleen and dry Damp.",
      functions: ["Tonifies Spleen Qi", "Dries Dampness", "Supports fluid transformation", "Helps stabilize the exterior in TCM"],
      simple: "Think of this as a classic herb for supporting digestive energy and reducing damp, heavy patterns.",
    },
    {
      name: "Fu Ling 茯苓 — Poria",
      why: "Chosen because thick, wet, or greasy coating may suggest fluid accumulation, and Fu Ling is traditionally used to leach Dampness while supporting Spleen function.",
      functions: ["Leaches Dampness", "Strengthens the Spleen", "Calms the Shen in TCM", "Supports urination in traditional use"],
      simple: "Think of this as a gentle classic herb for helping the body process excess fluid and heaviness.",
    },
    {
      name: "Chen Pi 陈皮 — Aged Tangerine Peel",
      why: "Chosen because bloating, coating, and stress-digestion patterns may suggest Qi not moving well in the Middle Burner.",
      functions: ["Regulates Qi", "Dries Dampness", "Transforms Phlegm", "Supports digestion in TCM"],
      simple: "Think of this as a classic aromatic herb for helping stuck digestion move more smoothly.",
    },
    {
      name: "Sha Ren 砂仁 — Amomum Fruit",
      why: "Chosen for damp, sluggish digestion with bloating or nausea tendencies; it is traditionally used to awaken the Spleen and move Qi.",
      functions: ["Transforms Dampness", "Moves Qi", "Warms the Middle", "Supports appetite and post-meal comfort in TCM"],
      simple: "Think of this as a warming aromatic herb for heavy, stuck, uncomfortable digestion.",
    },
  ],
  "Heat / Irritation Pattern": [
    {
      name: "Huang Qin 黄芩 — Scutellaria Root",
      why: "Chosen because red/yellow tongue signs may suggest Heat or Damp-Heat, and Huang Qin is traditionally used to clear Heat and dry Dampness.",
      functions: ["Clears Heat", "Dries Dampness", "Clears upper burner Heat", "Supports hot, irritated patterns in TCM"],
      simple: "Think of this as a classic herb for heat and damp-heat patterns, not a casual daily tonic.",
    },
    {
      name: "Lian Qiao 连翘 — Forsythia Fruit",
      why: "Chosen because red, irritated, or upper-body heat signs may suggest Heat toxin or constrained Heat in traditional language.",
      functions: ["Clears Heat", "Resolves toxicity in TCM", "Disperses clumping", "Supports red, irritated presentations traditionally"],
      simple: "Think of this as a cooling herb traditionally used when heat signs feel more inflamed or irritated.",
    },
    {
      name: "Zhi Zi 栀子 — Gardenia Fruit",
      why: "Chosen because Heat patterns with restlessness, irritability, or yellow coating may involve Heat affecting the chest, digestion, or emotional state.",
      functions: ["Drains Fire", "Clears Damp-Heat", "Cools irritability in TCM", "Supports urination in traditional use"],
      simple: "Think of this as a cooling herb for heat that feels restless, stuck, or agitating.",
    },
    {
      name: "Mai Men Dong 麦门冬 — Ophiopogon Tuber",
      why: "Chosen when heat signs appear with dryness, thirst, peeled coat, or reduced moisture.",
      functions: ["Nourishes Yin", "Moistens dryness", "Clears deficiency Heat", "Supports Stomach/Lung fluids in TCM"],
      simple: "Think of this as a moistening herb for heat that seems to dry the system out.",
    },
  ],
  "Constraint / Tension Pattern": [
    {
      name: "Chai Hu 柴胡 — Bupleurum Root",
      why: "Chosen because stress, red sides, rib/neck tension, or pressure patterns may suggest Liver Qi constraint.",
      functions: ["Spreads Liver Qi", "Harmonizes Shaoyang", "Raises clear Yang", "Supports constraint patterns in TCM"],
      simple: "Think of this as a classic herb for helping constrained energy move more freely.",
    },
    {
      name: "Xiang Fu 香附 — Cyperus Rhizome",
      why: "Chosen because emotional tension and digestive disruption may suggest Qi stagnation affecting the middle and sides.",
      functions: ["Regulates Qi", "Soothes Liver constraint", "Supports digestive Qi movement", "Used for cyclical/emotional constraint patterns in TCM"],
      simple: "Think of this as an herb for stress patterns that show up as tightness, mood tension, or digestion changes.",
    },
    {
      name: "Bai Shao 白芍 — White Peony Root",
      why: "Chosen because constraint can combine with tension, irritability, or depletion; Bai Shao is traditionally used to nourish Blood and soften the Liver.",
      functions: ["Nourishes Blood", "Softens the Liver", "Preserves Yin", "Supports tension patterns in TCM"],
      simple: "Think of this as a balancing herb when stress tension needs softening rather than forcing.",
    },
    {
      name: "Chen Pi 陈皮 — Aged Tangerine Peel",
      why: "Chosen when stress clearly affects appetite, belching, bloating, or post-meal comfort.",
      functions: ["Regulates Qi", "Supports the Middle Burner", "Dries Dampness", "Transforms Phlegm"],
      simple: "Think of this as a simple aromatic herb for stuck digestion under stress.",
    },
  ],
  "Dryness / Fluid Depletion Pattern": [
    {
      name: "Mai Men Dong 麦门冬 — Ophiopogon Tuber",
      why: "Chosen because peeled coat, dry tongue, thirst, or dryness may suggest Yin/fluid depletion.",
      functions: ["Nourishes Yin", "Generates fluids", "Moistens dryness", "Clears deficiency Heat"],
      simple: "Think of this as a classic moistening herb for dry, depleted patterns.",
    },
    {
      name: "Sha Shen 沙参 — Glehnia/Adenophora Root",
      why: "Chosen when dryness appears with throat, mouth, or digestive fluid depletion signs.",
      functions: ["Nourishes Yin", "Clears mild Heat", "Moistens Lung/Stomach dryness", "Generates fluids"],
      simple: "Think of this as a gentle herb for supporting moisture when the system feels dry or depleted.",
    },
    {
      name: "Sheng Di Huang 生地黄 — Rehmannia Root",
      why: "Chosen because red/dry signs may suggest Heat affecting fluids or deeper Yin/Blood layers.",
      functions: ["Clears Heat", "Cools Blood", "Nourishes Yin", "Generates fluids"],
      simple: "Think of this as a deeper cooling and nourishing herb used when heat and dryness overlap.",
    },
    {
      name: "Gou Qi Zi 枸杞子 — Goji Berry",
      why: "Chosen when dryness and depletion look milder and more nourishing support may be appropriate.",
      functions: ["Nourishes Liver and Kidney", "Supports Yin and Blood", "Benefits eyes in TCM", "Supports constitutional depletion patterns"],
      simple: "Think of this as a familiar food-like herb for nourishment and gentle Yin/Blood support.",
    },
  ],
  "Cold / Low Transformation Pattern": [
    {
      name: "Gan Jiang 干姜 — Dried Ginger",
      why: "Chosen because pale, wet, cold, low-energy patterns may suggest Cold in the Middle Burner.",
      functions: ["Warms the Middle", "Restores Yang in TCM", "Warms channels", "Transforms cold-fluid patterns"],
      simple: "Think of this as a classic warming herb for cold, sluggish digestive patterns.",
    },
    {
      name: "Rou Gui 肉桂 — Cinnamon Bark",
      why: "Chosen when deeper cold or Yang weakness is part of the pattern, especially lower-body cold or chronic depletion.",
      functions: ["Warms Kidney Yang", "Warms channels", "Disperses Cold", "Supports Mingmen fire in TCM"],
      simple: "Think of this as a strong warming herb that needs care and practitioner guidance.",
    },
    {
      name: "Dang Shen 党参 — Codonopsis Root",
      why: "Chosen because low energy with weak digestion may suggest Spleen Qi deficiency.",
      functions: ["Tonifies Qi", "Strengthens Spleen/Lung", "Supports fluids mildly", "Used for fatigue patterns in TCM"],
      simple: "Think of this as a Qi-supporting herb for tired digestion and low vitality.",
    },
    {
      name: "Bai Zhu 白术 — Atractylodes Rhizome",
      why: "Chosen because cold, damp, tooth-marked, swollen patterns often need Spleen support and Damp transformation.",
      functions: ["Tonifies Spleen Qi", "Dries Dampness", "Supports transformation", "Helps stabilize in TCM"],
      simple: "Think of this as digestive support for cold, heavy, damp patterns.",
    },
  ],
};

const dietarySuggestionsByPattern: Record<string, DietarySuggestion> = {
  "Damp / Sluggish Digestion Pattern": {
    principle:
      "In TCM dietary therapy, this pattern may suggest Dampness with weakened Spleen Qi, so warm, cooked, simple meals are traditionally preferred over cold, greasy, sweet, or heavy foods.",
    favor: ["rice congee", "oatmeal with cinnamon", "ginger tea", "chicken soup", "bone broth", "roasted sweet potatoes", "steamed carrots", "cooked greens", "mushrooms", "simple eggs or fish"],
    reduce: ["iced drinks", "cold smoothies", "greasy takeout", "heavy dairy", "processed sugar", "late-night overeating", "large raw salads when digestion feels weak"],
    daily: ["Start the morning with warm food instead of a cold smoothie.", "Favor cooked meals over raw meals for a few weeks.", "Sip warm ginger or fennel tea during the day.", "Keep dinner lighter and earlier when possible."],
    meals: ["Breakfast: oatmeal with cinnamon, walnuts, and dates.", "Lunch: chicken soup with root vegetables and rice.", "Dinner: rice bowl with salmon and steamed greens.", "Snack: warm tea with a small handful of walnuts."],
    recipe: "Simple Ginger Congee: simmer rice with extra water until soft and porridge-like. Add fresh ginger slices and a pinch of sea salt.",
  },
  "Heat / Irritation Pattern": {
    principle:
      "In TCM dietary therapy, red/yellow/irritated signs may suggest Heat or Damp-Heat, so lighter, cooling, hydrating foods are traditionally favored while still protecting digestion.",
    favor: ["cucumber", "celery", "zucchini", "mung beans", "cooked greens", "pears", "melon", "rice", "mint tea", "chrysanthemum tea", "white fish", "tofu if tolerated"],
    reduce: ["alcohol", "spicy food", "fried food", "coffee on an empty stomach", "late heavy dinners", "greasy foods", "excess red meat"],
    daily: ["Keep dinner lighter when sleep or reflux is worse.", "Choose cooked cooling foods if raw foods upset digestion.", "Hydrate steadily through the day.", "Avoid stacking spicy food, alcohol, intense workouts, and late screens on the same day."],
    meals: ["Breakfast: rice porridge with pear or apple.", "Lunch: rice bowl with white fish, cucumber, and cooked greens.", "Dinner: mung bean soup or miso-style soup with tofu and vegetables.", "Snack: pear with a little cinnamon if digestion tolerates it."],
    recipe: "Cooling Mung Soup: simmer mung beans until soft with plenty of water. Keep it simple; add a pinch of sea salt and cooked greens.",
  },
  "Constraint / Tension Pattern": {
    principle:
      "In TCM dietary therapy, Liver Qi constraint benefits from regular meals and gentle movement of Qi, especially when stress affects appetite, bloating, or tension.",
    favor: ["warm rice bowls", "light soups", "citrus peel tea", "mint tea", "basil", "fennel", "scallions", "cooked leafy greens", "salmon", "eggs", "simple proteins"],
    reduce: ["skipped meals", "too much caffeine", "eating while angry", "late heavy meals", "overeating after stress", "very restrictive dieting"],
    daily: ["Eat before you are depleted and wired.", "Take three slow breaths before meals.", "Use a short walk after stressful work blocks.", "Favor simple meals over complicated restriction."],
    meals: ["Breakfast: eggs with cooked greens and rice.", "Lunch: salmon rice bowl with steamed vegetables.", "Dinner: vegetable soup with scallion and ginger.", "Snack: mint or citrus peel tea."],
    recipe: "Stress-Digestion Tea: steep fresh mint with a small piece of orange peel. Sip warm after meals or during tense work periods.",
  },
  "Dryness / Fluid Depletion Pattern": {
    principle:
      "In TCM dietary therapy, dryness or peeled/cracked signs may suggest reduced Yin or body fluids, so moistening, nourishing, cooked foods are traditionally preferred.",
    favor: ["soups", "stews", "oatmeal", "rice porridge", "cooked pears", "black sesame", "tahini", "eggs", "tofu", "seaweed", "goji berries", "warm fluids"],
    reduce: ["late caffeine", "alcohol", "dry snacks", "excess spicy food", "fasting", "over-cleansing", "too little sleep"],
    daily: ["Use warm fluids steadily through the day.", "Choose moist cooked meals instead of dry snacks.", "Protect sleep before adding stronger interventions.", "Avoid extreme cleansing if you already feel depleted."],
    meals: ["Breakfast: oatmeal with tahini, dates, and walnuts.", "Lunch: stew with root vegetables and rice.", "Dinner: tofu soup with seaweed and cooked greens.", "Snack: cooked pear with black sesame."],
    recipe: "Moistening Pear Bowl: gently cook pear slices with a splash of water until soft. Top with black sesame or a small spoon of tahini.",
  },
  "Cold / Low Transformation Pattern": {
    principle:
      "In TCM dietary therapy, pale/wet/cold patterns may suggest weak warming and transformation, so warm cooked meals and gentle spices are traditionally favored.",
    favor: ["warm oatmeal", "rice porridge", "ginger tea", "chicken broth", "root vegetable stew", "roasted carrots", "sweet potatoes", "cooked greens", "eggs", "warming spices like ginger, cinnamon, fennel, cumin"],
    reduce: ["iced drinks", "cold smoothies", "raw-heavy meals", "excess salads", "skipping breakfast", "large cold fruit bowls", "overexertion without recovery"],
    daily: ["Start with warm breakfast for a week.", "Keep the abdomen and feet warm.", "Choose soups and stews when energy is low.", "Use gentle walking rather than intense exercise if workouts drain you."],
    meals: ["Breakfast: warm oatmeal with cinnamon and walnuts.", "Lunch: chicken broth soup with rice and root vegetables.", "Dinner: ginger vegetable stir-fry with rice.", "Snack: warm ginger tea."],
    recipe: "Warming Ginger Broth: simmer sliced ginger in broth for 10 minutes. Add cooked rice, carrots, greens, and simple protein.",
  },
};

const themeRules: Omit<Theme, "score" | "signs">[] = [
  {
    title: "Damp / Sluggish Digestion Pattern",
    plain:
      "The clearest reading is heaviness in the digestive-fluid system: the body may be struggling to transform food and fluids cleanly.",
    meaning:
      "In plain English, this often means digestion and fluid metabolism are the first places to look. If meals leave you heavy, foggy, bloated, loose, sticky, or tired, this pattern becomes more convincing.",
    organs: [
      {
        system: "Spleen Qi / Spleen Yang with Damp accumulation",
        meaning: "Technical read: impaired yun hua, or Spleen transformation and transportation, with Damp obstructing the Middle Burner. This points to weaker movement of food, fluids, and post-meal energy.",
        why: "Decoded: the body may be turning meals and fluids into heaviness instead of clean energy. Thick coat, greasy coat, swelling, tooth marks, center coat, bloating, fog, and loose stool strengthen this direction.",
      },
      {
        system: "Middle Burner Qi Dynamic",
        meaning: "Technical read: the zhong jiao, or Middle Burner, is the digestive axis where Stomach receiving/rotting-ripening and Spleen transformation should coordinate.",
        why: "Decoded: appetite, meal timing, post-meal heaviness, stool texture, coating thickness, and morning energy are one connected digestive pattern. Center coating plus digestive symptoms carries more weight than either sign alone.",
      },
    ],
    support: {
      foods: [
        "Favor warm cooked meals, soups, congee, rice, millet, squash, carrots, yams, cooked greens, mushrooms, ginger-scallion broth, and simple proteins.",
        "Use digestive spices gently if tolerated: fresh ginger, fennel, cumin, cardamom, orange peel, and small amounts of cinnamon.",
        "Choose breakfast that is warm and simple rather than cold, raw, sweet, or skipped.",
        "Reduce iced drinks, cold smoothies, grazing, greasy foods, late heavy meals, heavy dairy, and excess sugar during the test.",
      ],
      lifestyle: [
        "Use a consistent meal rhythm, ideally with the largest meal earlier in the day.",
        "Take a short relaxed walk after the largest meal to support movement through the middle burner.",
        "Eat without screens or rushing for the first five minutes of the meal.",
        "Notice whether damp signs increase after sugar, fried food, dairy, cold drinks, or eating while stressed.",
      ],
      formulaFamilies: [
        "Top 3 formula families to research: Liu Jun Zi Tang, Xiang Sha Liu Jun Zi Tang, and Ping Wei San.",
        "Liu Jun Zi Tang is traditionally used to support Spleen Qi with damp/phlegm tendencies; it tonifies digestion while helping transform dampness.",
        "Xiang Sha Liu Jun Zi Tang adds aromatic movement for bloating, nausea, appetite disruption, and stress-affected digestion.",
        "Ping Wei San is a stronger damp-transforming and middle-regulating direction often discussed when heaviness, thick coat, and food stagnation are prominent.",
        "Store links can be added after vendor review, so users can compare practitioner-quality sources instead of random supplement listings.",
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
        system: "Stomach Heat / Middle Burner Heat",
        meaning: "Technical read: yang ming or Stomach-channel Heat may be agitating the digestive center, especially when Heat combines with coating changes.",
        why: "Decoded: digestion may be running hot or irritated. Appetite, reflux, thirst, mouth dryness, bad breath, yellow coat, constipation, and symptoms after spicy, fried, alcohol, coffee, or late meals make this stronger.",
      },
      {
        system: "Heart Fire / Shen Disturbance",
        meaning: "Technical read: Heart Fire or Shen disturbance may be present when upper/tip redness pairs with restless sleep or emotional overstimulation.",
        why: "Decoded: the mind-body system may be too activated at night. Red tip, vivid dreams, insomnia, anxiety, mouth dryness, agitation, or feeling wired make this direction more relevant.",
      },
      {
        system: "Liver / Gallbladder Heat or Damp-Heat",
        meaning: "Technical read: Liver/Gallbladder Heat or Damp-Heat becomes relevant when constrained Qi generates Heat or when Damp combines with Heat in the shaoyang/liver-gallbladder layer.",
        why: "Decoded: pressure may be turning into heat, irritability, tension, headaches, bitter taste, rib tightness, or sticky digestion. Red sides have more value when the intake also shows stress or irritability.",
      },
    ],
    support: {
      foods: [
        "Favor simple cooling foods when tolerated: cooked greens, celery, cucumber, zucchini, mung beans, rice, pears, melon, chrysanthemum tea, mint tea, and lighter evening meals.",
        "If digestion is weak, keep cooling foods mostly cooked or room-temperature rather than iced or raw-heavy.",
        "Use bitter greens gently when appropriate: dandelion greens, arugula, escarole, or lightly cooked leafy greens.",
        "Reduce alcohol, spicy foods, fried foods, coffee on an empty stomach, and late heavy meals.",
      ],
      lifestyle: [
        "Lower evening heat load: cooler room, lighter dinner, less late work, and reduced stimulation before sleep.",
        "Avoid stacking heat triggers on the same day: alcohol, spicy food, intense workouts, late screens, and emotional conflict.",
        "Use calm breathing or a slow walk to downshift heat that is tied to stress.",
        "Track whether heat signs respond better to cooling or whether cooling weakens digestion.",
      ],
      formulaFamilies: [
        "Top 3 formula families to research: Huang Lian Jie Du Tang, Long Dan Xie Gan Tang, and Qing Wei San.",
        "Huang Lian Jie Du Tang is a strong Heat-clearing direction traditionally discussed for intense excess Heat signs; it is not a casual wellness formula.",
        "Long Dan Xie Gan Tang is traditionally discussed for Liver/Gallbladder Damp-Heat patterns with irritability, bitter taste, red sides, or lower burner damp-heat signs.",
        "Qing Wei San is traditionally discussed for Stomach Heat signs such as mouth/gum heat, strong thirst, bad breath, or heat in the digestive center.",
        "Store links can be added only after vendor and safety review because Heat-clearing formulas can be too strong or wrong for depleted/cold users.",
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
        system: "Liver Qi Stagnation / Constraint",
        meaning: "Technical read: gan qi yu jie, or Liver Qi constraint, means the Liver's free coursing function is not moving smoothly through mood, breath, digestion, cycle rhythms, and muscle tension.",
        why: "Decoded: stress may be getting held in the body. Suppressed frustration, red sides, purple tone, rib/chest/neck tension, sighing, headaches, and stress-affected appetite strengthen this direction.",
      },
      {
        system: "Liver Overacting On Spleen / Stomach",
        meaning: "Technical read: Liver overacting on Spleen/Stomach describes constrained Liver Qi disrupting the Middle Burner's digestive rhythm.",
        why: "Decoded: stress does not stay only emotional. It can show up as appetite changes, bloating, stool changes, reflux, nausea, or post-meal discomfort.",
      },
    ],
    support: {
      foods: [
        "Favor steady meals that prevent stress-related skipping, caffeine spikes, and late heavy eating.",
        "Use aromatic, movement-supportive foods when tolerated: citrus peel, basil, mint, fennel, scallion, ginger, small amounts of vinegar, and lightly cooked greens.",
        "If digestion tightens under stress, choose warm easy meals before adding strong cleansing or restrictive diets.",
        "Reduce eating while angry, rushed, multitasking, or emotionally compressed; this is often more important than the exact food.",
      ],
      lifestyle: [
        "Use movement to move constraint: walking, gentle stretching, shaking out tension, breath before meals, or a short qigong flow.",
        "Create a decompression ritual after high-pressure blocks before eating or sleeping.",
        "Track jaw, neck, shoulder, rib, chest, and diaphragm tension as part of the pattern.",
        "Give emotion a clean outlet: journaling, voice notes, direct conversation, breathwork, or non-exhaustive movement.",
      ],
      formulaFamilies: [
        "Top 3 formula families to research: Xiao Yao San, Jia Wei Xiao Yao San, and Chai Hu Shu Gan San.",
        "Xiao Yao San is traditionally discussed for Liver Qi constraint with Spleen weakness, stress-digestion interaction, mood tension, and fatigue.",
        "Jia Wei Xiao Yao San adds Heat-clearing emphasis when constraint turns into irritability, heat, red sides, or restless sleep.",
        "Chai Hu Shu Gan San is a more moving direction traditionally discussed for stronger Qi constraint, rib/chest tension, belching, and pressure-related symptoms.",
        "Store links can be added after deciding which suppliers meet quality standards and which formulas need stronger warnings.",
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
        system: "Stomach Yin / Body Fluid Depletion",
        meaning: "Technical read: wei yin xu, or Stomach Yin deficiency, suggests the moistening/cooling fluid layer of the digestive center may be reduced.",
        why: "Decoded: the system may need moisture and recovery more than stimulation. Peeled coat, cracks, dry surface, thirst, dry mouth, constipation, and sensitivity to heat/drying routines strengthen this read.",
      },
      {
        system: "Kidney Yin / Heart-Kidney Communication",
        meaning: "Technical read: Kidney Yin deficiency or Heart-Kidney disharmony becomes relevant when the cooling, anchoring Yin layer is not settling the Shen at night.",
        why: "Decoded: dryness plus night waking, night heat, restlessness, red tip, or feeling depleted-but-wired can mean the body needs deeper restoration rather than more stimulation.",
      },
    ],
    support: {
      foods: [
        "Favor moist cooked foods: soups, stews, porridges, warm fluids, cooked pears, apples, black sesame, tahini, eggs if tolerated, tofu, seaweed, lily bulb-style foods, and adequate meal substance.",
        "Use hydration steadily through the day rather than chugging at night.",
        "Choose gentle nourishment over cleansing, fasting, or drying diets if depletion is prominent.",
        "Reduce dehydrating routines: late caffeine, alcohol, dry snacks, overwork, under-sleeping, and excessive heat exposure.",
      ],
      lifestyle: [
        "Protect recovery and sleep before adding stronger interventions.",
        "Build a lower-stimulation evening routine, especially if dryness appears with poor sleep or red tip.",
        "Use restorative practices: yin-style stretching, quiet breath, warm bath, early bedtime, or screen reduction.",
        "Track hydration, stool dryness, dry mouth, skin dryness, and whether warm fluids change the tongue surface.",
      ],
      formulaFamilies: [
        "Top 3 formula families to research: Mai Men Dong Tang, Zhi Bai Di Huang Wan, and Liu Wei Di Huang Wan.",
        "Mai Men Dong Tang is traditionally discussed for Stomach/Lung Yin or fluid dryness with dryness, throat/chest irritation, or depleted fluids.",
        "Zhi Bai Di Huang Wan is a Yin-nourishing plus deficient-Heat-clearing direction, traditionally considered when night heat, dryness, and deeper depletion signs appear.",
        "Liu Wei Di Huang Wan is a foundational Kidney Yin-nourishing family traditionally used as a base when deeper Yin/fluid depletion is the main direction.",
        "Store links can be added after safety review because nourishing formulas are not ideal when thick greasy damp signs are dominant.",
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
        system: "Spleen Yang Deficiency / Cold-Damp Middle",
        meaning: "Technical read: pi yang xu with Cold-Damp in the Middle Burner suggests the warming and transforming function of digestion is underpowered.",
        why: "Decoded: the digestive center may need warmth and rhythm. Low appetite, cold preference, bloating after cold foods, loose stool, fatigue, wet tongue, swelling, or tooth marks strengthen this read.",
      },
      {
        system: "Kidney Yang / Mingmen Fire",
        meaning: "Technical read: shen yang xu or weak mingmen fire becomes relevant when cold and depletion look deep, chronic, or lower-body dominant.",
        why: "Decoded: this is not just being cold for one day. Low back weakness, frequent urination, low libido, lower-body cold, chronic exhaustion, root-area signs, and deep depletion point toward the lower burner.",
      },
    ],
    support: {
      foods: [
        "Favor warm breakfasts, warm drinks, soups, stews, cooked grains, oats, rice porridge, root vegetables, lamb or chicken broth if appropriate, and cooked greens.",
        "Use gentle warming spices if heat/reflux is not present: ginger, cinnamon, fennel, cumin, cardamom, clove, and black pepper in small amounts.",
        "Keep meals regular and avoid skipping breakfast if morning energy is low.",
        "Reduce cold drinks, cold smoothies, raw-heavy meals, excessive salads, and irregular meal timing.",
      ],
      lifestyle: [
        "Use morning light, warmth to abdomen/feet, and gentle walking to test energy and digestion response.",
        "Keep the lower body warm and notice whether warmth improves stool, energy, and appetite.",
        "Use strength gently and progressively rather than pushing into depletion.",
        "Avoid intense exercise if it creates next-day fatigue, chills, loose stool, or appetite drop.",
      ],
      formulaFamilies: [
        "Top 3 formula families to research: Li Zhong Wan, Fu Zi Li Zhong Wan, and Shen Qi Wan.",
        "Li Zhong Wan is traditionally discussed for warming and strengthening the Middle Burner when cold digestion, low appetite, loose stool, and abdominal cold are central.",
        "Fu Zi Li Zhong Wan is a stronger warming direction that adds deeper Yang support and requires more caution and practitioner oversight.",
        "Shen Qi Wan is traditionally discussed when Kidney Yang / lower burner weakness is part of the picture, such as deep cold, chronic depletion, or lower-body signs.",
        "Store links can be added only after safety review because warming formulas can be inappropriate with Heat, hypertension concerns, pregnancy, or certain medications.",
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

function deriveIntakeChoiceKeys(answers: Record<string, IntakeAnswer>) {
  const keys = new Set<ChoiceKey>();
  for (const question of intakeQuestions) {
    const answer = answers[question.id];
    if (!answer?.selected) continue;

    const optionIndex = question.options.indexOf(answer.selected as IntakeQuestion["options"][number]);
    const hasCustom = answer.selected === explainOption && Boolean(answer.custom?.trim());
    if (optionIndex >= 1 || hasCustom) {
      question.mapsTo.forEach((key) => keys.add(key));
    }
  }
  return keys;
}

function intakeAnswerText(question: IntakeQuestion, answer?: IntakeAnswer) {
  if (!answer?.selected) return "";
  if (answer.selected === explainOption) return answer.custom?.trim() || "Own words selected; no detail added.";
  return answer.selected;
}

function buildIntakeSummary(answers: Record<string, IntakeAnswer>) {
  const answered = intakeQuestions
    .map((question) => ({ question, answer: intakeAnswerText(question, answers[question.id]) }))
    .filter((item) => item.answer);
  const ownWords = answered.filter((item) => item.answer !== explainOption && answers[item.question.id]?.selected === explainOption);

  return {
    answered,
    ownWords,
    total: answered.length,
    highlights: answered
      .filter((item) => {
        const answer = answers[item.question.id];
        const index = answer ? item.question.options.indexOf(answer.selected as IntakeQuestion["options"][number]) : -1;
        return index >= 1 || answer?.selected === explainOption;
      })
      .slice(0, 8),
  };
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function reportList(items: string[]) {
  if (!items.length) return "<p class=\"muted\">No items recorded.</p>";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function graphPercent(score: number, maxScore: number) {
  if (maxScore <= 0) return 0;
  return Math.max(12, Math.round((score / maxScore) * 100));
}

function graphTone(index: number) {
  return ["#55745c", "#8d6a46", "#9f5a3f", "#5f6f8f", "#7f5b79"][index % 5];
}

function patternStrengthLabel(score: number, maxScore: number) {
  if (score <= 0) return "Trace";
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.85) return "Primary";
  if (ratio >= 0.55) return "Secondary";
  return "Background";
}

function qualitySummary(primary: Theme) {
  return {
    heading: "How to use this result",
    points: [
      "Start with the strongest pattern, then compare it against how you actually feel this week.",
      "Use the food and rhythm suggestions as short observation experiments, not as rules.",
      "Retake the tongue test in 3 weeks under similar lighting to compare whether the visible pattern is shifting.",
    ],
    uncertainty: [
      "A tongue photo is only one observation. Lighting, camera color, recent food, brushing, hydration, and timing can all change what appears.",
      "The result becomes more useful when tongue signs are compared with digestion, sleep, stress, thirst, stool, energy, and temperature patterns.",
    ],
  };
}

function visibleTongueSignDescriptions(visionResult: VisionResult | null, selected: Set<ChoiceKey>) {
  if (visionResult?.detected_signs.length) {
    return visionResult.detected_signs.map((sign) => {
      const interpretation = visibleSignInterpretations[sign.key];
      const evidence = sign.evidence ? ` Visible clue: ${sign.evidence}` : "";
      return `${sign.label} (${sign.confidence} confidence). ${interpretation}${evidence}`;
    });
  }

  return [...selected]
    .filter((key): key is VisualChoiceKey => visualChoiceKeys.has(key))
    .map((key) => `${labelForChoice(key)}. ${visibleSignInterpretations[key]}`)
    .slice(0, 10);
}

function getHerbSuggestions(primary: Theme) {
  return herbSuggestionsByPattern[primary.title] ?? herbSuggestionsByPattern["Damp / Sluggish Digestion Pattern"];
}

function getDietarySuggestion(primary: Theme) {
  return dietarySuggestionsByPattern[primary.title] ?? dietarySuggestionsByPattern["Damp / Sluggish Digestion Pattern"];
}

function selectedVisualKeys(visionResult: VisionResult | null, selected: Set<ChoiceKey>) {
  const keys = new Set<VisualChoiceKey>();
  for (const sign of visionResult?.detected_signs ?? []) keys.add(sign.key);
  for (const key of selected) {
    if (visualChoiceKeys.has(key)) keys.add(key as VisualChoiceKey);
  }
  return keys;
}

function technicalTongueReading(primary: Theme, visionResult: VisionResult | null, selected: Set<ChoiceKey>) {
  const keys = selectedVisualKeys(visionResult, selected);
  const has = (key: VisualChoiceKey) => keys.has(key);
  const color = has("pale")
    ? "Pale tongue body may traditionally suggest Qi deficiency, Blood deficiency, Yang deficiency, or Cold when supported by intake signs."
    : has("deepRed")
      ? "Deep red tongue body may traditionally suggest stronger Heat, Heat entering deeper levels, or Heat consuming fluids."
      : has("red")
        ? "Red tongue body may traditionally suggest Heat, Yin deficiency with Empty Heat, or irritability/reactivity depending on coating and moisture."
        : has("purple")
          ? "Purple or dusky tongue body may traditionally suggest Blood stasis, Qi stagnation, Cold stagnation, or constrained circulation."
          : "Tongue body color does not show a single dominant color signal from the current read; interpretation leans more on coating, shape, moisture, region, and intake.";
  const shape = [
    has("swollen") ? "Swollen tongue shape may suggest Damp accumulation, Spleen Qi deficiency, or weaker fluid transformation." : "",
    has("thin") ? "Thin tongue shape may suggest Yin deficiency, Blood deficiency, or constitutional depletion." : "",
    has("cracks") ? "Cracks may suggest Yin deficiency, fluid depletion, Stomach Yin deficiency, or chronic constitutional dryness depending on location." : "",
    has("teethMarks") ? "Teeth marks may suggest Spleen Qi deficiency with Dampness or a soft/swollen tongue pressing against the teeth." : "",
  ].filter(Boolean);
  const coating = [
    has("thickCoat") ? "Thick coating may traditionally suggest Dampness, Phlegm, food stagnation, or an excess layer obstructing the Middle Burner." : "",
    has("thinCoat") ? "Thin coating may suggest the Stomach Qi layer is still present and the coating burden is not dominant." : "",
    has("greasyCoat") ? "Greasy coating may suggest Dampness, Phlegm, or Damp-Heat when paired with yellow color or heat signs." : "",
    has("yellowCoat") ? "Yellow coating may suggest Heat or Damp-Heat." : "",
    has("whiteCoat") ? "White coating may suggest Cold, Damp, or a less heated pattern." : "",
    has("peeledCoat") ? "Peeled or absent coating may suggest Stomach Yin deficiency, reduced fluids, or weakened Stomach Qi." : "",
  ].filter(Boolean);
  const moisture = has("dry")
    ? "Moisture read: dry surface may suggest Heat consuming fluids, Yin deficiency, or reduced Jin Ye/body fluids."
    : has("wet")
      ? "Moisture read: wet surface may suggest Dampness, Cold-Damp, or fluids not being transformed well."
      : "Moisture read: no strong dry/wet signal is dominant, so moisture should be interpreted cautiously.";
  const regions = [
    has("redTip") ? "Tip: traditionally associated with Heart/Lung; red tip may suggest Heart Fire, Shen disturbance, or upper-burner Heat." : "",
    has("centerCoat") ? "Center: traditionally associated with Spleen/Stomach; center coating may suggest Middle Burner involvement, digestion, appetite, reflux, bloating, or post-meal energy patterns." : "",
    has("redSides") ? "Sides: traditionally associated with Liver/Gallbladder; red sides may suggest Liver Qi constraint turning to Heat or Liver/Gallbladder Heat." : "",
    has("rootCoat") ? "Root: traditionally associated with Kidney/Lower Jiao; root coating may suggest lower burner Dampness, chronic fluid patterns, or deeper constitutional context." : "",
  ].filter(Boolean);

  return {
    color,
    shape: shape.length ? shape : ["No strong shape-specific sign is dominant from the current read."],
    coating: coating.length ? coating : ["No strong coating-specific sign is dominant from the current read."],
    moisture,
    regions: regions.length
      ? regions
      : ["According to traditional tongue diagnosis, the tip may reflect Heart/Lung, the center Spleen/Stomach, the sides Liver/Gallbladder, and the root Kidney/Lower Jiao; no single region dominates this read."],
    impressions: [primary.title, ...primary.organs.slice(0, 2).map((organ) => organ.system)].slice(0, 3),
  };
}

const tcmTeaching = [
  "Traditional Chinese Medicine looks for patterns rather than isolated symptoms. Tongue color, coating, moisture, shape, and location are traditionally read alongside digestion, sleep, stress, energy, temperature, and daily rhythm.",
  "The tongue is not treated as a standalone diagnosis. It is one visual clue that may help organize what to observe next.",
  "A useful TCM-style wellness reflection asks: what seems hot or cold, excess or depleted, dry or damp, stuck or moving, and how do those signs change with food, rest, stress, and time of day?",
];

const threeWeekRetakePlan = [
  "Retake the tongue test in 3 weeks using similar lighting, time of day, and camera distance so the comparison is cleaner.",
  "Try to take the photo before coffee, strongly colored food, tongue scraping, brushing, or mouthwash.",
  "Look for changes in coating thickness, color intensity, moisture, cracks, tooth marks, and whether the center or sides look less reactive.",
  "Use the 3-week comparison as a wellness tracking tool, not proof of diagnosis or treatment response.",
];

const tcmFoundations = [
  {
    title: "Protect Your Energy, Don’t Constantly Spend It",
    body:
      "Traditional Chinese Medicine views health as the preservation and intelligent use of vital energy, or Qi. Constant overwork, excessive stimulation, emotional suppression, poor sleep, and chronic stress may gradually weaken internal harmony. In TCM, rest is considered part of restoration and balance.",
  },
  {
    title: "Eat Warm, Nourishing Foods Regularly",
    body:
      "TCM often emphasizes warm, cooked, easy-to-digest meals over excessive cold, iced, or heavily processed foods. Soups, broths, rice, root vegetables, lightly cooked greens, warming teas, and simple whole foods are commonly used as general digestive support.",
  },
  {
    title: "Digestion Is Central to Well-Being",
    body:
      "Digestion is considered one of the foundations of vitality. Eating too quickly, while stressed, distracted, emotionally upset, or overstimulated may weaken digestive balance over time. Mindful eating and slowing down are traditionally encouraged.",
  },
  {
    title: "Emotions Affect the Organ Systems",
    body:
      "TCM recognizes relationships between emotional states and organ systems: stress and frustration with the Liver system, excessive worry with digestion, grief with the Lung system, fear with the Kidney system, and overstimulation with the Heart and mind.",
  },
  {
    title: "Sleep Restores the Body",
    body:
      "Deep, regular sleep is considered a major restoration period. General TCM principles often encourage consistent sleep schedules, reducing stimulation at night, calming the nervous system before bed, and balancing activity with recovery.",
  },
  {
    title: "Gentle Daily Movement Keeps Energy Flowing",
    body:
      "Qi is meant to move. Walking, stretching, qigong, tai chi, yoga, breathwork, and mindful movement may support circulation and internal balance. Too little movement may contribute to stagnation, while excessive exertion may contribute to depletion.",
  },
  {
    title: "Live More in Rhythm With Nature",
    body:
      "TCM emphasizes adapting to seasonal and natural cycles: more restoration in winter, growth and movement in spring, activity and expansion in summer, and reflection and release in autumn.",
  },
  {
    title: "Calmness Supports Healing",
    body:
      "An overstimulated nervous system may affect digestion, sleep, emotional balance, and vitality. Slowing down, mindful breathing, meditation, quiet reflection, time in nature, and reducing excessive stimulation are traditionally considered restorative.",
  },
  {
    title: "Closing Reflection",
    body:
      "Traditional Chinese Medicine does not view health as perfection, but as balance, adaptability, and harmony. The tongue may reflect temporary patterns related to stress, lifestyle, emotional state, digestion, energy levels, and constitutional tendencies. Small consistent changes are traditionally considered more supportive than extreme short-term interventions.",
  },
];

const visibleSignInterpretations: Record<VisualChoiceKey, string> = {
  pale:
    "A pale tongue body is traditionally read as a possible sign of Qi, Blood, or Yang weakness, especially when paired with coldness, low energy, loose stool, or feeling depleted.",
  red:
    "A red tongue body can suggest Heat, irritation, or increased internal reactivity. Its meaning depends heavily on location, coating, thirst, sleep, stress, and digestion.",
  deepRed:
    "A deep red tongue is a stronger heat signal than mild redness. In TCM language, it raises the question of excess Heat, Heat damaging fluids, or deeper irritability in the system.",
  purple:
    "A purple or dusky tone may suggest Blood stasis or Qi stagnation, especially when paired with tension, fixed discomfort, stress, headaches, chest/rib tightness, or poor circulation.",
  normalPink:
    "A soft pink tongue body is generally closer to a balanced baseline in tongue observation, especially when coating is thin and even and the user feels steady.",
  thinCoat:
    "A thin coat is often treated as a normal or mild coating sign. It suggests the Stomach Qi layer is visible without heavy dampness or major coating accumulation.",
  thickCoat:
    "A thick coat can point toward accumulation in the digestive layer, often discussed as Dampness, Phlegm, food stagnation, or a heavier internal burden.",
  whiteCoat:
    "A white coat may point toward Cold, Damp, or a less heated digestive pattern. It becomes more meaningful with cold signs, loose stool, fatigue, or heaviness.",
  yellowCoat:
    "A yellow coat is a classic Heat or Damp-Heat clue in TCM tongue observation. It becomes stronger if there is reflux, thirst, bitter taste, irritability, or sticky/heavy digestion.",
  greasyCoat:
    "A greasy or sticky coat often suggests Dampness, Phlegm, or food accumulation. It is especially relevant when paired with bloating, heaviness, fog, sugar cravings, or sticky stool.",
  peeledCoat:
    "A peeled or missing coat may suggest reduced fluids or Yin in the Stomach layer, especially if paired with dryness, thirst, night heat, cracks, or depletion.",
  dry:
    "A dry tongue surface can suggest fluids are not adequately moistening the system. In TCM this may relate to Heat consuming fluids, Yin deficiency, dryness, or dehydration context.",
  wet:
    "A very wet tongue may suggest fluids are present but not transforming well. It often points toward Cold, Dampness, or weaker Yang transformation when paired with low energy or loose stool.",
  swollen:
    "A swollen or puffy tongue may suggest fluid accumulation or weak transformation. In TCM this often brings the Spleen Qi/Yang and Dampness picture into focus.",
  thin:
    "A thin tongue body can suggest depletion, reduced nourishment, Blood deficiency, Yin deficiency, or chronic under-resourcing, depending on color and moisture.",
  teethMarks:
    "Teeth marks along the edges are often associated with Spleen Qi deficiency or Dampness, especially when paired with bloating, fatigue, heaviness, or loose stool.",
  cracks:
    "Cracks may suggest dryness, reduced fluids, or constitutional depletion. Their location matters: center cracks often pull attention toward the Stomach/Spleen area.",
  redTip:
    "A red tip draws attention toward the Heart/Shen and upper burner in TCM language, especially with poor sleep, restlessness, anxiety, mouth dryness, or emotional overstimulation.",
  redSides:
    "Red sides draw attention toward the Liver/Gallbladder map area, especially when paired with irritability, stress, frustration, rib/neck/shoulder tension, headaches, or bitter taste.",
  centerCoat:
    "A stronger center coat focuses attention on the Middle Burner: Spleen/Stomach digestion, appetite, bloating, food response, reflux, and post-meal energy.",
  rootCoat:
    "A stronger root coat points toward the lower burner and deeper fluid/elimination layer. It may be relevant with bowel patterns, urinary patterns, chronic dampness, or depletion.",
};

function buildTongueReportHtml({
  primary,
  secondaryThemes,
  selectedLabels,
  intakeSummary,
  notes,
  visionResult,
}: {
  primary: Theme;
  secondaryThemes: Theme[];
  selectedLabels: string[];
  intakeSummary: ReturnType<typeof buildIntakeSummary>;
  notes: string;
  visionResult: VisionResult | null;
}) {
  const generatedAt = new Date().toLocaleString();
  const detectedSigns = visionResult?.detected_signs ?? [];
  const qualityNote = visionResult?.image_quality?.notes || visionResult?.overall_note || "";
  const visibleDescriptions = visibleTongueSignDescriptions(visionResult, new Set(selectedLabels.map((label) => observationGroups.flatMap((group) => group.choices).find((choice) => choice.label === label)?.key).filter(Boolean) as ChoiceKey[]));
  const graphThemes = [primary, ...secondaryThemes].slice(0, 3);
  const maxScore = Math.max(...graphThemes.map((theme) => theme.score), 1);
  const quality = qualitySummary(primary);
  const technical = technicalTongueReading(primary, visionResult, new Set(selectedLabels.map((label) => observationGroups.flatMap((group) => group.choices).find((choice) => choice.label === label)?.key).filter(Boolean) as ChoiceKey[]));
  const herbs = getHerbSuggestions(primary);
  const diet = getDietarySuggestion(primary);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tongue Test: TCM AI Report</title>
  <style>
    @page { margin: 0.48in; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #211f1a;
      background:
        radial-gradient(circle at 12% 4%, rgba(141, 50, 37, 0.08), transparent 30%),
        linear-gradient(135deg, #fbfaf6 0%, #f3eee5 100%);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.55;
    }
    main { max-width: 880px; margin: 0 auto; padding: 34px; background: #fffdf8; border: 1px solid rgba(33,31,26,0.10); }
    h1, h2, h3 { margin: 0; font-family: Georgia, "Times New Roman", serif; line-height: 1.08; }
    h1 { font-size: 48px; letter-spacing: 0; }
    h2 { font-size: 25px; margin-top: 8px; }
    h3 { font-size: 16px; margin-top: 18px; }
    p { margin: 8px 0 0; }
    ul { margin: 10px 0 0; padding-left: 20px; }
    li { margin: 5px 0; }
    .eyebrow { color: #55745c; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; }
    .muted { color: rgba(33, 31, 26, 0.62); }
    .small { font-size: 12px; }
    .hero { display: grid; grid-template-columns: 0.42fr 1fr; gap: 24px; align-items: center; border-bottom: 1px solid rgba(33,31,26,0.12); padding-bottom: 24px; }
    .logo-card { border: 1px solid rgba(33,31,26,0.12); background: #f7f4ed; padding: 12px; }
    .logo-card img { display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: cover; }
    .card { border: 1px solid rgba(33,31,26,0.12); background: #f8f7f1; padding: 18px; margin-top: 16px; break-inside: avoid; }
    .lead-card { background: #211f1a; color: #fffaf0; padding: 22px; }
    .lead-card .eyebrow { color: #d9c7a1; }
    .lead-card .muted { color: rgba(255,250,240,0.68); }
    .lead-card .signature-item { background: rgba(255,250,240,0.06); border-color: rgba(255,250,240,0.16); }
    .lead-card .signature-bar { background: rgba(255,250,240,0.18); border-color: rgba(255,250,240,0.16); }
    .lead-card .graph-meta span { color: rgba(255,250,240,0.62); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .pillwrap { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .pill { border: 1px solid rgba(33,31,26,0.12); background: #fbfaf6; padding: 5px 8px; font-size: 12px; }
    .report-grid { display: grid; grid-template-columns: 0.82fr 1.18fr; gap: 14px; }
    .graph-row { margin-top: 14px; }
    .graph-meta { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; color: rgba(33,31,26,0.60); }
    .graph-track { height: 10px; border: 1px solid rgba(33,31,26,0.12); background: #eee8dc; margin-top: 6px; }
    .graph-fill { height: 100%; background: linear-gradient(90deg, #55745c, #8d6a46); }
    .score-circle { width: 118px; height: 118px; border-radius: 50%; border: 1px solid rgba(33,31,26,0.14); display: grid; place-items: center; background: radial-gradient(circle, #fffdf8 44%, #efe8dc 45%); }
    .score-circle strong { display: block; font-family: Georgia, "Times New Roman", serif; font-size: 34px; line-height: 1; text-align: center; }
    .score-circle span { display: block; margin-top: 6px; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(33,31,26,0.48); text-align: center; }
    .signature { display: grid; grid-template-columns: 178px 1fr; gap: 22px; align-items: center; }
    .signature-seal { width: 178px; height: 178px; border-radius: 50%; display: grid; place-items: center; position: relative; background: conic-gradient(from -30deg, #55745c 0 42%, #8d6a46 42% 68%, #9f5a3f 68% 84%, #e6ded1 84% 100%); box-shadow: inset 0 0 0 1px rgba(33,31,26,0.16); }
    .signature-seal:before { content: ""; position: absolute; inset: 15px; border-radius: 50%; background: #fffdf8; border: 1px solid rgba(33,31,26,0.12); }
    .signature-seal:after { content: ""; position: absolute; inset: 33px; border-radius: 50%; border: 1px solid rgba(85,116,92,0.22); }
    .signature-inner { position: relative; text-align: center; max-width: 112px; }
    .signature-inner strong { display: block; font-family: Georgia, "Times New Roman", serif; font-size: 34px; line-height: 1; }
    .signature-inner span { display: block; margin-top: 8px; font-size: 9px; letter-spacing: .16em; color: rgba(33,31,26,.52); text-transform: uppercase; }
    .signature-list { display: grid; gap: 10px; }
    .signature-item { border: 1px solid rgba(33,31,26,0.10); background: rgba(255,253,248,0.72); padding: 10px; }
    .signature-bar { height: 9px; background: #ebe2d5; border: 1px solid rgba(33,31,26,0.08); margin-top: 7px; }
    .signature-bar i { display: block; height: 100%; }
    .link-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
    .link-row a { border: 1px solid rgba(33,31,26,0.14); color: #211f1a; text-decoration: none; padding: 8px 10px; font-size: 12px; }
    .disclaimer { border-top: 1px solid rgba(33,31,26,0.12); margin-top: 28px; padding-top: 16px; color: rgba(33,31,26,0.66); font-size: 12px; }
    .actions { position: sticky; top: 0; padding: 10px; background: #211f1a; color: #fff; text-align: center; }
    button { border: 1px solid rgba(255,255,255,0.25); background: #fff; color: #211f1a; padding: 10px 14px; cursor: pointer; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; font-size: 11px; }
    @media print {
      body { background: #fff; }
      main { padding: 0; }
      .actions { display: none; }
      .card { break-inside: avoid; }
    }
    @media (max-width: 720px) {
      main { padding: 18px; }
      .hero, .grid, .report-grid, .signature { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">Save Or Print PDF Report</button>
  </div>
  <main>
    <section class="hero">
      <div class="logo-card">
        <img src="/images/tongue-assessment/tongue-map-logo.png" alt="Tongue Test: TCM AI logo" />
      </div>
      <div>
        <p class="eyebrow">Tongue Test: TCM AI</p>
        <h1>Tongue Observation Report</h1>
        <p class="muted">AI-guided tongue observation inspired by Traditional Chinese Medicine, translated into plain-English wellness insights, food direction, and lifestyle reflections.</p>
        <p class="small muted">Generated: ${escapeHtml(generatedAt)}</p>
      </div>
    </section>

    <section class="card lead-card">
      <p class="eyebrow">Primary Pattern Insight</p>
      <h2>${escapeHtml(primary.title)}</h2>
      <p>${escapeHtml(primary.plain)}</p>
      <h3>In words you can understand</h3>
      <p>${escapeHtml(primary.meaning)}</p>
      <p class="small muted">Matched signs: ${escapeHtml(primary.signs.join(", "))}</p>
      <div class="signature" style="margin-top:18px">
        <div class="signature-seal">
          <div class="signature-inner">
            <strong>${primary.score}</strong>
            <span>Primary<br />Signals</span>
          </div>
        </div>
        <div>
          <p class="eyebrow">Primary pattern signature</p>
          <h2>Why this pattern rose to the top</h2>
          <p class="muted">The graph supports the main insight by showing how strongly this pattern stands out compared with secondary directions.</p>
          <div class="signature-list">
            ${graphThemes
              .map(
                (theme, index) => `
                  <div class="signature-item">
                    <div class="graph-meta">
                      <strong>${escapeHtml(theme.title)}</strong>
                      <span>${patternStrengthLabel(theme.score, maxScore)} · ${theme.score} signal${theme.score === 1 ? "" : "s"}</span>
                    </div>
                    <div class="signature-bar"><i style="width:${graphPercent(theme.score, maxScore)}%; background:${graphTone(index)}"></i></div>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <p class="eyebrow">Technical TCM Tongue Reading</p>
      <h3>Tongue Body Color</h3>
      <p>${escapeHtml(technical.color)}</p>
      <h3>Tongue Shape</h3>
      ${reportList(technical.shape)}
      <h3>Tongue Coating</h3>
      ${reportList(technical.coating)}
      <h3>Moisture Level</h3>
      <p>${escapeHtml(technical.moisture)}</p>
      <h3>Regional Tongue Map</h3>
      ${reportList(technical.regions)}
      <h3>Pattern Impression</h3>
      ${reportList(technical.impressions)}
    </section>

    <section class="grid">
      <div class="card">
        <p class="eyebrow">${escapeHtml(quality.heading)}</p>
        ${reportList(quality.points)}
      </div>
      <div class="card">
        <p class="eyebrow">What is still uncertain</p>
        ${reportList(quality.uncertainty)}
      </div>
    </section>

    <section class="card">
      <p class="eyebrow">Organ / System Focus</p>
      <div class="grid">
        <div class="score-circle">
          <div>
            <strong>${primary.score}</strong>
            <span>Matched<br />Signals</span>
          </div>
        </div>
        <div>
          ${primary.organs
            .map(
              (organ) => `
              <h3>${escapeHtml(organ.system)}</h3>
              <p>${escapeHtml(organ.meaning)}</p>
              <p class="small muted">${escapeHtml(organ.why)}</p>
            `,
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="grid">
      <div class="card">
        <p class="eyebrow">What To Try First</p>
        ${reportList(primary.tryFirst)}
      </div>
      <div class="card">
        <p class="eyebrow">What To Observe Next</p>
        ${reportList(primary.observe)}
      </div>
    </section>

    <section class="card">
      <p class="eyebrow">TCM Support Direction</p>
      <h3>Food Direction</h3>
      ${reportList(primary.support.foods)}
      <h3>Lifestyle Direction</h3>
      ${reportList(primary.support.lifestyle)}
      <p class="small muted">These are tradition-based educational possibilities to discuss or explore carefully with a qualified professional. They are not instructions, prescriptions, or medical recommendations.</p>
    </section>

    <section class="card">
      <p class="eyebrow">Food & Dietary Suggestions</p>
      <h3>TCM Dietary Principle</h3>
      <p>${escapeHtml(diet.principle)}</p>
      <h3>Foods To Favor</h3>
      ${reportList(diet.favor)}
      <h3>Foods To Reduce</h3>
      ${reportList(diet.reduce)}
      <h3>Daily-Life Suggestions</h3>
      ${reportList(diet.daily)}
      <h3>Example Meal Ideas</h3>
      ${reportList(diet.meals)}
      <h3>Simple Recipe</h3>
      <p>${escapeHtml(diet.recipe)}</p>
    </section>

    <section class="card">
      <p class="eyebrow">Herb Suggestions</p>
      <p class="muted">Educational only. These herbs are traditionally used in TCM for pattern directions similar to this result; they are not a diagnosis, prescription, or treatment plan.</p>
      ${herbs
        .map(
          (herb) => `
            <h3>${escapeHtml(herb.name)}</h3>
            <p><strong>Why chosen:</strong> ${escapeHtml(herb.why)}</p>
            <p><strong>Traditional functions:</strong></p>
            ${reportList(herb.functions)}
            <p><strong>Plain-English benefit:</strong> ${escapeHtml(herb.simple)}</p>
            <p class="small muted">${escapeHtml(vendorGuidance)}</p>
          `,
        )
        .join("")}
      <p class="small muted">Consult a qualified practitioner before taking herbs, especially if pregnant, nursing, on medication, or managing a health condition.</p>
    </section>

    <section class="card">
      <p class="eyebrow">Retake The Tongue Test In 3 Weeks</p>
      ${reportList(threeWeekRetakePlan)}
    </section>

    <section class="card">
      <p class="eyebrow">A TCM view of health and well-being</p>
      ${reportList(tcmTeaching)}
    </section>

    <section class="card">
      <p class="eyebrow">Foundations of Traditional Chinese Medicine Well-Being</p>
      ${tcmFoundations
        .map(
          (item) => `
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.body)}</p>
          `,
        )
        .join("")}
    </section>

    <section class="card">
      <p class="eyebrow">Stay connected</p>
      <p class="muted">Follow along for tongue photo tips, TCM-style wellness education, and future report updates.</p>
      <div class="link-row">
        <a href="${reportLinks.instagram}">Instagram</a>
        <a href="${reportLinks.newsletter}">Newsletter</a>
        <a href="${reportLinks.website}">Website</a>
      </div>
    </section>

    <section class="card">
      <p class="eyebrow">Photo + Visible Signs</p>
      ${qualityNote ? `<p>${escapeHtml(qualityNote)}</p>` : `<p class="muted">No AI photo quality note was recorded.</p>`}
      ${visibleDescriptions.length ? reportList(visibleDescriptions) : ""}
      ${
        detectedSigns.length
          ? `<div class="pillwrap">${detectedSigns
              .map((sign) => `<span class="pill">${escapeHtml(sign.label)} · ${escapeHtml(sign.confidence)}</span>`)
              .join("")}</div>`
          : ""
      }
      <h3>Selected Observations</h3>
      <div class="pillwrap">${selectedLabels.map((label) => `<span class="pill">${escapeHtml(label)}</span>`).join("")}</div>
    </section>

    ${
      secondaryThemes.length
        ? `<section class="card">
            <p class="eyebrow">Secondary Signals</p>
            ${secondaryThemes
              .map((theme) => `<p><strong>${escapeHtml(theme.title)}:</strong> ${escapeHtml(theme.signs.join(", "))}</p>`)
              .join("")}
          </section>`
        : ""
    }

    ${
      notes.trim()
        ? `<section class="card">
            <p class="eyebrow">User Notes</p>
            <p>${escapeHtml(notes.trim()).replace(/\n/g, "<br />")}</p>
          </section>`
        : ""
    }

    <section class="disclaimer">
      <p><strong>Basis of insight:</strong> This report is generated from visible tongue features, user-entered observations, Traditional Chinese Medicine-inspired wellness frameworks, and app logic. It is not based on medical testing or clinical diagnosis.</p>
      <p><strong>Informational only.</strong> Tongue Test: TCM AI is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. The information provided is for informational and educational purposes only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment. If you are experiencing a medical emergency, call emergency services immediately.</p>
    </section>
  </main>
</body>
</html>`;
}

function openTonguePdfReport(reportHtml: string) {
  const reportWindow = window.open("", "_blank", "width=920,height=1100");

  if (reportWindow) {
    reportWindow.document.open();
    reportWindow.document.write(reportHtml);
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(() => reportWindow.print(), 450);
    return;
  }

  const blob = new Blob([reportHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "tongue-test-tcm-ai-report.html";
  anchor.click();
  URL.revokeObjectURL(url);
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
  const [intakeStarted, setIntakeStarted] = useState(false);
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [currentIntakeIndex, setCurrentIntakeIndex] = useState(0);
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, IntakeAnswer>>({});
  const [accessChoice, setAccessChoice] = useState<AccessChoice>(null);
  const [selected, setSelected] = useState<Set<ChoiceKey>>(new Set());
  const [notes, setNotes] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState("");
  const [imagePreparing, setImagePreparing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [reportEmail, setReportEmail] = useState("");
  const [reportEmailStatus, setReportEmailStatus] = useState("");
  const [reportEmailSending, setReportEmailSending] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraStarting, setCameraStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intakeDerivedSigns = useMemo(() => deriveIntakeChoiceKeys(intakeAnswers), [intakeAnswers]);
  const scoredSelection = useMemo(() => new Set([...selected, ...intakeDerivedSigns]), [selected, intakeDerivedSigns]);
  const themes = useMemo(() => scoreThemes(scoredSelection), [scoredSelection]);
  const intakeSummary = useMemo(() => buildIntakeSummary(intakeAnswers), [intakeAnswers]);
  const primary = themes[0];
  const answeredIntakeCount = intakeSummary.total;
  const canCompleteIntake = answeredIntakeCount >= MIN_INTAKE_ANSWERS;
  const currentIntakeQuestion = intakeQuestions[currentIntakeIndex];
  const currentIntakeAnswer = intakeAnswers[currentIntakeQuestion.id];
  const intakeProgressPercent = Math.max(
    4,
    Math.round(((currentIntakeIndex + 1) / intakeQuestions.length) * 100),
  );

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function toggle(key: ChoiceKey) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function answerIntake(question: IntakeQuestion, selectedAnswer: string) {
    setIntakeAnswers((current) => ({
      ...current,
      [question.id]: {
        selected: selectedAnswer,
        custom: selectedAnswer === explainOption ? current[question.id]?.custom ?? "" : "",
      },
    }));
  }

  function updateIntakeCustom(questionId: string, custom: string) {
    setIntakeAnswers((current) => ({
      ...current,
      [questionId]: {
        selected: current[questionId]?.selected || explainOption,
        custom,
      },
    }));
  }

  async function analyzeTonguePhoto() {
    if (!imageDataUrl) {
      setVisionError("Upload a tongue photo first.");
      return;
    }
    if (!photoConfirmed) {
      setVisionError("Confirm this photo before analysis.");
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
    stopCamera();
    setImagePreview("");
    setImageDataUrl("");
    setPhotoConfirmed(false);
    setVisionResult(null);
    setVisionError("");
    setCameraError("");
    setSelected((current) => new Set([...current].filter((key) => !visualChoiceKeys.has(key))));
  }

  function clearSession() {
    stopCamera();
    setSelected(new Set());
    setNotes("");
    setAccessChoice(null);
    setImagePreview("");
    setImageDataUrl("");
    setPhotoConfirmed(false);
    setVisionResult(null);
    setVisionError("");
    setFeedbackStatus("");
  }

  function moveIntake(direction: 1 | -1) {
    setCurrentIntakeIndex((current) =>
      Math.min(intakeQuestions.length - 1, Math.max(0, current + direction)),
    );
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

  function downloadPdfReport() {
    if (!primary) return;

    const selectedLabels = [...selected].map(labelForChoice).sort((a, b) => a.localeCompare(b));
    const reportHtml = buildTongueReportHtml({
      primary,
      secondaryThemes: themes.slice(1),
      selectedLabels,
      intakeSummary,
      notes,
      visionResult,
    });

    openTonguePdfReport(reportHtml);
  }

  async function sendPdfReportEmail() {
    if (!primary) return;
    setReportEmailStatus("");
    setReportEmailSending(true);
    try {
      const selectedLabels = [...selected].map(labelForChoice).sort((a, b) => a.localeCompare(b));
      const visibleDescriptions = visibleTongueSignDescriptions(visionResult, selected);
      const response = await fetch("/api/tongue-report-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: reportEmail,
          primaryTitle: primary.title,
          primarySummary: primary.plain,
          matchedSigns: primary.signs,
          organSystems: primary.organs.map((organ) => ({
            title: organ.system,
            body: `${organ.meaning} ${organ.why}`,
          })),
          foodDirection: primary.support.foods,
          lifestyleDirection: primary.support.lifestyle,
          herbSuggestions: getHerbSuggestions(primary),
          dietarySuggestion: getDietarySuggestion(primary),
          technicalReading: technicalTongueReading(primary, visionResult, selected),
          intakeHighlights: intakeSummary.highlights.map((item) => ({
            question: item.question.question,
            answer: item.answer,
          })),
          visibleSigns: visibleDescriptions.length ? visibleDescriptions : selectedLabels,
          patternScores: themes.map((theme) => ({ title: theme.title, score: theme.score })),
          notes,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not send PDF report.");
      setReportEmailStatus("Report sent. Check that email inbox in a minute.");
    } catch (error) {
      setReportEmailStatus(error instanceof Error ? error.message : "Could not send PDF report.");
    } finally {
      setReportEmailSending(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setCameraStarting(false);
  }

  async function startCamera() {
    setCameraError("");
    setCameraStarting(true);
    setVisionError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support the live camera. Use Take or Choose Photo instead.");
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? `${error.message} The safest option on iPhone and Android is Take or Choose Photo.`
          : "Could not open the live camera. Use Take or Choose Photo instead.",
      );
      setCameraActive(false);
    } finally {
      setCameraStarting(false);
    }
  }

  async function handlePhotoFile(file?: File) {
    stopCamera();
    setVisionResult(null);
    setVisionError("");
    setCameraError("");
    setPhotoConfirmed(false);
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
  }

  function captureCameraPhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("Camera is still loading. Try again in a moment.");
      return;
    }

    const scale = Math.min(1, MAX_UPLOAD_EDGE / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.max(1, Math.round(video.videoWidth * scale));
    const height = Math.max(1, Math.round(video.videoHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("Could not capture the camera photo.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    setImagePreview(dataUrl);
    setImageDataUrl(dataUrl);
    setPhotoConfirmed(false);
    setVisionResult(null);
    setVisionError("");
    stopCamera();
  }

  if (!intakeStarted) {
    return (
      <main className="min-h-screen bg-[#f3efe7]">
        <div className="mx-auto flex min-h-screen w-full max-w-[30rem] flex-col px-4 py-4 sm:justify-center sm:py-8">
          <section className="flex min-h-[calc(100vh-2rem)] flex-col justify-between border border-ink/10 bg-[#fffdf8] p-5 shadow-card sm:min-h-0 sm:p-6">
            <div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-moss">Tongue Test: TCM AI</p>
                <span className="border border-ink/10 bg-fog px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink/45">
                  TCM
                </span>
              </div>
              <div className="mx-auto mt-7 w-[58%] max-w-[13rem] overflow-hidden border border-ink/10 bg-[#f7f4ed]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/tongue-assessment/tongue-map-logo.png"
                  alt="Tongue Test: TCM AI logo"
                  className="aspect-square w-full object-cover"
                />
              </div>
              <div className="mt-7">
                <h1 className="text-[2.35rem] font-semibold leading-[0.98]">
                  Begin with a short TCM tongue wellness check.
                </h1>
                <p className="mt-4 text-[0.95rem] leading-7 text-ink/64">
                  Answer a few reflective questions, add a clear tongue photo, then receive a plain-English
                  TCM-style wellness report.
                </p>
              </div>
            </div>
            <div className="mt-8">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["01", "Intake"],
                  ["02", "Photo"],
                  ["03", "Report"],
                ].map(([number, label]) => (
                  <div key={label} className="border border-ink/10 bg-fog/60 p-3">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-moss">{number}</p>
                    <p className="mt-2 text-sm font-semibold leading-5 text-ink">{label}</p>
                  </div>
                ))}
              </div>
              <button type="button" className="button-primary mt-5 min-h-14 w-full" onClick={() => setIntakeStarted(true)}>
                Begin
              </button>
              <div className="mt-4">
                <ShortResultDisclaimer />
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!intakeComplete) {
    return (
      <main className="min-h-screen bg-[#f3efe7]">
        <div className="mx-auto flex min-h-screen w-full max-w-[30rem] flex-col px-4 py-4">
          <section className="flex min-h-[calc(100vh-2rem)] flex-col border border-ink/10 bg-[#fffdf8] p-4 shadow-card">
            <div className="sticky top-0 z-10 -mx-4 -mt-4 border-b border-ink/10 bg-[#fffdf8]/95 px-4 py-3 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-moss">TCM Intake</p>
                  <p className="mt-1 text-xs leading-5 text-ink/48">
                    {answeredIntakeCount} answered · {MIN_INTAKE_ANSWERS} needed
                  </p>
                </div>
                <span className="border border-ink/10 bg-fog px-2.5 py-1 text-xs font-semibold text-ink/55">
                  {currentIntakeIndex + 1}/{intakeQuestions.length}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden bg-fog">
                <div className="h-full bg-moss transition-all" style={{ width: `${intakeProgressPercent}%` }} />
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-center py-6">
              <article className="border border-ink/10 bg-white p-4 shadow-card">
                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-moss">
                  Question {currentIntakeIndex + 1}
                </p>
                <h1 className="mt-3 text-[1.75rem] font-semibold leading-[1.08] text-ink">
                  {currentIntakeQuestion.question}
                </h1>
                <div className="mt-5 grid gap-2">
                  {currentIntakeQuestion.options.map((option) => {
                    const active = currentIntakeAnswer?.selected === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`min-h-14 border px-3 py-3 text-left text-sm font-semibold leading-5 transition ${
                          active ? "border-ink bg-ink text-white" : "border-ink/10 bg-fog/70 text-ink hover:border-moss/35"
                        }`}
                        onClick={() => answerIntake(currentIntakeQuestion, option)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                {currentIntakeAnswer?.selected === explainOption ? (
                  <textarea
                    value={currentIntakeAnswer.custom ?? ""}
                    onChange={(event) => updateIntakeCustom(currentIntakeQuestion.id, event.target.value)}
                    className="mt-3 w-full resize-y border border-ink/10 bg-fog/60 p-3 text-sm leading-6 outline-none focus:border-moss"
                    rows={3}
                    placeholder="Write what feels true for you..."
                  />
                ) : null}
              </article>
            </div>

            <div className="grid gap-2 border-t border-ink/10 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="button-secondary min-h-12 w-full"
                  disabled={currentIntakeIndex === 0}
                  onClick={() => moveIntake(-1)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="button-secondary min-h-12 w-full"
                  disabled={currentIntakeIndex === intakeQuestions.length - 1}
                  onClick={() => moveIntake(1)}
                >
                  Next
                </button>
              </div>
              <button
                type="button"
                className="button-primary min-h-14 w-full"
                disabled={!canCompleteIntake}
                onClick={() => setIntakeComplete(true)}
              >
                Continue To Photo
              </button>
              {!canCompleteIntake ? (
                <p className="text-center text-xs leading-5 text-ink/48">
                  Answer {Math.max(0, MIN_INTAKE_ANSWERS - answeredIntakeCount)} more to continue.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3efe7]">
      <div className="mx-auto w-full max-w-[30rem] px-4 py-4 lg:max-w-6xl lg:px-8 lg:py-10">
        <section className="overflow-hidden border border-ink/10 bg-[#fffdf8] shadow-card">
          <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-ink/10 bg-[#fffdf8]/95 px-4 py-3 backdrop-blur lg:hidden">
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-moss">Tongue Test</p>
              <p className="mt-1 text-xs leading-5 text-ink/48">
                {accessChoice ? "Report" : visionResult ? "Access" : "Photo"}
              </p>
            </div>
            <span className="border border-ink/10 bg-fog px-2.5 py-1 text-xs font-semibold text-ink/55">
              {accessChoice ? "03" : visionResult ? "02" : "01"}
            </span>
          </div>
          <div className="grid gap-0 lg:grid-cols-[0.78fr_1.02fr]">
            <div>
              <div className="p-5 lg:p-8">
              <p className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-moss">Tongue Test: TCM AI</p>
              <h1 className="max-w-3xl text-[2.2rem] font-semibold leading-[1] sm:text-5xl md:text-6xl">
                Take a tongue photo. Get a simple TCM-style wellness report.
              </h1>
              <p className="mt-4 max-w-2xl text-[0.95rem] leading-7 text-ink/64 md:text-base md:leading-8">
                Choose a clear photo, confirm it, then receive a calm educational report with visible
                tongue notes, plain-English pattern insight, food direction, and lifestyle reflections.
              </p>
              <div className="mt-5 max-w-2xl hidden lg:block">
                <WellnessPurposeDisclosure compact />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {["Intake complete", "Take or choose photo", "Choose access"].map((item) => (
                  <div key={item} className="border border-ink/10 bg-fog/60 p-2.5 text-xs font-semibold leading-5 text-ink/60 lg:p-3 lg:text-sm lg:leading-6">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5 border border-moss/20 bg-fog/60 p-3 lg:p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Intake Pattern Context</p>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  {intakeSummary.total} answers saved for this session. These help shape the final tongue reading.
                </p>
              </div>
              </div>
            </div>

            <div className="border-t border-ink/10 bg-[#f7f4ed] p-4 lg:border-l lg:border-t-0">
              <div className="mb-4 grid grid-cols-[5.5rem_1fr] gap-3 items-center lg:grid-cols-[7.5rem_1fr] lg:gap-4">
                <div className="overflow-hidden border border-ink/10 bg-[#f7f4ed]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/tongue-assessment/tongue-map-logo.png"
                    alt="Tongue Test: TCM AI puzzle tongue logo"
                    className="aspect-square w-full object-cover lg:aspect-[2/3]"
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
                Start with a clear photo in natural light. The photo is used for this educational report
                and you can delete it from this session at any time.
              </p>
              <p className="mt-2 text-xs leading-5 text-ink/48">
                Privacy note: your photo is prepared in the browser, then sent for AI-assisted review only
                when you tap analyze. Use the clear controls below to remove the current photo from this session.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs leading-5 text-ink/54">
                <span className="border border-ink/10 bg-white/62 p-2">Natural light</span>
                <span className="border border-ink/10 bg-white/62 p-2">No flash or filters</span>
                <span className="border border-ink/10 bg-white/62 p-2">Photo before food/coffee</span>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <label className="block border border-ink bg-ink p-3 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                  <span className="mb-2 block">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
                    className="block w-full cursor-pointer text-[0.68rem] normal-case tracking-normal text-white file:mr-3 file:cursor-pointer file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.12em] file:text-ink"
                    onChange={async (event) => {
                      await handlePhotoFile(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <label className="block border border-ink/15 bg-white p-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink">
                  <span className="mb-2 block">Take Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="block w-full cursor-pointer text-[0.68rem] normal-case tracking-normal text-ink/60 file:mr-3 file:cursor-pointer file:border-0 file:bg-ink file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.12em] file:text-white"
                    onChange={async (event) => {
                      await handlePhotoFile(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="button-secondary min-h-14 w-full"
                  disabled={cameraStarting}
                  onClick={cameraActive ? captureCameraPhoto : startCamera}
                >
                  {cameraStarting ? "Opening Live Camera..." : cameraActive ? "Capture Live Photo" : "Open Live Camera"}
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-ink/48">
                Launch-safe flow: use Upload Photo first on desktop. On iPhone or Android, Take Photo opens
                the phone camera. Live Camera is optional and depends on browser permissions.
              </p>
              {cameraError ? (
                <p className="mt-3 border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{cameraError}</p>
              ) : null}
              {cameraActive ? (
                <div className="relative mt-4 overflow-hidden border border-ink/10 bg-ink">
                  <video ref={videoRef} playsInline muted autoPlay className="aspect-[4/3] w-full object-cover" />
                  <div className="pointer-events-none absolute inset-x-[24%] top-[18%] h-[64%] rounded-[50%] border-2 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.18)]" />
                  <div className="absolute inset-x-3 bottom-3 bg-ink/72 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.13em] text-white">
                    Center tongue, then tap Capture
                  </div>
                  <button type="button" className="button-secondary absolute right-3 top-3 bg-white" onClick={stopCamera}>
                    Close
                  </button>
                </div>
              ) : null}
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
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    className="button-primary w-full"
                    onClick={() => {
                      setPhotoConfirmed(true);
                      setVisionError("");
                    }}
                  >
                    {photoConfirmed ? "Photo Confirmed" : "Use This Photo"}
                  </button>
                  <label className="block border border-ink/15 bg-white p-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink">
                    <span className="mb-2 block">Retake</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
                      className="block w-full cursor-pointer text-[0.68rem] normal-case tracking-normal text-ink/60 file:mr-3 file:cursor-pointer file:border-0 file:bg-ink file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.12em] file:text-white"
                      onChange={async (event) => {
                        await handlePhotoFile(event.target.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <button type="button" className="button-secondary w-full" onClick={clearPhoto}>
                    Delete Photo
                  </button>
                </div>
              ) : null}
              {photoConfirmed ? (
                <p className="mt-3 border border-moss/20 bg-white/70 p-3 text-sm leading-6 text-moss">
                  Photo confirmed. You can analyze it now, or delete it before continuing.
                </p>
              ) : imagePreview ? (
                <p className="mt-3 border border-ink/10 bg-white/70 p-3 text-sm leading-6 text-ink/58">
                  Review the photo first. If it looks clear, tap Use This Photo.
                </p>
              ) : null}
              <button
                type="button"
                className="button-primary mt-4 min-h-14 w-full"
                disabled={!imageDataUrl || !photoConfirmed || imagePreparing || visionLoading}
                onClick={analyzeTonguePhoto}
              >
                {imagePreparing ? "Preparing Photo..." : visionLoading ? "Building Report..." : "Analyze And Build Report"}
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
                    structured TCM reading, practical direction, and 3-week comparison plan.
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
              {visionResult && !accessChoice ? (
                <article className="mt-4 border border-moss/25 bg-white p-4 shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Your report is ready</p>
                  <h2 className="mt-2 text-2xl font-semibold leading-tight">Choose how you want access.</h2>
                  <p className="mt-3 text-sm leading-6 text-ink/62">
                    You completed the intake and added a tongue image. Choose a trial or one-time report
                    option to view the full result and PDF.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button type="button" className="button-primary min-h-14 w-full" onClick={() => setAccessChoice("trial")}>
                      Free 14-Day Trial · Then $7.99/mo
                    </button>
                    <button type="button" className="button-secondary min-h-14 w-full" onClick={() => setAccessChoice("one-time")}>
                      One-Time Full Reading · $6.99
                    </button>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-ink/45">
                    Stripe is not connected yet, so this is a launch-flow placeholder. Real payment will replace these buttons.
                  </p>
                </article>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[0.82fr_1.08fr]">
          <section className="order-2 space-y-4">
            <details className="border border-ink/10 bg-white/78 p-4 shadow-card">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-moss">
                Optional details and notes
              </summary>
              <p className="mt-3 text-sm leading-6 text-ink/58">
                These are optional. The simple flow works from the photo first; use these only if you want
                to add context or manually adjust visible signs.
              </p>
              <div className="mt-4 space-y-4">
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
              </div>
            </details>
          </section>

          <aside className="order-1 lg:sticky lg:top-6 lg:self-start">
            <section className="border border-ink/10 bg-[#fffdf8] p-4 shadow-card md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-moss">Your Tongue Test Report</p>
                  <h2 className="text-[1.85rem] font-semibold leading-[1.05] sm:text-3xl">
                    {primary?.title ?? "Choose a photo to begin."}
                  </h2>
                </div>
                <span className="border border-ink/10 bg-fog px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-ink/54">
                  {selected.size} signs
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-ink/62">{selectionGuidance(selected.size)}</p>

              {primary && accessChoice ? (
                <div className="mt-5 space-y-4">
                  <article className="border border-moss/20 bg-[#f8f7f1] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Primary Pattern Insight</p>
                    <p className="mt-2 text-sm leading-6 text-ink/72">{primary.plain}</p>
                    <p className="mt-3 text-xs leading-5 text-ink/48">Matched: {primary.signs.join(", ")}</p>
                    <div className="mt-3">
                      <ShortResultDisclaimer />
                    </div>
                  </article>

                  <ReportDisclosure title="What This Means" defaultOpen>
                    <PlainMeaning meaning={primary.meaning} />
                  </ReportDisclosure>
                  <ReportDisclosure title="Pattern Graph" defaultOpen>
                    <PatternSignature themes={themes} />
                  </ReportDisclosure>
                  <ReportDisclosure title="Organ / System Focus">
                    <OrganFocus organs={primary.organs} />
                  </ReportDisclosure>
                  <ReportDisclosure title="Technical TCM Reading">
                    <TechnicalTongueReading reading={technicalTongueReading(primary, visionResult, selected)} />
                  </ReportDisclosure>
                  <ReportDisclosure title="Visible Tongue Signs">
                    <VisibleTongueSigns descriptions={visibleTongueSignDescriptions(visionResult, selected)} />
                  </ReportDisclosure>
                  <ReportDisclosure title="What To Try / Observe" defaultOpen>
                    <div className="grid gap-3">
                      <ResultList title="What To Try First" items={primary.tryFirst} />
                      <ResultList title="What To Observe Next" items={primary.observe} />
                      <ResultList title="Retake The Tongue Test In 3 Weeks" items={threeWeekRetakePlan} />
                    </div>
                  </ReportDisclosure>
                  <ReportDisclosure title="Food + Lifestyle Direction" defaultOpen>
                    <SupportDirection support={primary.support} />
                    <div className="mt-3">
                      <FoodDietarySuggestions diet={getDietarySuggestion(primary)} />
                    </div>
                  </ReportDisclosure>
                  <ReportDisclosure title="Herb Suggestions">
                    <HerbSuggestions herbs={getHerbSuggestions(primary)} />
                  </ReportDisclosure>
                  <ReportDisclosure title="TCM Foundations">
                    <TCMFoundations />
                  </ReportDisclosure>
                  <ReportDisclosure title="Result Quality">
                    <InsightQuality primary={primary} />
                  </ReportDisclosure>

                  <article className="border border-ink/10 bg-white/75 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">PDF Outcome Report</p>
                    <p className="mt-2 text-sm leading-6 text-ink/66">
                      Create a high-end report with the app logo, primary pattern insight, a signal-strength
                      graph, organ-system focus, food direction, lifestyle direction, 3-week retake plan,
                      and educational disclaimers. Your tongue photo is not placed in the PDF.
                    </p>
                    <button type="button" className="button-primary mt-4 w-full" onClick={downloadPdfReport}>
                      Download PDF Report
                    </button>
                    <p className="mt-3 text-xs leading-5 text-ink/45">
                      Your browser will open the report print screen. Choose “Save as PDF” to keep the file.
                    </p>
                    <div className="mt-4 border-t border-ink/10 pt-4">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">
                          Email PDF Report
                        </span>
                        <input
                          type="email"
                          value={reportEmail}
                          onChange={(event) => setReportEmail(event.target.value)}
                          className="mt-3 w-full border border-ink/10 bg-fog/60 px-3 py-3 text-sm outline-none focus:border-moss"
                          placeholder="name@email.com"
                        />
                      </label>
                      <button
                        type="button"
                        className="button-secondary mt-3 w-full"
                        disabled={reportEmailSending}
                        onClick={sendPdfReportEmail}
                      >
                        {reportEmailSending ? "Sending PDF..." : "Send PDF To Email"}
                      </button>
                      {reportEmailStatus ? (
                        <p className="mt-3 text-xs leading-5 text-ink/54">{reportEmailStatus}</p>
                      ) : (
                        <p className="mt-3 text-xs leading-5 text-ink/45">
                          Email sending uses Resend. It will work after the Resend API key and sender email are added in Vercel.
                        </p>
                      )}
                    </div>
                  </article>

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
	              ) : primary ? (
                <div className="mt-5 border border-moss/20 bg-[#f8f7f1] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Report locked</p>
                  <p className="mt-2 text-sm leading-6 text-ink/68">
                    Your intake and tongue photo have created a report preview. Choose trial or one-time
                    access above to view the full result and PDF.
                  </p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-ink">{primary.title}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-ink/58">
                  Take or choose a clear tongue photo, confirm it, then analyze. Your report will appear here.
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

        <section className="mt-5 border border-ink/10 bg-white/72 p-5 shadow-card md:p-6">
          <div className="grid gap-5 md:grid-cols-[0.85fr_1.15fr] md:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Photo Safety</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight">Delete your photo anytime.</h2>
              <p className="mt-3 text-sm leading-6 text-ink/58">
                This removes the current photo preview, notes, AI visible signs, and selected observations from this browser session.
              </p>
            </div>
            <button type="button" className="button-secondary self-start" onClick={clearSession}>
              Delete Photo And Clear Session
            </button>
          </div>
        </section>

        {primary && accessChoice ? (
          <section className="mt-5 border border-ink/10 bg-white p-5 shadow-card md:p-6">
            <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Feedback</p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight">Help shape Tongue Test: TCM AI</h2>
                <p className="mt-3 text-sm leading-6 text-ink/58">
                  You have reached the end of the reading. Tell us what felt useful, confusing, missing,
                  or inaccurate so we can improve the final experience.
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
        ) : null}
      </div>
    </main>
  );
}

function ReportDisclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group border border-ink/10 bg-white/72 shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-moss">
        <span>{title}</span>
        <span className="grid h-7 w-7 place-items-center border border-ink/10 bg-fog text-sm leading-none text-ink/50 transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="border-t border-ink/10 p-3 sm:p-4">{children}</div>
    </details>
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

function VisibleTongueSigns({ descriptions }: { descriptions: string[] }) {
  if (!descriptions.length) return null;

  return (
    <article className="border border-ink/10 bg-white/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Visible Tongue Signs</p>
      <p className="mt-2 text-sm leading-6 text-ink/58">
        These are the visible photo clues translated into TCM-style observation language. They are not a diagnosis.
      </p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
        {descriptions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function TechnicalTongueReading({ reading }: { reading: ReturnType<typeof technicalTongueReading> }) {
  return (
    <article className="border border-ink/10 bg-white/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Technical TCM Tongue Reading</p>
      <p className="mt-2 text-sm leading-6 text-ink/58">
        This section uses traditional Chinese medicine terminology. It is a pattern impression, not a medical diagnosis.
      </p>
      <div className="mt-3 space-y-3">
        <ResultList title="Tongue Body Color" items={[reading.color]} />
        <ResultList title="Tongue Shape" items={reading.shape} />
        <ResultList title="Tongue Coating" items={reading.coating} />
        <ResultList title="Moisture Level" items={[reading.moisture]} />
        <ResultList title="Regional Tongue Map" items={reading.regions} />
        <ResultList title="Likely Pattern Impressions" items={reading.impressions} />
      </div>
    </article>
  );
}

function FoodDietarySuggestions({ diet }: { diet: DietarySuggestion }) {
  return (
    <article className="border border-ink/10 bg-white/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Food & Dietary Suggestions</p>
      <p className="mt-2 text-sm leading-6 text-ink/70">{diet.principle}</p>
      <div className="mt-4 grid gap-3">
        <SupportColumn title="Foods To Favor" items={diet.favor} />
        <SupportColumn title="Foods To Reduce" items={diet.reduce} />
        <SupportColumn title="Daily-Life Suggestions" items={diet.daily} />
        <SupportColumn title="Example Meal Ideas" items={diet.meals} />
        <div className="border border-ink/10 bg-fog/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Simple Recipe</p>
          <p className="mt-2 text-sm leading-6 text-ink/68">{diet.recipe}</p>
        </div>
      </div>
    </article>
  );
}

function HerbSuggestions({ herbs }: { herbs: HerbSuggestion[] }) {
  return (
    <article className="border border-ink/10 bg-white/75 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Herb Suggestions</p>
      <p className="mt-2 text-sm leading-6 text-ink/60">
        Educational only. These herbs are traditionally used in TCM for pattern directions similar to this result.
        Review herbs with a qualified practitioner before using them.
      </p>
      <div className="mt-4 overflow-hidden border border-ink/10">
        <div className="hidden grid-cols-[1.05fr_1fr_1.15fr] border-b border-ink/10 bg-fog/70 text-xs font-semibold uppercase tracking-[0.13em] text-ink/48 sm:grid">
          <div className="p-3">Herb</div>
          <div className="border-l border-ink/10 p-3">Traditional Function</div>
          <div className="border-l border-ink/10 p-3">Plain-English Benefit</div>
        </div>
        {herbs.map((herb) => (
          <div key={herb.name} className="grid gap-0 border-b border-ink/10 last:border-b-0 sm:grid-cols-[1.05fr_1fr_1.15fr]">
            <div className="bg-white/70 p-3">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.13em] text-moss sm:hidden">Herb</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-ink sm:mt-0">{herb.name}</p>
              <p className="mt-2 text-xs leading-5 text-ink/52">{herb.why}</p>
            </div>
            <div className="border-t border-ink/10 bg-fog/45 p-3 sm:border-l sm:border-t-0">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.13em] text-moss sm:hidden">Traditional Function</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-ink/68 sm:mt-0">
                {herb.functions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="border-t border-ink/10 bg-white/70 p-3 sm:border-l sm:border-t-0">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.13em] text-moss sm:hidden">Plain-English Benefit</p>
              <p className="mt-2 text-sm leading-6 text-ink/72 sm:mt-0">{herb.simple}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-ink/48">{vendorGuidance}</p>
      <p className="mt-3 text-xs leading-5 text-ink/52">
        Consult a qualified practitioner before taking herbs, especially if pregnant, nursing, on medication, or managing a health condition.
      </p>
    </article>
  );
}

function PatternSignature({ themes }: { themes: Theme[] }) {
  if (!themes.length) return null;

  const graphThemes = themes.slice(0, 3);
  const primary = graphThemes[0];
  const maxScore = Math.max(...graphThemes.map((theme) => theme.score), 1);
  const gradientStops = graphThemes
    .map((theme, index) => {
      const start = index === 0 ? 0 : graphThemes.slice(0, index).reduce((sum, item) => sum + graphPercent(item.score, maxScore), 0) / graphThemes.length;
      const end = start + graphPercent(theme.score, maxScore) / graphThemes.length;
      return `${graphTone(index)} ${Math.min(100, start)}% ${Math.min(100, end)}%`;
    })
    .join(", ");

  return (
    <article className="border border-moss/20 bg-[#f8f7f1] p-4">
      <div className="grid gap-4 sm:grid-cols-[8.5rem_1fr] sm:items-center">
        <div
          className="relative grid aspect-square place-items-center rounded-full border border-ink/10"
          style={{
            background: `conic-gradient(from -30deg, ${gradientStops}, #e8dfd3 82% 100%)`,
          }}
        >
          <div className="absolute inset-3 rounded-full border border-ink/10 bg-[#fffdf8]" />
          <div className="absolute inset-7 rounded-full border border-moss/20" />
          <div className="relative text-center">
            <strong className="block font-serif text-4xl leading-none text-ink">{primary.score}</strong>
            <span className="mt-1 block text-[0.58rem] font-semibold uppercase tracking-[0.15em] text-ink/46">
              Primary
              <br />
              Signals
            </span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Primary Pattern Signature</p>
          <p className="mt-2 text-sm leading-6 text-ink/58">
            This graph supports the Primary Pattern Insight. It shows why this direction rose to the top
            and how much secondary pattern activity is also present.
          </p>
          <div className="mt-3 space-y-2">
            {graphThemes.map((theme, index) => (
              <div key={theme.title} className="border border-ink/10 bg-fog/45 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold leading-5 text-ink">{theme.title}</p>
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink/45">
                    {patternStrengthLabel(theme.score, maxScore)}
                  </span>
                </div>
                <div className="mt-2 h-2 border border-ink/10 bg-white">
                  <div
                    className="h-full"
                    style={{
                      width: `${graphPercent(theme.score, maxScore)}%`,
                      backgroundColor: graphTone(index),
                    }}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-ink/46">
                  {theme.score} matched signal{theme.score === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </div>
        </div>
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

function TCMFoundations() {
  return (
    <article className="border border-ink/10 bg-white/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">
        Foundations Of Traditional Chinese Medicine Well-Being
      </p>
      <div className="mt-3 space-y-3">
        {tcmFoundations.map((item) => (
          <div key={item.title} className="border-l-2 border-moss/25 pl-3">
            <p className="text-sm font-semibold leading-6 text-ink">{item.title}</p>
            <p className="mt-1 text-sm leading-6 text-ink/66">{item.body}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function InsightQuality({ primary }: { primary: Theme }) {
  const quality = qualitySummary(primary);
  return (
    <article className="grid gap-3 sm:grid-cols-2">
      <div className="border border-ink/10 bg-white/75 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">{quality.heading}</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
          {quality.points.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="border border-ink/10 bg-white/75 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">What is still uncertain</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
          {quality.uncertainty.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
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
