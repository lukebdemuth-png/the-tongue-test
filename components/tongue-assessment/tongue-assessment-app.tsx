"use client";

import { useMemo, useState } from "react";

import {
  BasisOfInsightDisclosure,
  EmergencyWarning,
  FullMedicalDisclaimer,
  ShortResultDisclaimer,
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

type Choice = {
  key: ChoiceKey;
  label: string;
  hint: string;
};

type Theme = {
  title: string;
  score: number;
  plain: string;
  signs: string[];
  tryFirst: string[];
  observe: string[];
  questions: string[];
};

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

const themeRules: Omit<Theme, "score" | "signs">[] = [
  {
    title: "Damp / Sluggish Digestion Pattern",
    plain:
      "The clearest reading is heaviness in the digestive-fluid system: the body may be struggling to transform food and fluids cleanly.",
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
      "The signs lean toward heat or irritation: the system may be running hotter, more reactive, or more inflamed in traditional observation language.",
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
  const [selected, setSelected] = useState<Set<ChoiceKey>>(new Set(["thinCoat", "bloating", "poorSleep"]));
  const [notes, setNotes] = useState("Bloating after meals, poor sleep, low morning energy.");
  const [imagePreview, setImagePreview] = useState("");
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

  return (
    <main className="min-h-screen bg-[#fbfaf6]">
      <div className="container-shell max-w-6xl py-8 md:py-12">
        <section className="border border-ink/10 bg-white p-5 shadow-card md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow mb-3">Tongue Assessment</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] md:text-6xl">
                Look, select, receive a pattern reflection.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-ink/68">
                A simple Chinese medicine-inspired observation tool. It helps organize tongue color,
                coating, shape, moisture, location signs, and symptoms into a clear educational read.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {["Observe in natural light", "Tap only obvious signs", "Compare with symptoms"].map((item) => (
                  <div key={item} className="border border-ink/10 bg-fog/60 p-3 text-sm leading-6 text-ink/66">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-ink/10 bg-[#f7f4ed] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Photo Reference</p>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                Optional for now. The app does not automatically read the image yet; use it as a visual reference while selecting signs.
              </p>
              <label className="mt-4 block border border-dashed border-ink/18 bg-white/70 p-4 text-sm text-ink/60">
                Add tongue photo
                <input
                  type="file"
                  accept="image/*"
                  className="mt-3 block w-full text-xs"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setImagePreview(file ? URL.createObjectURL(file) : "");
                  }}
                />
              </label>
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Tongue reference preview" className="mt-4 aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="mt-4 flex aspect-[4/3] items-center justify-center border border-ink/10 bg-white/50 text-sm text-ink/40">
                  Preview appears here
                </div>
              )}
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
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <section className="border border-ink/10 bg-white p-5 shadow-card md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow mb-3">Result</p>
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Plain Read</p>
                    <p className="mt-2 text-sm leading-6 text-ink/72">{primary.plain}</p>
                    <p className="mt-3 text-xs leading-5 text-ink/48">Matched: {primary.signs.join(", ")}</p>
                  </article>

                  <ResultList title="Try First" items={primary.tryFirst} />
                  <ResultList title="Observe Next" items={primary.observe} />
                  <ResultList title="Questions That Sharpen This" items={primary.questions} />

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
      </div>
    </main>
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
