import { TongueAssessmentApp } from "@/components/tongue-assessment/tongue-assessment-app";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "The Tongue Test",
  description:
    "AI-guided tongue observation inspired by Traditional Chinese Medicine, translated into plain-English wellness insights, food direction, and lifestyle reflections.",
  path: "/pattern-app",
});

export default function PatternAppPage() {
  return <TongueAssessmentApp />;
}
