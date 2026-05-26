export type FreeContentResource = {
  slug: string;
  title: string;
  eyebrow: string;
  format: "PDF" | "Audio" | "Video" | "Guide";
  description: string;
  promise: string;
  assetHref?: string;
  assetLabel?: string;
  unlockSections?: Array<{
    title: string;
    items: string[];
  }>;
};

export const freeContentResources: FreeContentResource[] = [
  {
    slug: "tongue-photo-guide",
    title: "How To Take A Clear Tongue Photo",
    eyebrow: "Free Tongue Test: TCM AI guide",
    format: "Guide",
    description:
      "A simple photo checklist for taking a tongue image that can be read more clearly: lighting, angle, timing, framing, and what to avoid before taking the photo.",
    promise:
      "Sign up to unlock the guide and get practical educational notes on tongue observation, Traditional Chinese Medicine-inspired pattern reflection, and the Tongue Test: TCM AI launch.",
    assetLabel: "Open the guide",
    unlockSections: [
      {
        title: "Best timing",
        items: [
          "Take the photo before coffee, tea, wine, candy, turmeric, strongly colored drinks, tongue scraping, or brushing the tongue when possible.",
          "Wait 30-60 minutes after eating or drinking anything colored.",
          "Use the same time of day for follow-up photos so comparisons are more useful.",
        ],
      },
      {
        title: "Lighting",
        items: [
          "Use natural daylight or neutral indoor light.",
          "Avoid flash when possible because glare can hide coating and moisture.",
          "Retake if the image looks too yellow, too dark, shadowed, or overexposed.",
        ],
      },
      {
        title: "Framing",
        items: [
          "Open your mouth and relax the tongue without forcing it flat.",
          "Center the full tongue in the frame, including the tip, center, sides, and back/root when visible.",
          "Move close enough to see coating, color, edges, cracks, and moisture clearly.",
        ],
      },
      {
        title: "What the app reviews",
        items: [
          "Tongue body color, coating color, coating thickness, moisture, shape, cracks, scallops, and location clues.",
          "Photo-quality notes come before TCM-style educational pattern language.",
          "Results are educational wellness notes only, not diagnosis, treatment, or medical advice.",
        ],
      },
    ],
  },
  {
    slug: "single-symptom-intake-prompts",
    title: "Single-Symptom Intake Prompts",
    eyebrow: "Free practitioner guide",
    format: "PDF",
    description:
      "A short guide for turning a one-word symptom into better follow-up questions before comparing Homeopathy, Ayurveda, and Chinese medicine perspectives.",
    promise:
      "Sign up for the newsletter to unlock this resource and get future educational notes on pattern recognition, traditional interpretation, and safer practitioner review.",
    assetLabel: "Open the PDF",
  },
];

export function getFreeContentResource(slug: string) {
  return freeContentResources.find((resource) => resource.slug === slug);
}
