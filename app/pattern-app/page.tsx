import { PatternBrainPrototype } from "@/components/pattern-app/pattern-brain-prototype";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Patterns Brain Prototype",
  description: "A local practitioner-facing test surface for the Empirical Patterns reasoning trace.",
  path: "/pattern-app",
});

export default function PatternAppPage() {
  return <PatternBrainPrototype />;
}
