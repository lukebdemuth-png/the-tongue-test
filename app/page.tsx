import { ResearchDashboard } from "@/components/dashboard/research-dashboard";
import { buildMetadata } from "@/lib/metadata";
import {
  comparableAccounts,
  strategyCallouts,
  trackedPosts,
} from "@/lib/creator-intelligence";

export const metadata = buildMetadata({
  title: "Himalayan Institute Research Dashboard",
  description:
    "A managed public-signal tracker for Himalayan Institute Instagram and YouTube with channel watchlists, spike detection, posting guidance, and generated recommendations.",
  path: "/",
});

export default function HomePage() {
  return (
    <ResearchDashboard
      comparableAccounts={comparableAccounts}
      initialPosts={trackedPosts}
      strategyCallouts={strategyCallouts}
    />
  );
}
