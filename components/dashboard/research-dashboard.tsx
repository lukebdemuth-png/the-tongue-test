"use client";

import { ChangeEvent, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";

import {
  ComparableAccount,
  csvTemplate,
  DerivedSignalCard,
  getChannelWatchlist,
  getDerivedSignals,
  getRecommendations,
  getSpikeInsights,
  getTitlePatternInsights,
  getTopicMap,
  getWeeklyBrief,
  parseTrackedPostsCsv,
  serializeTrackedPostsForChatGpt,
  serializeTrackedPostsCsv,
  StrategyCallout,
  titleIdeas as defaultTitleIdeas,
  TitlePatternInsight,
  TopicInsight,
  TrackedPost,
  weeklyPlan,
} from "@/lib/creator-intelligence";

type SharedDashboardState = {
  version: 1;
  posts: TrackedPost[];
  selectedAccount: string;
};

type ResearchDashboardProps = {
  comparableAccounts: ComparableAccount[];
  initialPosts: TrackedPost[];
  strategyCallouts: StrategyCallout[];
};

type AutoTrackState = {
  loading: boolean;
  configured: boolean;
  watchlistSize: number;
  activeWatchlistSize: number;
  stableCoreSize: number;
  rotatingDiscoverySize: number;
  message: string;
  lastRefreshedAt: string;
  channels: Array<{
    channelId: string;
    title: string;
    handle: string;
    subscribers: number;
    totalViews: number;
    videoCount: number;
    niche: string;
    topicFocus: string[];
    priority: "Core" | "Growth" | "Explore";
    layer: "Stable Core" | "Rotating Discovery";
    sizeTier: "Flagship" | "Established" | "Mid-Market" | "Emerging";
    growthStage: "Leader" | "Scaling" | "Steady" | "Breakout";
    cohort: string;
  }>;
  videos: Array<{
    channelId: string;
    channelTitle: string;
    title: string;
    publishedAt: string;
    views: number;
    comments: number;
    likes: number;
    duration: string;
  }>;
  trackedPosts: TrackedPost[];
};

function encodeShareState(state: SharedDashboardState) {
  if (typeof window === "undefined") {
    return "";
  }

  const json = JSON.stringify(state);
  return btoa(encodeURIComponent(json)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeShareState(value: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = decodeURIComponent(atob(padded));
    const parsed = JSON.parse(decoded) as SharedDashboardState;

    if (parsed.version !== 1 || !Array.isArray(parsed.posts) || typeof parsed.selectedAccount !== "string") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function ResearchDashboard({
  comparableAccounts,
  initialPosts,
  strategyCallouts,
}: ResearchDashboardProps) {
  const storageKey = "hi-research-dashboard-posts";
  const sourceKey = "hi-research-dashboard-source";
  const initialSharedState =
    typeof window === "undefined"
      ? null
      : decodeShareState(new URLSearchParams(window.location.search).get("share") ?? "");
  const hasInvalidShareLink =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("share") &&
    !initialSharedState;
  const [posts, setPosts] = useState<TrackedPost[]>(() => {
    if (typeof window === "undefined") {
      return initialPosts;
    }

    if (initialSharedState) {
      return initialSharedState.posts;
    }

    const savedPosts = window.localStorage.getItem(storageKey);
    if (!savedPosts) {
      return initialPosts;
    }

    try {
      const parsed = JSON.parse(savedPosts) as TrackedPost[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialPosts;
    } catch {
      window.localStorage.removeItem(storageKey);
      return initialPosts;
    }
  });
  const [datasetMode, setDatasetMode] = useState<"managed" | "workspace">(() => {
    if (typeof window === "undefined") {
      return "workspace";
    }

    if (initialSharedState) {
      return "workspace";
    }

    return window.localStorage.getItem(sourceKey) === "managed" ? "managed" : "workspace";
  });
  const [csvText, setCsvText] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importMessage, setImportMessage] = useState(
    initialSharedState
      ? `Loaded ${initialSharedState.posts.length} shared rows from a share link.`
      : "Decision engine loaded with starter research.",
  );
  const [shareMessage, setShareMessage] = useState(
    hasInvalidShareLink
      ? "This share link could not be decoded."
      : initialSharedState
        ? "Shared view loaded from link."
        : "",
  );
  const [selectedAccount, setSelectedAccount] = useState(
    initialSharedState?.selectedAccount ?? "All channels",
  );
  const [isPending, startTransition] = useTransition();
  const deferredPosts = useDeferredValue(posts);
  const [autoTrackState, setAutoTrackState] = useState<AutoTrackState>({
    loading: true,
    configured: false,
    watchlistSize: 0,
    activeWatchlistSize: 0,
    stableCoreSize: 0,
    rotatingDiscoverySize: 0,
    message: "Checking managed watchlists...",
    lastRefreshedAt: "",
    channels: [],
    videos: [],
    trackedPosts: [],
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(sourceKey, datasetMode);
  }, [datasetMode]);

  useEffect(() => {
    let cancelled = false;

    async function loadAutoTrackState() {
      try {
        const response = await fetch("/api/watchlist");
        const data = (await response.json()) as Omit<AutoTrackState, "loading">;

        if (!cancelled) {
          setAutoTrackState({
            loading: false,
            ...data,
          });

          if (
            data.configured &&
            data.trackedPosts.length > 0 &&
            typeof window !== "undefined" &&
            !window.localStorage.getItem(sourceKey)
          ) {
            setDatasetMode("managed");
          }
        }
      } catch {
        if (!cancelled) {
          setAutoTrackState({
            loading: false,
            configured: false,
            watchlistSize: 0,
            activeWatchlistSize: 0,
            stableCoreSize: 0,
            rotatingDiscoverySize: 0,
            message: "Managed watchlists are not available in this session yet.",
            lastRefreshedAt: "",
            channels: [],
            videos: [],
            trackedPosts: [],
          });
        }
      }
    }

    loadAutoTrackState();

    return () => {
      cancelled = true;
    };
  }, []);

  const activePosts = useMemo(
    () =>
      datasetMode === "managed" && autoTrackState.trackedPosts.length > 0
        ? autoTrackState.trackedPosts
        : deferredPosts,
    [autoTrackState.trackedPosts, datasetMode, deferredPosts],
  );

  const availableAccounts = useMemo(
    () => ["All channels", ...new Set(activePosts.map((post) => post.account))],
    [activePosts],
  );

  const filteredPosts = useMemo(() => {
    return activePosts.filter((post) => {
      return selectedAccount === "All channels" || post.account === selectedAccount;
    });
  }, [activePosts, selectedAccount]);

  const channelWatchlist = useMemo(() => getChannelWatchlist(filteredPosts), [filteredPosts]);
  const topicInsights = useMemo<TopicInsight[]>(() => getTopicMap(filteredPosts), [filteredPosts]);
  const titlePatterns = useMemo<TitlePatternInsight[]>(
    () => getTitlePatternInsights(filteredPosts),
    [filteredPosts],
  );
  const spikeInsights = useMemo(() => getSpikeInsights(filteredPosts), [filteredPosts]);
  const recommendations = useMemo(() => getRecommendations(filteredPosts), [filteredPosts]);
  const weeklyBrief = useMemo(() => getWeeklyBrief(filteredPosts), [filteredPosts]);
  const derivedSignals = useMemo<DerivedSignalCard[]>(
    () => getDerivedSignals(filteredPosts),
    [filteredPosts],
  );

  async function refreshAutoTracking() {
    setAutoTrackState((current) => ({
      ...current,
      loading: true,
      message: "Refreshing managed watchlists...",
    }));

    try {
      const response = await fetch("/api/watchlist");
      const data = (await response.json()) as Omit<AutoTrackState, "loading">;
      setAutoTrackState({
        loading: false,
        ...data,
      });

      if (data.configured && data.trackedPosts.length > 0) {
        setDatasetMode("managed");
      }
    } catch {
      setAutoTrackState((current) => ({
        ...current,
        loading: false,
        message: "Refresh failed in this session.",
      }));
    }
  }

  function applyCsv(input: string) {
    startTransition(() => {
      const result = parseTrackedPostsCsv(input);

      if (result.errors.length > 0) {
        setImportErrors(result.errors);
        setImportMessage("Workspace import needs cleanup before it can guide decisions.");
      } else {
        setPosts(result.posts);
        setImportErrors([]);
        setImportMessage(`Imported ${result.posts.length} workspace rows.`);
      }
    });
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    setCsvText(text);
    applyCsv(text);
    event.target.value = "";
  }

  function downloadTemplate() {
    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hi-decision-engine-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCurrentView() {
    const blob = new Blob([serializeTrackedPostsCsv(filteredPosts)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hi-decision-engine-current-view.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyCurrentViewForChatGpt() {
    const shareText = serializeTrackedPostsForChatGpt(filteredPosts);

    try {
      await navigator.clipboard.writeText(shareText);
      setShareMessage("Copied a ChatGPT-ready brief of the current view.");
    } catch {
      const blob = new Blob([shareText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "hi-decision-engine-chatgpt-brief.txt";
      link.click();
      URL.revokeObjectURL(url);
      setShareMessage("Clipboard was unavailable, so a ChatGPT-ready text file was downloaded.");
    }
  }

  async function copyShareLink() {
    if (typeof window === "undefined") {
      return;
    }

    const shareState: SharedDashboardState = {
      version: 1,
      posts: filteredPosts,
      selectedAccount,
    };
    const shareToken = encodeShareState(shareState);
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareToken}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage(
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
          ? "Copied a share link. It will only work for others after this app is hosted online."
          : "Copied a share link for the current view.",
      );
    } catch {
      setShareMessage(shareUrl);
    }
  }

  return (
    <main>
      <section className="section-space pb-16 pt-12 md:pb-24 md:pt-20">
        <div className="container-shell">
          <div className="surface-panel overflow-hidden bg-soft-radial">
            <div className="grid gap-10 px-6 py-10 sm:px-8 sm:py-12 lg:grid-cols-[1.02fr_0.98fr] lg:px-12 lg:py-16">
              <div>
                <div className="section-divider max-w-sm" />
                <span className="eyebrow">Himalayan Institute Decision Engine</span>
                <h1 className="max-w-4xl text-[2.9rem] leading-[0.96] sm:text-6xl lg:text-[5.15rem]">
                  What should HI make next, and how should it be packaged for YouTube and Instagram?
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/76 md:text-xl">
                  This app is now designed as a content strategist for spiritual and yoga creators.
                  Every section points toward the next topic, title structure, and content format worth producing.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="button-primary"
                    onClick={refreshAutoTracking}
                    disabled={autoTrackState.loading}
                  >
                    {autoTrackState.loading ? "Refreshing..." : "Refresh Market Signals"}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setDatasetMode("managed")}
                    disabled={autoTrackState.trackedPosts.length === 0}
                  >
                    Use Managed Watchlists
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setDatasetMode("workspace")}
                  >
                    Use Workspace Data
                  </button>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 text-sm text-ink/68">
                  <span className="data-pill">
                    Source: {datasetMode === "managed" ? "Market intelligence" : "Workspace data"}
                  </span>
                  <span className="data-pill">Rows in play: {filteredPosts.length}</span>
                  <span className="data-pill">
                    Universe: {autoTrackState.watchlistSize} channels
                  </span>
                  <span className="data-pill">
                    {autoTrackState.lastRefreshedAt
                      ? `Last refresh ${new Date(autoTrackState.lastRefreshedAt).toLocaleString()}`
                      : "No managed refresh yet"}
                  </span>
                </div>
              </div>

              <div className="gold-grid relative overflow-hidden rounded-[32px] border border-ink/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.64)_0%,rgba(244,240,234,0.74)_100%)] p-6 sm:p-8">
                <div className="absolute right-6 top-6 h-24 w-24 rounded-full border border-clay/15 bg-clay/10 blur-[1px]" />
                <div className="relative space-y-4">
                <article className="metric-card">
                  <p className="text-xs uppercase tracking-[0.22em] text-moss">
                    Best next topic
                    </p>
                    <p className="mt-3 text-xl font-medium text-ink capitalize">
                      {topicInsights[0]?.topic ?? "Need more tracked rows"}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-ink/72">
                      {topicInsights[0]
                        ? `${topicInsights[0].avgVelocity.toLocaleString()} avg views/day with ${topicInsights[0].fit.toLowerCase()} fit for HI.`
                        : "Connect managed watchlists or import a workspace dataset to unlock topic momentum."}
                    </p>
                  </article>
                  <article className="metric-card">
                    <p className="text-xs uppercase tracking-[0.22em] text-moss">
                      Best packaging cue
                    </p>
                    <p className="mt-3 text-xl font-medium text-ink">
                      {titlePatterns[0]?.pattern ?? "No title pattern yet"}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-ink/72">
                      {titlePatterns[0]
                        ? `${Math.round(titlePatterns[0].winRate * 100)}% win rate in the active niche sample.`
                        : "More tracked titles are needed before we can recommend a pattern confidently."}
                    </p>
                  </article>
                  <article className="metric-card">
                    <p className="text-xs uppercase tracking-[0.22em] text-moss">
                      This week
                    </p>
                    <p className="mt-3 text-xl font-medium text-ink">
                      {weeklyBrief.strongestOpportunities[0]}
                    </p>
                </article>
                <article className="metric-card">
                  <p className="text-xs uppercase tracking-[0.22em] text-moss">
                    Intelligence base
                  </p>
                  <p className="mt-3 text-xl font-medium text-ink">
                    {autoTrackState.watchlistSize > 0
                      ? `${autoTrackState.watchlistSize}+ channels`
                      : "Broad market sample"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-ink/72">
                    {autoTrackState.activeWatchlistSize > 0
                      ? `${autoTrackState.stableCoreSize} stable-core channels plus a rotating discovery layer of ${autoTrackState.rotatingDiscoverySize}.`
                      : "Recommendations are designed to use a broad niche sample, not a few top creators."}
                  </p>
                </article>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="section-space bg-white/40 py-0">
        <div className="container-shell">
          <div className="surface-card">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="eyebrow">Decision Lens</span>
                <h2 className="text-[2rem] leading-[1.04] sm:text-[2.6rem]">
                  Narrow the strategist to the channels you want to learn from
                </h2>
              </div>
              <label className="block min-w-[280px]" htmlFor="account-filter">
                <span className="mb-2 block text-sm font-medium text-ink">Channel focus</span>
                <select
                  id="account-filter"
                  value={selectedAccount}
                  onChange={(event) => setSelectedAccount(event.target.value)}
                  className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-moss/45"
                >
                  {availableAccounts.map((account) => (
                    <option key={account} value={account}>
                      {account}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {strategyCallouts.map((item) => (
                <article key={item.title} className="metric-card">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-moss">{item.title}</p>
                  <p className="mt-4 text-sm leading-7 text-ink/76">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-space pt-0">
        <div className="container-shell grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="surface-card">
            <span className="eyebrow">What To Make Next</span>
            <h2 className="text-[2.2rem] leading-[1.04] sm:text-[3rem]">
              The strongest content opportunities right now
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <article className="metric-card">
                <p className="text-[11px] uppercase tracking-[0.18em] text-moss">Strongest topics</p>
                <div className="mt-4 space-y-3">
                  {weeklyBrief.strongestOpportunities.map((item) => (
                    <p key={item} className="text-sm leading-7 text-ink/76">{item}</p>
                  ))}
                </div>
              </article>
              <article className="metric-card">
                <p className="text-[11px] uppercase tracking-[0.18em] text-moss">Avoid</p>
                <div className="mt-4 space-y-3">
                  {weeklyBrief.avoid.map((item) => (
                    <p key={item} className="text-sm leading-7 text-ink/76">{item}</p>
                  ))}
                </div>
              </article>
              <article className="metric-card">
                <p className="text-[11px] uppercase tracking-[0.18em] text-moss">Do next</p>
                <div className="mt-4 space-y-3">
                  {weeklyBrief.nextMoves.map((item) => (
                    <p key={item} className="text-sm leading-7 text-ink/76">{item}</p>
                  ))}
                </div>
              </article>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {recommendations.slice(0, 4).map((item) => (
                <article key={item.title} className="metric-card">
                  <h3 className="text-[1.35rem] leading-tight text-ink">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-ink/74">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="surface-panel overflow-hidden bg-ink text-white">
            <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
              <span className="eyebrow bg-white/10 text-white">Signal Quality</span>
              <h2 className="max-w-3xl text-[2.2rem] leading-[1.04] text-white sm:text-[3rem]">
                Derived signals that actually influence decisions
              </h2>
              <div className="mt-8 space-y-4">
                {derivedSignals.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.06)] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-xl text-white">{item.label}</h3>
                      <span className="data-pill border-white/15 bg-white/5 text-white/82">
                        {item.value}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-white/76">{item.detail}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/56">
                      {item.confidence}
                    </p>
                  </article>
                ))}
                <article className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.06)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-xl text-white">Sample breadth</h3>
                    <span className="data-pill border-white/15 bg-white/5 text-white/82">
                      {autoTrackState.watchlistSize || "200+"}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/76">
                    The decision engine uses a stable core plus rotating discovery channels across flagship,
                    established, mid-market, and breakout creators.
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/56">
                    Known from public data
                  </p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space pt-0">
        <div className="container-shell grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="surface-card">
            <span className="eyebrow">Topic Momentum</span>
            <h2 className="text-[2.2rem] leading-[1.04] sm:text-[3rem]">
              Which spiritual and yoga topics are moving now
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {topicInsights.length > 0 ? (
                topicInsights.map((topic) => (
                  <article key={topic.topic} className="metric-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-xl capitalize text-ink">{topic.topic}</h3>
                      <span className="data-pill">{topic.fit} fit</span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-ink/74">
                      {topic.recentGrowthScore.toLocaleString()} recency-weighted growth score
                    </p>
                    <p className="mt-2 text-sm leading-7 text-ink/68">
                      {topic.frequency} tracked videos · {topic.saturation} saturation
                    </p>
                    <p className="mt-3 text-sm leading-7 text-ink/68">
                      Examples: {topic.sampleTitles.join(" · ")}
                    </p>
                  </article>
                ))
              ) : (
                <article className="metric-card md:col-span-2">
                  <h3 className="text-xl text-ink">No topic map yet</h3>
                  <p className="mt-4 text-sm leading-7 text-ink/74">
                    Connect managed watchlists or import workspace rows to see topic whitespace.
                  </p>
                </article>
              )}
            </div>
          </div>

          <div className="surface-card">
            <span className="eyebrow">Watchlist Leaders</span>
            <h2 className="text-[2.2rem] leading-[1.04] sm:text-[3rem]">
              Which channels are gaining unusually fast
            </h2>
            <div className="mt-8 space-y-4">
              {channelWatchlist.length > 0 ? (
                channelWatchlist.slice(0, 6).map((channel) => (
                  <article key={channel.account} className="metric-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl text-ink">{channel.account}</h3>
                        <p className="mt-1 text-sm text-ink/64">{channel.handle}</p>
                      </div>
                      <span className="data-pill">
                        {channel.avgVelocity.toLocaleString()} views/day
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-ink/74">
                      Best lane: {channel.bestLane} · Top outlier: {channel.topSpikeTitle}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-ink/68">{channel.watchReason}</p>
                  </article>
                ))
              ) : (
                <article className="metric-card">
                  <h3 className="text-xl text-ink">No watchlist rows yet</h3>
                  <p className="mt-4 text-sm leading-7 text-ink/74">
                    The watchlist will surface unusually fast channels once more public rows are available.
                  </p>
                </article>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-space pt-0">
        <div className="container-shell grid gap-5 lg:grid-cols-[0.98fr_1.02fr]">
          <div className="surface-card">
            <span className="eyebrow">Packaging Intelligence</span>
            <h2 className="text-[2.2rem] leading-[1.04] sm:text-[3rem]">
              What title and format patterns are working in the niche
            </h2>
            <div className="mt-8 space-y-4">
              {titlePatterns.length > 0 ? (
                titlePatterns.map((pattern) => (
                  <article key={pattern.pattern} className="metric-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-xl text-ink">{pattern.pattern}</h3>
                      <span className="data-pill">
                        {Math.round(pattern.winRate * 100)}% win rate
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-ink/74">
                      {pattern.avgVelocity.toLocaleString()} avg views/day ·{" "}
                      {pattern.avgViews.toLocaleString()} avg views
                    </p>
                    <p className="mt-3 text-sm leading-7 text-ink/68">
                      Examples: {pattern.examples.join(" · ")}
                    </p>
                  </article>
                ))
              ) : (
                <article className="metric-card">
                  <h3 className="text-xl text-ink">No title intelligence yet</h3>
                  <p className="mt-4 text-sm leading-7 text-ink/74">
                    Bring in more rows and the decision engine will rank the strongest structures.
                  </p>
                </article>
              )}
            </div>
          </div>

          <div className="surface-panel overflow-hidden bg-ink text-white">
            <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
              <span className="eyebrow bg-white/10 text-white">Outlier Videos</span>
              <h2 className="max-w-3xl text-[2.2rem] leading-[1.04] text-white sm:text-[3rem]">
                Packaging cues from videos that beat baseline
              </h2>
              <div className="mt-8 space-y-4">
                {spikeInsights.length > 0 ? (
                  spikeInsights.slice(0, 5).map((item) => (
                    <article
                      key={`${item.account}-${item.title}`}
                      className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.06)] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="text-xl text-white">{item.title}</h3>
                        <span className="data-pill border-white/15 bg-white/5 text-white/82">
                          {item.spikeScore}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-white/76">
                        {item.account} · {item.platform}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-white/76">{item.reason}</p>
                      <p className="mt-2 text-sm leading-7 text-white/62">{item.supportingDetail}</p>
                    </article>
                  ))
                ) : (
                  <article className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.06)] p-5">
                    <p className="text-sm leading-7 text-white/78">
                      No outlier videos are visible in the current sample yet.
                    </p>
                  </article>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space pt-0">
        <div className="container-shell grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="surface-card">
            <span className="eyebrow">What To Plan This Week</span>
            <h2 className="text-[2.2rem] leading-[1.04] sm:text-[3rem]">
              Move from niche signals to actual production
            </h2>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="metric-card">
                <p className="text-[11px] uppercase tracking-[0.18em] text-moss">Weekly flow</p>
                <div className="mt-4 space-y-3">
                  {weeklyPlan.map((item) => (
                    <div key={item.day}>
                      <p className="text-sm font-medium text-ink">{item.day}</p>
                      <p className="text-sm leading-7 text-ink/74">{item.focus}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="metric-card">
                <p className="text-[11px] uppercase tracking-[0.18em] text-moss">Title starters</p>
                <div className="mt-4 space-y-3">
                  {defaultTitleIdeas.slice(0, 8).map((idea) => (
                    <p key={idea} className="text-sm leading-7 text-ink/76">{idea}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                "Save the top 3 competitor videos from this week.",
                "Write why each one worked in one sentence.",
                "Draft your HI angle, title, and short-form cutdown plan.",
              ].map((item) => (
                <article key={item} className="metric-card">
                  <p className="text-sm leading-7 text-ink/76">{item}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="surface-panel overflow-hidden bg-ink text-white">
            <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
              <span className="eyebrow bg-white/10 text-white">Optional Workspace Input</span>
              <h2 className="max-w-3xl text-[2.2rem] leading-[1.04] text-white sm:text-[3rem]">
                Add Instagram notes or your own research only when it helps planning
              </h2>

              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" className="button-primary" onClick={downloadTemplate}>
                  Download CSV Template
                </button>
                <button type="button" className="button-secondary" onClick={exportCurrentView}>
                  Export Current View
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={copyCurrentViewForChatGpt}
                >
                  Copy for ChatGPT
                </button>
                <button type="button" className="button-secondary" onClick={copyShareLink}>
                  Copy Share Link
                </button>
                <label className="button-secondary cursor-pointer">
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <p className="mt-6 text-sm leading-7 text-white/76">{importMessage}</p>
              {shareMessage ? (
                <p className="mt-3 text-sm leading-7 text-white/72">{shareMessage}</p>
              ) : null}
              {isPending ? <p className="mt-3 text-sm text-white/72">Recomputing...</p> : null}

              <label className="mt-6 block" htmlFor="csv-text">
                <span className="mb-2 block text-sm font-medium text-white">Paste workspace CSV</span>
                <textarea
                  id="csv-text"
                  value={csvText}
                  onChange={(event) => setCsvText(event.target.value)}
                  rows={8}
                  placeholder={csvTemplate}
                  className="w-full rounded-[28px] border border-white/10 bg-white/8 px-4 py-4 text-sm outline-none placeholder:text-white/30 focus:border-white/25"
                />
              </label>

              <div className="mt-4">
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => applyCsv(csvText)}
                  disabled={!csvText.trim()}
                >
                  Import Pasted CSV
                </button>
              </div>

              {importErrors.length > 0 ? (
                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/8 p-5">
                  <p className="text-sm font-medium text-white">Import issues</p>
                  <div className="mt-3 space-y-2">
                    {importErrors.map((error) => (
                      <p key={error} className="text-sm leading-7 text-white/72">{error}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="section-space pt-0">
        <div className="container-shell grid gap-5 lg:grid-cols-3">
          {comparableAccounts.slice(0, 3).map((account) => (
            <article key={account.name} className="surface-card">
              <p className="text-[11px] uppercase tracking-[0.18em] text-moss">Why track this channel</p>
              <h3 className="mt-3 text-[1.4rem] leading-tight text-ink">{account.name}</h3>
              <p className="mt-4 text-sm leading-7 text-ink/74">{account.trackFor}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
