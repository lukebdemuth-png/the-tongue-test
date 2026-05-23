import { PageShell } from "@/components/layout/page-shell";
import { YogaContentKitGenerator } from "@/components/tools/yoga-content-kit-generator";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Yoga Class Content Kit Generator",
  description:
    "Turn a yoga class or lecture transcript into a full Himalayan Institute social content kit with carousel, Reel, Stories, lead magnet, and reusable JSON.",
  path: "/resources/yoga-content-kit",
});

export default function YogaContentKitPage() {
  return (
    <PageShell
      eyebrow="Free Tool"
      title="Turn one yoga transcript into a full social content kit."
      intro="Paste or upload a transcript, add the theme and CTA if you have them, and generate a clean package for Instagram, Stories, Reels, lead magnets, and design handoff."
    >
      <YogaContentKitGenerator />
    </PageShell>
  );
}
