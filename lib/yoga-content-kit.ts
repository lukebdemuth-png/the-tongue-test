export type YogaContentKitInput = {
  classTitle: string;
  teacherName: string;
  transcript: string;
  mainTheme?: string;
  imageNotes?: string;
  productCta?: string;
};

export type Slide = {
  slideTitle: string;
  mainText: string;
  visualDirection: string;
  designNotes: string;
  cta?: string;
};

export type ReelPackage = {
  voiceoverScript: string;
  onScreenText: string[];
  bRollMoments: string[];
  caption: string;
};

export type StoryFrame = {
  text: string;
  cta?: string;
};

export type LeadMagnetPage = {
  pageTitle: string;
  shortTeaching: string;
  pulledClassContent: string[];
  guidedPractice: string[];
  reflectionPrompts: string[];
  cta: string;
};

export type ThumbnailIdea = {
  title: string;
  imageDirection: string;
};

export type StillIdea = {
  headline: string;
  imageDirection: string;
};

export type YogaContentKit = {
  meta: {
    classTitle: string;
    teacherName: string;
    mainTheme: string;
    extractedKeywords: string[];
    supportingTranscriptPulls: string[];
    imageNotes?: string;
    productCta?: string;
  };
  instagramCarousel: Slide[];
  reelPackage: ReelPackage;
  storyPackage: StoryFrame[];
  leadMagnet: {
    title: string;
    pageStructure: LeadMagnetPage[];
  };
  thumbnailIdeas: ThumbnailIdea[];
  igStillIdeas: StillIdea[];
};

const STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "always",
  "around",
  "because",
  "being",
  "between",
  "breath",
  "breathe",
  "breathing",
  "could",
  "every",
  "first",
  "from",
  "going",
  "into",
  "just",
  "maybe",
  "might",
  "more",
  "most",
  "notice",
  "other",
  "really",
  "right",
  "still",
  "than",
  "that",
  "their",
  "there",
  "these",
  "those",
  "through",
  "today",
  "under",
  "until",
  "using",
  "very",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "would",
  "your",
  "youre",
  "this",
  "have",
  "will",
  "they",
  "them",
  "then",
  "here",
  "lets",
  "take",
  "feel",
  "stay",
  "keep",
]);

const BODY_TERMS = [
  "spine",
  "ribs",
  "ribcage",
  "pelvis",
  "hips",
  "hip",
  "shoulders",
  "shoulder",
  "neck",
  "jaw",
  "belly",
  "diaphragm",
  "chest",
  "heart",
  "feet",
  "foot",
  "legs",
  "knees",
  "knee",
  "hands",
  "hand",
  "sternum",
];

function cleanTranscript(transcript: string) {
  return transcript
    .replace(/\r/g, "\n")
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(transcript: string) {
  return cleanTranscript(transcript)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30);
}

function sentenceWords(sentence: string) {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1));
}

function trimSentence(sentence: string, maxLength = 140) {
  const normalized = sentence.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function dedupe(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function getKeywordScores(sentences: string[]) {
  const scores = new Map<string, number>();

  for (const sentence of sentences) {
    for (const word of sentenceWords(sentence)) {
      if (word.length < 4 || STOPWORDS.has(word)) {
        continue;
      }

      scores.set(word, (scores.get(word) ?? 0) + 1);
    }
  }

  return [...scores.entries()].sort((a, b) => b[1] - a[1]);
}

function extractKeywords(sentences: string[]) {
  return getKeywordScores(sentences)
    .slice(0, 8)
    .map(([word]) => toTitleCase(word));
}

function extractBodyTerms(transcript: string) {
  const lowercase = transcript.toLowerCase();
  return BODY_TERMS.filter((term) => lowercase.includes(term));
}

function chooseSnippets(sentences: string[], keywords: string[]) {
  const loweredKeywords = keywords.map((keyword) => keyword.toLowerCase());

  return dedupe(
    sentences
      .map((sentence) => {
        const hits = loweredKeywords.filter((keyword) =>
          sentence.toLowerCase().includes(keyword),
        ).length;

        return { sentence, hits };
      })
      .sort((a, b) => b.hits - a.hits || a.sentence.length - b.sentence.length)
      .slice(0, 12)
      .map(({ sentence }) => trimSentence(sentence, 150)),
  );
}

function firstMatchingSentence(sentences: string[], patterns: string[]) {
  return (
    sentences.find((sentence) =>
      patterns.some((pattern) => sentence.toLowerCase().includes(pattern)),
    ) ?? ""
  );
}

function buildChecklist(sentences: string[], bodyTerms: string[]) {
  const lines = [
    firstMatchingSentence(sentences, ["feet", "foot", "ground"]),
    firstMatchingSentence(sentences, ["spine", "sternum", "length"]),
    firstMatchingSentence(sentences, ["shoulder", "jaw", "neck"]),
    firstMatchingSentence(sentences, ["breath", "exhale", "inhale"]),
  ].filter(Boolean);

  const fallback = [
    bodyTerms[0] ? `Settle awareness into the ${bodyTerms[0]}.` : "Settle the base before adding effort.",
    bodyTerms[1] ? `Let the ${bodyTerms[1]} respond instead of forcing shape.` : "Lengthen before deepening.",
    bodyTerms[2] ? `Soften through the ${bodyTerms[2]} while you breathe.` : "Release the places that grip first.",
    "Keep the breath even enough that the posture stays teachable.",
  ];

  return lines.length >= 3 ? lines.slice(0, 4).map((line) => trimSentence(line, 96)) : fallback;
}

function buildBenefits(sentences: string[], theme: string) {
  const benefitSentences = [
    firstMatchingSentence(sentences, ["supports", "help", "helps"]),
    firstMatchingSentence(sentences, ["steady", "stable", "ground"]),
    firstMatchingSentence(sentences, ["calm", "quiet", "soften"]),
    firstMatchingSentence(sentences, ["energy", "focus", "clarity"]),
  ].filter(Boolean);

  if (benefitSentences.length >= 3) {
    return benefitSentences.slice(0, 4).map((line) => trimSentence(line, 100));
  }

  return [
    `Creates a more teachable entry into ${theme.toLowerCase()}.`,
    "Turns abstract instruction into felt body feedback.",
    "Builds steadiness without hardening the breath.",
    "Gives students a simple cue set they can actually remember.",
  ];
}

function buildInhaleExhale(sentences: string[]) {
  const inhale = firstMatchingSentence(sentences, ["inhale"]);
  const exhale = firstMatchingSentence(sentences, ["exhale"]);

  return {
    inhale: inhale
      ? trimSentence(inhale, 88)
      : "Inhale: create space, length, and a clear starting shape.",
    exhale: exhale
      ? trimSentence(exhale, 88)
      : "Exhale: soften excess effort so the action can land deeper.",
  };
}

function buildHeroWords(keywords: string[], theme: string) {
  const base = dedupe([...keywords.slice(0, 3), ...theme.split(/\s+/).map(toTitleCase)]);
  return base.slice(0, 3);
}

function buildLeadMagnetPages(
  theme: string,
  productCta: string,
  snippets: string[],
  checklist: string[],
) {
  return [
    {
      pageTitle: `${theme}: The Essential Teaching`,
      shortTeaching: snippets[0] ?? `A grounded overview of ${theme.toLowerCase()}.`,
      pulledClassContent: snippets.slice(0, 3),
      guidedPractice: checklist.slice(0, 3),
      reflectionPrompts: [
        "Which cue changed the practice most quickly?",
        "Where did effort become clarity instead of tension?",
      ],
      cta: productCta,
    },
    {
      pageTitle: "Guided Practice",
      shortTeaching: snippets[1] ?? "A short sequence students can revisit on their own.",
      pulledClassContent: snippets.slice(3, 5),
      guidedPractice: checklist,
      reflectionPrompts: [
        "What felt more stable after three slower breaths?",
        "What would you keep in a 5-minute home practice?",
      ],
      cta: productCta,
    },
    {
      pageTitle: "Integration",
      shortTeaching: snippets[2] ?? "Close with a practical takeaway instead of a vague inspiration line.",
      pulledClassContent: snippets.slice(5, 7),
      guidedPractice: [
        "Repeat the practice once with less effort.",
        "Name one cue that should stay with you off the mat.",
      ],
      reflectionPrompts: [
        "What is this practice actually doing in your body?",
        "What changed when the breath became steadier?",
      ],
      cta: productCta,
    },
  ];
}

export function generateYogaContentKit(input: YogaContentKitInput) {
  const transcript = cleanTranscript(input.transcript);
  const sentences = splitSentences(transcript);
  const keywords = extractKeywords(sentences);
  const theme = input.mainTheme?.trim() || keywords.slice(0, 2).join(" + ") || input.classTitle;
  const snippets = chooseSnippets(sentences, keywords);
  const bodyTerms = extractBodyTerms(transcript);
  const checklist = buildChecklist(sentences, bodyTerms);
  const benefits = buildBenefits(sentences, theme);
  const breathBreakdown = buildInhaleExhale(sentences);
  const heroWords = buildHeroWords(keywords, theme);
  const productCta =
    input.productCta?.trim() ||
    "Save this practice and follow Himalayan Institute for more grounded teaching.";
  const imageNotes =
    input.imageNotes?.trim() ||
    "Warm cream background, deep green labels, Himalayan Institute orange accents, clean anatomy-style layout.";
  const anatomyLineA =
    firstMatchingSentence(sentences, ["spine", "ribs", "pelvis", "shoulders", "diaphragm"]) ||
    snippets[0] ||
    `Use the body map to show how ${theme.toLowerCase()} organizes the practice.`;
  const anatomyLineB =
    firstMatchingSentence(sentences, ["jaw", "neck", "hips", "heart", "chest", "belly"]) ||
    snippets[1] ||
    "Point to the areas that need effort and the areas that need release.";

  return {
    meta: {
      classTitle: input.classTitle,
      teacherName: input.teacherName,
      mainTheme: theme,
      extractedKeywords: keywords,
      supportingTranscriptPulls: snippets.slice(0, 6),
      imageNotes,
      productCta,
    },
    instagramCarousel: [
      {
        slideTitle: input.classTitle,
        mainText: `${heroWords.join(" • ")}\n${trimSentence(snippets[0] ?? `${theme} for everyday practice.`, 110)}`,
        visualDirection:
          "Strong photo/text hero slide with teacher portrait or grounded practice image, generous negative space, and 3-word overlay.",
        designNotes: `Warm cream field, deep green headline, orange accent line in #CF6F1A. Use elegant serif header and minimal subcopy. ${imageNotes}`,
      },
      {
        slideTitle: "What This Practice Is Actually Doing",
        mainText: benefits.join("\n"),
        visualDirection:
          "Infographic slide with 3-4 benefit callouts connected to a simple practice silhouette.",
        designNotes:
          "Use anatomy-style labels, short callouts, and a centered figure. Keep each line skimmable and useful.",
      },
      {
        slideTitle: "Breathing Diagram",
        mainText: `${breathBreakdown.inhale}\n${breathBreakdown.exhale}`,
        visualDirection:
          "Breath pathway diagram with inhale arrow rising and exhale arrow softening downward around ribcage or spine.",
        designNotes:
          "Cream background, fine green line art, orange arrows for breath direction, two-column inhale/exhale rhythm.",
      },
      {
        slideTitle: "Posture Checklist",
        mainText: checklist.map((item) => `• ${item}`).join("\n"),
        visualDirection:
          "Checklist slide with subtle icon row and four concise setup points beside a simple posture drawing.",
        designNotes:
          "Make this saveable. Keep each checklist item under two lines. Add light orange checkmarks and deep green body text.",
      },
      {
        slideTitle: "Anatomy Focus",
        mainText: trimSentence(anatomyLineA, 150),
        visualDirection:
          "Infographic slide labeling the key body regions involved in the practice, with arrows to the spine, ribs, pelvis, or shoulders as relevant.",
        designNotes:
          "Use clean line labels and one short explanatory note, not a paragraph. Highlight active versus softening zones.",
      },
      {
        slideTitle: "Inhale / Exhale Breakdown",
        mainText: `Inhale\n${breathBreakdown.inhale}\n\nExhale\n${breathBreakdown.exhale}`,
        visualDirection:
          "Split-panel breath breakdown with left/right blocks and a simple timing marker for the cycle.",
        designNotes:
          "Use large elegant headers, strong spacing, and one orange divider between inhale and exhale.",
      },
      {
        slideTitle: "Second Anatomy Cue",
        mainText: trimSentence(anatomyLineB, 150),
        visualDirection:
          "A second anatomy-style slide focused on the area that students often overwork or miss entirely.",
        designNotes:
          "Show one clear body diagram with labels, a short correction note, and one practical takeaway.",
      },
      {
        slideTitle: "Save This Practice",
        mainText: "Save for your next practice.\nFollow Himalayan Institute for calm, usable teaching.",
        visualDirection:
          "Closing CTA slide with minimal text, brand color block, and small icon treatment.",
        designNotes:
          "Keep it very clean: cream backdrop, deep green body, orange CTA button shape or underline.",
        cta: productCta,
      },
    ],
    reelPackage: {
      voiceoverScript: trimSentence(
        `${input.teacherName} teaches ${theme.toLowerCase()} through simple, teachable actions: ${
          snippets[0] ?? "steady the breath"
        }. Then refine the shape with ${checklist[0].toLowerCase()} and ${checklist[1].toLowerCase()}. The point is not more effort. It is a clearer body response you can actually feel.`,
        260,
      ),
      onScreenText: [
        input.classTitle,
        theme,
        "What this practice is doing",
        "Inhale: make space",
        "Exhale: remove excess effort",
        "Save for practice",
      ],
      bRollMoments: [
        "Teacher setting up the posture slowly from neutral.",
        "Close-up of ribs, shoulders, or hands matching the cue.",
        "Breath moment with visible inhale and softened exhale.",
        "One correction pass showing less effort and more clarity.",
      ],
      caption: `${trimSentence(snippets[0] ?? `${theme} explained with usable cues.`, 120)}\n\nKey cue: ${checklist[0]}\n\n${productCta}`,
    },
    storyPackage: [
      { text: input.classTitle },
      { text: `Theme: ${theme}` },
      { text: trimSentence(checklist[0], 70) },
      { text: trimSentence(checklist[1], 70) },
      { text: "Save this and come back before practice.", cta: productCta },
    ],
    leadMagnet: {
      title: `${input.classTitle}: Practice Notes`,
      pageStructure: buildLeadMagnetPages(theme, productCta, snippets, checklist),
    },
    thumbnailIdeas: [
      {
        title: `${input.classTitle}: What It Is Actually Doing`,
        imageDirection: "Teacher in the practice shape with one orange anatomy label and ample cream space.",
      },
      {
        title: `A Better Way to Practice ${theme}`,
        imageDirection: "Centered portrait plus minimal body-map overlay in deep green.",
      },
      {
        title: "Inhale, Exhale, Refine",
        imageDirection: "Split-panel breathing graphic with soft practice photo.",
      },
      {
        title: `${theme}: 3 Cues That Change Everything`,
        imageDirection: "Hero image with three large serif cue words and orange underline.",
      },
      {
        title: "The Setup Most Students Miss",
        imageDirection: "Checklist-style thumbnail with one posture silhouette and one callout arrow.",
      },
    ],
    igStillIdeas: [
      {
        headline: "What this practice is actually doing",
        imageDirection: "Minimal silhouette with 3 labeled benefit points.",
      },
      {
        headline: "A steadier setup in 4 cues",
        imageDirection: "Checklist card with soft icon row and cream paper texture.",
      },
      {
        headline: "Inhale here. Exhale here.",
        imageDirection: "Simple ribcage or spine breath diagram in green and orange.",
      },
      {
        headline: "Less effort, clearer action",
        imageDirection: "Photo/text still with elegant serif headline and subdued portrait.",
      },
      {
        headline: "One anatomy cue worth saving",
        imageDirection: "Single body diagram with one orange label and one short note.",
      },
    ],
  } satisfies YogaContentKit;
}
