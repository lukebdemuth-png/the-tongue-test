export type FreeContentResource = {
  slug: string;
  title: string;
  eyebrow: string;
  format: "PDF" | "Audio" | "Video" | "Guide";
  description: string;
  promise: string;
  assetHref?: string;
  assetLabel?: string;
};

export const freeContentResources: FreeContentResource[] = [
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
