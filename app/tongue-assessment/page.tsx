import { TongueAssessmentApp } from "@/components/tongue-assessment/tongue-assessment-app";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Tongue Assessment",
  description: "A Chinese medicine-inspired wellness education tool for organizing tongue observations into practical pattern reflections.",
  path: "/tongue-assessment",
});

export default function TongueAssessmentPage() {
  return <TongueAssessmentApp />;
}
