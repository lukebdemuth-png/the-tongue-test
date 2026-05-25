import { PatternBrainPrototype } from "@/components/pattern-app/pattern-brain-prototype";
import { buildMetadata } from "@/lib/metadata";
import { notFound } from "next/navigation";

export const metadata = buildMetadata({
  title: "Patterns Brain Prototype",
  description: "A wellness education and self-reflection intake for exploring traditional pattern insights across Ayurveda, Chinese Medicine, and Homeopathy.",
  path: "/pattern-app",
});

export default function PatternAppPage() {
  if (process.env.SHOW_PATTERN_PROTOTYPE !== "true") {
    notFound();
  }

  return <PatternBrainPrototype />;
}
