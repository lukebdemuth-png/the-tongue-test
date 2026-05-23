export type Platform = "YouTube" | "Instagram";
export type ContentLane =
  | "Meditation"
  | "Yoga"
  | "Philosophy"
  | "Mantra"
  | "Sri Sukta"
  | "Retreat"
  | "Teacher Clip";
export type Format =
  | "Long Video"
  | "Short Clip"
  | "Reel"
  | "Carousel"
  | "Event Promo";

export type StrategyCallout = {
  title: string;
  detail: string;
};

export type LengthGuide = {
  lane: ContentLane | "Deep Lecture";
  youtube: string;
  instagram: string;
  note: string;
};

export type ComparableAccount = {
  name: string;
  handle: string;
  angle: string;
  primaryPlatformFocus: Platform[];
  trackFor: string;
};

export type TrackedPost = {
  account: string;
  platform: Platform;
  format: Format;
  lane: ContentLane;
  title: string;
  durationSeconds: number;
  hookStyle: string;
  visibleViews: number;
  visibleComments: number;
  visibleLikes?: number;
  publishedAt?: string;
  thumbnailStyle?: string;
  lesson: string;
};

export type Recommendation = {
  title: string;
  detail: string;
};

export type TopicInsight = {
  topic: string;
  frequency: number;
  recentGrowthScore: number;
  avgViews: number;
  avgVelocity: number;
  saturation: "Low" | "Medium" | "High";
  fit: "Strong" | "Medium" | "Explore";
  sampleTitles: string[];
};

export type TitlePatternInsight = {
  pattern: string;
  examples: string[];
  avgViews: number;
  avgVelocity: number;
  winRate: number;
};

export type WeeklyBrief = {
  strongestOpportunities: string[];
  avoid: string[];
  nextMoves: string[];
};

export type DerivedSignalCard = {
  label: string;
  value: string;
  detail: string;
  confidence: "Known from public data" | "Estimated" | "Available only for your channel";
};

export type WeeklyAction = {
  day: string;
  focus: string;
  output: string;
};

export type CsvImportResult = {
  posts: TrackedPost[];
  errors: string[];
};

export type SpikeInsight = {
  title: string;
  account: string;
  platform: Platform;
  spikeScore: number;
  reason: string;
  supportingDetail: string;
};

export type ChannelWatch = {
  account: string;
  handle: string;
  trackedPosts: number;
  avgViews: number;
  avgVelocity: number;
  bestLane: string;
  topSpikeTitle: string;
  topSpikeScore: number;
  watchReason: string;
};

export const platformOptions: Platform[] = ["YouTube", "Instagram"];
export const laneOptions: ContentLane[] = [
  "Meditation",
  "Yoga",
  "Philosophy",
  "Mantra",
  "Sri Sukta",
  "Retreat",
  "Teacher Clip",
];
export const formatOptions: Format[] = [
  "Long Video",
  "Short Clip",
  "Reel",
  "Carousel",
  "Event Promo",
];

export const csvTemplate = `account,platform,format,lane,title,durationSeconds,hookStyle,visibleViews,visibleComments,publishedAt,thumbnailStyle,lesson
Himalayan Institute Online,YouTube,Long Video,Meditation,How to Begin a Daily Meditation Practice,840,beginner instruction,15000,18,2026-04-10T12:00:00Z,teacher close-up with text,Beginner meditation content is a strong entry point.
Himalayan Institute Online,Instagram,Reel,Teacher Clip,One teaching on steadiness,38,teacher insight,9200,11,2026-04-15T13:00:00Z,calm speaking clip,Short teacher clips work well as bridges into deeper content.
Comparable Account,Instagram,Reel,Yoga,3 breaths to reset your morning,24,specific benefit,47000,52,2026-04-16T11:30:00Z,movement demo with bold caption,Fast practical yoga cues travel well on Reels.`;

function escapeCsvCell(value: string | number) {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export const strategyCallouts: StrategyCallout[] = [
  {
    title: "Public-data tracker",
    detail:
      "This MVP is built around public posts only: titles, formats, lengths, visible views, comments, hooks, and repeatable themes.",
  },
  {
    title: "Institution-first strategy",
    detail:
      "The goal is not generic creator growth. It is helping Himalayan Institute package authentic teachings in ways people can discover and return to.",
  },
  {
    title: "Recommendations from patterns",
    detail:
      "The dashboard surfaces what appears to be working across comparable accounts, then turns those signals into practical publishing guidance for HI.",
  },
];

export const lengthGuides: LengthGuide[] = [
  {
    lane: "Meditation",
    youtube: "8-15 min",
    instagram: "20-60 sec",
    note: "Best for posture, breath, and beginner obstacle content.",
  },
  {
    lane: "Yoga",
    youtube: "10-20 min",
    instagram: "20-40 sec",
    note: "Lead with a simple benefit such as grounding, morning energy, or relief.",
  },
  {
    lane: "Teacher Clip",
    youtube: "6-12 min",
    instagram: "30-60 sec",
    note: "One question, one answer, one memorable insight.",
  },
  {
    lane: "Sri Sukta",
    youtube: "12-30 min",
    instagram: "30-60 sec",
    note: "Explain context and meaning before going deeper into technical language.",
  },
  {
    lane: "Deep Lecture",
    youtube: "30-75 min",
    instagram: "Use clipped excerpts",
    note: "Anchor content works best when it feeds many short posts.",
  },
  {
    lane: "Retreat",
    youtube: "3-8 min",
    instagram: "15-30 sec",
    note: "Atmosphere and belonging convert better than logistics alone.",
  },
];

export const comparableAccounts: ComparableAccount[] = [
  {
    name: "Yoga With Adriene",
    handle: "@yogawithadriene",
    angle: "Mainstream yoga discovery and high-trust series building",
    primaryPlatformFocus: ["YouTube", "Instagram"],
    trackFor: "Outcome-led titles, repeatable series names, approachable language",
  },
  {
    name: "Yoga with Kassandra",
    handle: "@yogawithkassandra",
    angle: "Searchable yoga library strategy",
    primaryPlatformFocus: ["YouTube", "Instagram"],
    trackFor: "Specific benefits, reliable posting lanes, concise session naming",
  },
  {
    name: "Art of Living",
    handle: "@artofliving",
    angle: "Institutional spiritual education",
    primaryPlatformFocus: ["YouTube", "Instagram"],
    trackFor: "Daily-life framing for meditation and wisdom content",
  },
  {
    name: "Isha Foundation",
    handle: "@ishafoundation",
    angle: "Question-led discourse clips and event amplification",
    primaryPlatformFocus: ["YouTube", "Instagram"],
    trackFor: "Hook structure, clip extraction, event-led spiritual content",
  },
  {
    name: "Sivananda Yoga",
    handle: "@sivanandayoga",
    angle: "Traditional yoga lineage presentation",
    primaryPlatformFocus: ["YouTube", "Instagram"],
    trackFor: "Meditation fundamentals, classical teaching order, conservative packaging",
  },
  {
    name: "Himalayan Institute Online",
    handle: "@himalayaninstitute",
    angle: "Internal benchmark for what HI already teaches publicly",
    primaryPlatformFocus: ["YouTube", "Instagram"],
    trackFor: "Which existing HI content lanes deserve more consistent packaging",
  },
];

export const trackedPosts: TrackedPost[] = [
  {
    account: "Yoga With Adriene",
    platform: "YouTube",
    format: "Long Video",
    lane: "Yoga",
    title: "10 Minute Morning Yoga",
    durationSeconds: 620,
    hookStyle: "specific benefit",
    visibleViews: 1200000,
    visibleComments: 1800,
    publishedAt: "2026-04-01T11:00:00Z",
    thumbnailStyle: "bright yoga posture with short text",
    lesson: "Short, clear benefit-led yoga remains a strong discovery format.",
  },
  {
    account: "Yoga With Adriene",
    platform: "YouTube",
    format: "Long Video",
    lane: "Yoga",
    title: "Yoga for Stress Relief",
    durationSeconds: 940,
    hookStyle: "problem-solution",
    visibleViews: 980000,
    visibleComments: 1500,
    publishedAt: "2026-04-04T13:00:00Z",
    thumbnailStyle: "emotion-led pose with stress keyword",
    lesson: "Titles that name a felt problem create immediate clarity.",
  },
  {
    account: "Yoga with Kassandra",
    platform: "YouTube",
    format: "Long Video",
    lane: "Yoga",
    title: "15 Min Morning Yoga Full Body Stretch",
    durationSeconds: 910,
    hookStyle: "specific benefit",
    visibleViews: 410000,
    visibleComments: 420,
    publishedAt: "2026-04-06T12:30:00Z",
    thumbnailStyle: "stretch pose with duration marker",
    lesson: "Structured titles with duration plus benefit help search and clicks.",
  },
  {
    account: "Yoga with Kassandra",
    platform: "Instagram",
    format: "Reel",
    lane: "Yoga",
    title: "3 poses to wake up your body",
    durationSeconds: 28,
    hookStyle: "numbered tip",
    visibleViews: 72000,
    visibleComments: 88,
    publishedAt: "2026-04-15T14:00:00Z",
    thumbnailStyle: "movement loop with on-screen tip text",
    lesson: "Fast practical micro-teaching performs well on Reels.",
  },
  {
    account: "Art of Living",
    platform: "YouTube",
    format: "Short Clip",
    lane: "Meditation",
    title: "How to Calm an Overactive Mind",
    durationSeconds: 420,
    hookStyle: "daily life problem",
    visibleViews: 215000,
    visibleComments: 240,
    publishedAt: "2026-04-07T15:00:00Z",
    thumbnailStyle: "teacher portrait with problem question",
    lesson: "Meditation framed around real-life struggle is highly portable.",
  },
  {
    account: "Art of Living",
    platform: "Instagram",
    format: "Reel",
    lane: "Teacher Clip",
    title: "One practice to reduce stress today",
    durationSeconds: 36,
    hookStyle: "immediate outcome",
    visibleViews: 91000,
    visibleComments: 130,
    publishedAt: "2026-04-16T09:00:00Z",
    thumbnailStyle: "speaker clip with stress benefit subtitle",
    lesson: "Short promise-led teacher clips create easy entry points.",
  },
  {
    account: "Isha Foundation",
    platform: "YouTube",
    format: "Short Clip",
    lane: "Philosophy",
    title: "Why the Mind Never Feels Satisfied",
    durationSeconds: 510,
    hookStyle: "big life question",
    visibleViews: 480000,
    visibleComments: 760,
    publishedAt: "2026-04-08T10:00:00Z",
    thumbnailStyle: "teacher face with big philosophical question",
    lesson: "Philosophy spreads better when framed as a personal question.",
  },
  {
    account: "Isha Foundation",
    platform: "Instagram",
    format: "Reel",
    lane: "Teacher Clip",
    title: "The problem is not outside you",
    durationSeconds: 41,
    hookStyle: "provocative statement",
    visibleViews: 185000,
    visibleComments: 210,
    publishedAt: "2026-04-17T08:00:00Z",
    thumbnailStyle: "bold quote over teacher clip",
    lesson: "Short tension-based hooks can widen reach for spiritual clips.",
  },
  {
    account: "Sivananda Yoga",
    platform: "YouTube",
    format: "Long Video",
    lane: "Meditation",
    title: "Meditation for Beginners: Posture and Breath",
    durationSeconds: 870,
    hookStyle: "beginner instruction",
    visibleViews: 89000,
    visibleComments: 96,
    publishedAt: "2026-04-05T11:30:00Z",
    thumbnailStyle: "classic teaching slide with meditation label",
    lesson: "Beginner posture and breath teachings remain evergreen.",
  },
  {
    account: "Sivananda Yoga",
    platform: "Instagram",
    format: "Carousel",
    lane: "Meditation",
    title: "5 common meditation obstacles",
    durationSeconds: 1,
    hookStyle: "numbered list",
    visibleViews: 18000,
    visibleComments: 22,
    publishedAt: "2026-04-14T12:00:00Z",
    thumbnailStyle: "carousel card with numbered obstacle list",
    lesson: "Obstacle-based education can work well as swipeable content.",
  },
  {
    account: "Himalayan Institute Online",
    platform: "YouTube",
    format: "Long Video",
    lane: "Meditation",
    title: "Finding Comfort in Your Meditation Posture",
    durationSeconds: 760,
    hookStyle: "beginner instruction",
    visibleViews: 14000,
    visibleComments: 18,
    publishedAt: "2026-04-09T12:00:00Z",
    thumbnailStyle: "meditation posture demonstration with soft text",
    lesson: "HI already has strong practical meditation material to package more consistently.",
  },
  {
    account: "Himalayan Institute Online",
    platform: "YouTube",
    format: "Long Video",
    lane: "Sri Sukta",
    title: "Sri Sukta: Meaning and Practice",
    durationSeconds: 1320,
    hookStyle: "tradition explained",
    visibleViews: 9000,
    visibleComments: 14,
    publishedAt: "2026-04-03T16:00:00Z",
    thumbnailStyle: "scripture title with faculty portrait",
    lesson: "Distinctive scripture content is a differentiator when given clear framing.",
  },
  {
    account: "Himalayan Institute Online",
    platform: "Instagram",
    format: "Reel",
    lane: "Retreat",
    title: "Morning at the retreat center",
    durationSeconds: 18,
    hookStyle: "atmospheric invitation",
    visibleViews: 12500,
    visibleComments: 12,
    publishedAt: "2026-04-17T10:00:00Z",
    thumbnailStyle: "scenic retreat b-roll",
    lesson: "Retreat atmosphere supports brand warmth and belonging.",
  },
  {
    account: "Himalayan Institute Online",
    platform: "Instagram",
    format: "Reel",
    lane: "Teacher Clip",
    title: "What steadies the mind in practice",
    durationSeconds: 42,
    hookStyle: "teacher insight",
    visibleViews: 9800,
    visibleComments: 10,
    publishedAt: "2026-04-16T15:00:00Z",
    thumbnailStyle: "teacher speaking close-up with subtitle",
    lesson: "Teacher clips are a good bridge between philosophy and daily practice.",
  },
];

export function formatDuration(seconds: number): string {
  if (seconds <= 1) {
    return "Static";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${remainder.toString().padStart(2, "0")}s`;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getChannelBaseline(posts: TrackedPost[]) {
  return {
    avgViews: average(posts.map((post) => post.visibleViews)),
    avgVelocity: average(posts.map((post) => getViewVelocity(post))),
    avgCommentsPerThousandViews: average(
      posts.map((post) =>
        post.visibleViews > 0 ? (post.visibleComments / post.visibleViews) * 1000 : 0,
      ),
    ),
  };
}

function inferTopicBucket(post: TrackedPost) {
  const normalized = `${post.title} ${post.lesson}`.toLowerCase();

  if (/(sleep|rest|insomnia|night)/.test(normalized)) {
    return "better sleep";
  }

  if (/(stress|anxious|anxiety|calm|overactive mind)/.test(normalized)) {
    return "stress relief";
  }

  if (/(beginner|start|how to begin|foundation)/.test(normalized)) {
    return "beginner yoga";
  }

  if (/(awakening|awareness|presence|truth|satisfied|mind)/.test(normalized)) {
    return "spiritual awakening";
  }

  if (/(mantra|chant|japa|kirtan)/.test(normalized)) {
    return "mantra practice";
  }

  if (/(sri sukta|scripture|gita|vedanta|upanishad)/.test(normalized)) {
    return "scripture interpretation";
  }

  if (/(breath|pranayama)/.test(normalized)) {
    return "breathwork";
  }

  if (/(daily life|morning|routine|steady|clarity)/.test(normalized)) {
    return "yoga in daily life";
  }

  return post.lane.toLowerCase();
}

function inferTitlePattern(title: string) {
  const normalized = title.toLowerCase().trim();

  if (normalized.startsWith("how to")) {
    return "How to...";
  }

  if (normalized.startsWith("why ")) {
    return "Why...";
  }

  if (normalized.includes(" for ")) {
    return "X for Y";
  }

  if (normalized.includes("beginner")) {
    return "Beginner's guide";
  }

  if (normalized.includes("truth")) {
    return "The truth about...";
  }

  if (normalized.includes("before")) {
    return "Do this before...";
  }

  if (normalized.includes("no one tells")) {
    return "What no one tells you...";
  }

  if (/^\d+/.test(normalized)) {
    return "Number-led";
  }

  return "Insight statement";
}

export function getTopLanes(posts: TrackedPost[]) {
  const laneMap = new Map<
    ContentLane,
    { lane: ContentLane; posts: number; avgViews: number; avgDuration: number }
  >();

  for (const post of posts) {
    const current = laneMap.get(post.lane);
    if (current) {
      current.posts += 1;
      current.avgViews += post.visibleViews;
      current.avgDuration += post.durationSeconds;
    } else {
      laneMap.set(post.lane, {
        lane: post.lane,
        posts: 1,
        avgViews: post.visibleViews,
        avgDuration: post.durationSeconds,
      });
    }
  }

  return [...laneMap.values()]
    .map((item) => ({
      lane: item.lane,
      posts: item.posts,
      avgViews: Math.round(item.avgViews / item.posts),
      avgDuration: Math.round(item.avgDuration / item.posts),
    }))
    .sort((a, b) => b.avgViews - a.avgViews);
}

export function getPlatformBreakdown(posts: TrackedPost[]) {
  const youtubePosts = posts.filter((post) => post.platform === "YouTube");
  const instagramPosts = posts.filter((post) => post.platform === "Instagram");

  return [
    {
      platform: "YouTube" as const,
      avgViews: Math.round(average(youtubePosts.map((post) => post.visibleViews))),
      avgDuration: Math.round(average(youtubePosts.map((post) => post.durationSeconds))),
      topFormat: "8-20 min searchable videos and clipped lectures",
    },
    {
      platform: "Instagram" as const,
      avgViews: Math.round(average(instagramPosts.map((post) => post.visibleViews))),
      avgDuration: Math.round(average(instagramPosts.map((post) => post.durationSeconds))),
      topFormat: "20-60 sec Reels with one clear hook",
    },
  ];
}

export function getAccountSnapshots(posts: TrackedPost[]) {
  const accountMap = new Map(comparableAccounts.map((account) => [account.name, account]));
  const discoveredAccountNames = [...new Set(posts.map((post) => post.account))];

  return discoveredAccountNames.map((accountName) => {
    const accountPosts = posts.filter((post) => post.account === accountName);
    const avgViews = Math.round(average(accountPosts.map((post) => post.visibleViews)));
    const bestPost = [...accountPosts].sort((a, b) => b.visibleViews - a.visibleViews)[0];
    const knownAccount = accountMap.get(accountName);

    return {
      name: accountName,
      handle:
        knownAccount?.handle ??
        `@${accountName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18)}`,
      angle: knownAccount?.angle ?? "Imported research account",
      primaryPlatformFocus:
        knownAccount?.primaryPlatformFocus ??
        [...new Set(accountPosts.map((post) => post.platform))],
      trackFor:
        knownAccount?.trackFor ?? "Review titles, hooks, lengths, and visible engagement.",
      trackedPosts: accountPosts.length,
      avgViews,
      bestLane: bestPost?.lane ?? "Meditation",
      bestHook: bestPost?.hookStyle ?? "specific benefit",
    };
  });
}

export function getRecommendations(posts: TrackedPost[]): Recommendation[] {
  const topLanes = getTopLanes(posts).slice(0, 3);
  const topYoutube = posts
    .filter((post) => post.platform === "YouTube")
    .sort((a, b) => b.visibleViews - a.visibleViews)
    .slice(0, 3);
  const topInstagram = posts
    .filter((post) => post.platform === "Instagram")
    .sort((a, b) => b.visibleViews - a.visibleViews)
    .slice(0, 3);

  return [
    {
      title: "Lead with meditation and yoga entry points",
      detail: `The strongest public discovery lanes in this sample are ${topLanes
        .map((lane) => lane.lane)
        .join(", ")}. HI should use them as front-door content, then guide people toward deeper teachings.`,
    },
    {
      title: "Keep Instagram short and singular",
      detail: `Top-performing Instagram examples here are mostly ${topInstagram
        .map((post) => formatDuration(post.durationSeconds))
        .join(", ")} with one hook, one takeaway, and one emotional or practical promise.`,
    },
    {
      title: "Use YouTube for searchable teaching depth",
      detail: `The top YouTube examples combine clear practical framing with enough depth to feel substantial. The leading sampled titles center on outcomes or questions, not abstract labels alone.`,
    },
    {
      title: "Package Sri Sukta as context plus application",
      detail:
        "HI's distinctive scripture content should stay central, but it will likely travel further when framed as meaning, method, and lived relevance rather than title-only tradition terms.",
    },
    {
      title: "Build a content pyramid every week",
      detail: `The pattern across these public accounts is one anchor piece feeding many assets. Each week, pair one deeper YouTube upload with at least ${Math.max(
        3,
        topInstagram.length + 1,
      )} short clips and one community or retreat-facing post.`,
    },
    {
      title: "Repeat hooks that already match the niche",
      detail: `The strongest hook patterns in this sample are ${[
        ...new Set(
          [...topYoutube, ...topInstagram].map((post) => post.hookStyle),
        ),
      ].join(", ")}. Those are safer bets than vague spiritual phrasing.`,
    },
  ];
}

export const weeklyPlan: WeeklyAction[] = [
  {
    day: "Monday",
    focus: "Log 10-15 public posts from comparable accounts",
    output: "Update titles, lengths, hooks, lanes, and visible engagement",
  },
  {
    day: "Tuesday",
    focus: "Choose HI's anchor teaching for the week",
    output: "One lecture, guided practice, or scripture session to repurpose",
  },
  {
    day: "Thursday",
    focus: "Cut platform-specific assets",
    output: "3-5 reels, 1 YouTube clip, 1 quote or carousel, 1 invitation post",
  },
  {
    day: "Saturday",
    focus: "Publish community and retreat-facing content",
    output: "Reinforce belonging, atmosphere, and live participation",
  },
];

export const titleIdeas = [
  "How to Sit for Meditation Without Pain",
  "A 10-Minute Grounding Yoga Practice",
  "Why the Mind Resists Meditation",
  "What Sri Sukta Teaches About Inner Prosperity",
  "How to Start a Daily Meditation Practice",
  "A Short Morning Practice for Clarity and Steadiness",
  "One Teaching on Desire, Discipline, and Peace",
  "How Breath Changes the Quality of the Mind",
  "What Mantra Is Really Doing in Practice",
  "A Retreat Moment from the Himalayan Institute",
  "How to Begin Working with Sri Sukta",
  "The Role of Posture in Meditation",
];

function isPlatform(value: string): value is Platform {
  return platformOptions.includes(value as Platform);
}

function isLane(value: string): value is ContentLane {
  return laneOptions.includes(value as ContentLane);
}

function isFormat(value: string): value is Format {
  return formatOptions.includes(value as Format);
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

export function parseTrackedPostsCsv(input: string): CsvImportResult {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      posts: [],
      errors: ["The CSV appears to be empty."],
    };
  }

  const headers = parseCsvLine(lines[0]);
  const requiredHeaders = [
    "account",
    "platform",
    "format",
    "lane",
    "title",
    "durationSeconds",
    "hookStyle",
    "visibleViews",
    "visibleComments",
    "lesson",
  ];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    return {
      posts: [],
      errors: [`Missing required columns: ${missingHeaders.join(", ")}`],
    };
  }

  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const posts: TrackedPost[] = [];
  const errors: string[] = [];

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
    const rowNumber = rowIndex + 1;
    const cells = parseCsvLine(lines[rowIndex]);
    const getValue = (header: string) => cells[headerIndex.get(header) ?? -1] ?? "";

    const account = getValue("account");
    const platform = getValue("platform");
    const format = getValue("format");
    const lane = getValue("lane");
    const title = getValue("title");
    const durationSeconds = Number(getValue("durationSeconds"));
    const hookStyle = getValue("hookStyle");
    const visibleViews = Number(getValue("visibleViews"));
    const visibleComments = Number(getValue("visibleComments"));
    const publishedAt = getValue("publishedAt");
    const thumbnailStyle = getValue("thumbnailStyle");
    const lesson = getValue("lesson");

    if (!account || !title || !hookStyle || !lesson) {
      errors.push(`Row ${rowNumber}: account, title, hookStyle, and lesson are required.`);
      continue;
    }

    if (!isPlatform(platform)) {
      errors.push(`Row ${rowNumber}: platform must be one of ${platformOptions.join(", ")}.`);
      continue;
    }

    if (!isFormat(format)) {
      errors.push(`Row ${rowNumber}: format must be one of ${formatOptions.join(", ")}.`);
      continue;
    }

    if (!isLane(lane)) {
      errors.push(`Row ${rowNumber}: lane must be one of ${laneOptions.join(", ")}.`);
      continue;
    }

    if (Number.isNaN(durationSeconds) || durationSeconds < 0) {
      errors.push(`Row ${rowNumber}: durationSeconds must be a zero or positive number.`);
      continue;
    }

    if (Number.isNaN(visibleViews) || visibleViews < 0) {
      errors.push(`Row ${rowNumber}: visibleViews must be a zero or positive number.`);
      continue;
    }

    if (Number.isNaN(visibleComments) || visibleComments < 0) {
      errors.push(`Row ${rowNumber}: visibleComments must be a zero or positive number.`);
      continue;
    }

    posts.push({
      account,
      platform,
      format,
      lane,
      title,
      durationSeconds,
      hookStyle,
      visibleViews,
      visibleComments,
      publishedAt: publishedAt || undefined,
      thumbnailStyle: thumbnailStyle || undefined,
      lesson,
    });
  }

  return { posts, errors };
}

export function serializeTrackedPostsCsv(posts: TrackedPost[]) {
  const headers = [
    "account",
    "platform",
    "format",
    "lane",
    "title",
    "durationSeconds",
    "hookStyle",
    "visibleViews",
    "visibleComments",
    "publishedAt",
    "thumbnailStyle",
    "lesson",
  ];

  const rows = posts.map((post) =>
    [
      post.account,
      post.platform,
      post.format,
      post.lane,
      post.title,
      post.durationSeconds,
      post.hookStyle,
      post.visibleViews,
      post.visibleComments,
      post.publishedAt ?? "",
      post.thumbnailStyle ?? "",
      post.lesson,
    ]
      .map(escapeCsvCell)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

export function serializeTrackedPostsForChatGpt(posts: TrackedPost[]) {
  const topicMap = getTopicMap(posts).slice(0, 5);
  const titlePatterns = getTitlePatternInsights(posts).slice(0, 5);
  const spikes = getSpikeInsights(posts).slice(0, 5);
  const recommendations = getRecommendations(posts).slice(0, 4);
  const weeklyBrief = getWeeklyBrief(posts);
  const channelWatchlist = getChannelWatchlist(posts).slice(0, 5);
  const topLanes = getTopLanes(posts).slice(0, 5);
  const platformBreakdown = getPlatformBreakdown(posts);

  const lines = [
    "You are reviewing a creator content tracker. Use only the information below.",
    "",
    "Please do the following:",
    "1. Summarize the strongest content opportunities in plain English.",
    "2. Suggest 10 next content ideas with titles, format, and why each one fits the dataset.",
    "3. Recommend one weekly publishing plan based on the current signals.",
    "4. Call out any weak spots or missing data that could distort the analysis.",
    "",
    "# Dataset summary",
    `- Tracked posts: ${posts.length}`,
    `- Accounts tracked: ${new Set(posts.map((post) => post.account)).size}`,
    `- Platforms: ${[...new Set(posts.map((post) => post.platform))].join(", ") || "None"}`,
    "",
    "# Top content lanes",
    ...(topLanes.length > 0
      ? topLanes.map(
          (lane) =>
            `- ${lane.lane}: ${lane.posts} posts, ${lane.avgViews.toLocaleString()} avg views, ${formatDuration(lane.avgDuration)} avg duration`,
        )
      : ["- No lane data available"]),
    "",
    "# Platform breakdown",
    ...(platformBreakdown.length > 0
      ? platformBreakdown.map(
          (platform) =>
            `- ${platform.platform}: ${platform.avgViews.toLocaleString()} avg views, ${formatDuration(platform.avgDuration)} avg duration, ${platform.topFormat}`,
        )
      : ["- No platform breakdown available"]),
    "",
    "# Topic momentum",
    ...(topicMap.length > 0
      ? topicMap.map(
          (topic) =>
            `- ${topic.topic}: ${topic.recentGrowthScore.toLocaleString()} growth score, ${topic.avgVelocity.toLocaleString()} avg views/day, ${topic.fit} fit, ${topic.frequency} posts`,
        )
      : ["- No topic momentum data available"]),
    "",
    "# Title patterns",
    ...(titlePatterns.length > 0
      ? titlePatterns.map(
          (pattern) =>
            `- ${pattern.pattern}: ${Math.round(pattern.winRate * 100)}% win rate, ${pattern.avgViews.toLocaleString()} avg views, ${pattern.avgVelocity.toLocaleString()} avg views/day`,
        )
      : ["- No title pattern data available"]),
    "",
    "# Watchlist leaders",
    ...(channelWatchlist.length > 0
      ? channelWatchlist.map(
          (channel) =>
            `- ${channel.account}: ${channel.avgVelocity.toLocaleString()} avg views/day, best lane ${channel.bestLane}, top spike "${channel.topSpikeTitle}"`,
        )
      : ["- No watchlist leader data available"]),
    "",
    "# Outlier posts",
    ...(spikes.length > 0
      ? spikes.map(
          (spike) =>
            `- ${spike.title} | ${spike.account} | ${spike.platform} | spike score ${spike.spikeScore} | ${spike.reason}`,
        )
      : ["- No outlier posts available"]),
    "",
    "# Current recommendations",
    ...(recommendations.length > 0
      ? recommendations.map((recommendation) => `- ${recommendation.title}: ${recommendation.detail}`)
      : ["- No recommendations available"]),
    "",
    "# Weekly brief",
    ...weeklyBrief.strongestOpportunities.map((item) => `- Opportunity: ${item}`),
    ...weeklyBrief.avoid.map((item) => `- Avoid: ${item}`),
    ...weeklyBrief.nextMoves.map((item) => `- Next move: ${item}`),
    "",
    "# Raw tracked posts",
    "```csv",
    serializeTrackedPostsCsv(posts),
    "```",
  ];

  return lines.join("\n");
}

function getAgeInDays(publishedAt?: string) {
  if (!publishedAt) {
    return null;
  }

  const publishedTime = new Date(publishedAt).getTime();
  if (Number.isNaN(publishedTime)) {
    return null;
  }

  const now = Date.now();
  const diff = Math.max(now - publishedTime, 0);
  return Math.max(diff / (1000 * 60 * 60 * 24), 0.25);
}

export function getViewVelocity(post: TrackedPost) {
  const ageInDays = getAgeInDays(post.publishedAt);
  if (!ageInDays) {
    return post.visibleViews;
  }

  return post.visibleViews / ageInDays;
}

export function getSpikeInsights(posts: TrackedPost[]): SpikeInsight[] {
  if (posts.length === 0) {
    return [];
  }

  const avgVelocity = average(posts.map((post) => getViewVelocity(post)));
  const avgViews = average(posts.map((post) => post.visibleViews));

  return posts
    .map((post) => {
      const velocity = getViewVelocity(post);
      const viewRatio = avgViews > 0 ? post.visibleViews / avgViews : 1;
      const velocityRatio = avgVelocity > 0 ? velocity / avgVelocity : 1;
      const score = velocityRatio * 0.65 + viewRatio * 0.35;

      let reason = "View velocity is materially above the current dataset baseline.";
      if (
        (post.thumbnailStyle ?? "").length > 0 &&
        /text|quote|question|bold/i.test(post.thumbnailStyle ?? "")
      ) {
        reason = "This spike combines high view velocity with a more explicit thumbnail or cover pattern.";
      } else if (/question|problem|why|how/i.test(post.title)) {
        reason = "Question-led framing is outperforming the current dataset baseline.";
      }

      return {
        title: post.title,
        account: post.account,
        platform: post.platform,
        spikeScore: Number(score.toFixed(2)),
        reason,
        supportingDetail: `${Math.round(velocity).toLocaleString()} views/day velocity, ${
          post.thumbnailStyle ?? "no thumbnail note"
        }.`,
      };
    })
    .sort((a, b) => b.spikeScore - a.spikeScore)
    .slice(0, 8);
}

export function getChannelWatchlist(posts: TrackedPost[]) {
  const accountMap = new Map(comparableAccounts.map((account) => [account.name, account]));
  const discoveredAccountNames = [...new Set(posts.map((post) => post.account))];

  return discoveredAccountNames
    .map((accountName) => {
      const accountPosts = posts.filter((post) => post.account === accountName);
      const baseline = getChannelBaseline(accountPosts);
      const avgViews = Math.round(baseline.avgViews);
      const avgVelocity = Math.round(baseline.avgVelocity);
      const laneStats = getTopLanes(accountPosts);
      const topSpike = getSpikeInsights(accountPosts)[0];
      const knownAccount = accountMap.get(accountName);

      return {
        account: accountName,
        handle:
          knownAccount?.handle ??
          `@${accountName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18)}`,
        trackedPosts: accountPosts.length,
        avgViews,
        avgVelocity,
        bestLane: laneStats[0]?.lane ?? "Meditation",
        topSpikeTitle: topSpike?.title ?? "No spike row yet",
        topSpikeScore: topSpike?.spikeScore ?? 0,
        watchReason:
          topSpike?.reason ??
          "Needs more tracked rows before a reliable spike baseline can be formed.",
      };
    })
    .sort((a, b) => b.topSpikeScore - a.topSpikeScore);
}

export function getDerivedSignals(posts: TrackedPost[]): DerivedSignalCard[] {
  if (posts.length === 0) {
    return [];
  }

  const mostRecent = [...posts]
    .filter((post) => Boolean(post.publishedAt))
    .sort((a, b) => new Date(b.publishedAt ?? "").getTime() - new Date(a.publishedAt ?? "").getTime());
  const avgViewsPerDay = Math.round(average(posts.map((post) => getViewVelocity(post))));
  const commentsPerThousand = average(
    posts.map((post) => (post.visibleViews > 0 ? (post.visibleComments / post.visibleViews) * 1000 : 0)),
  );
  const recentPosts = mostRecent.slice(0, 10);
  const recentLanes = getTopLanes(recentPosts);

  return [
    {
      label: "Views per day",
      value: avgViewsPerDay.toLocaleString(),
      detail: "Average recency-adjusted velocity across the active dataset.",
      confidence: "Known from public data",
    },
    {
      label: "Comments / 1k views",
      value: commentsPerThousand.toFixed(1),
      detail: "Quick proxy for conversation density and response intensity.",
      confidence: "Known from public data",
    },
    {
      label: "Topic momentum",
      value: recentLanes[0]?.lane ?? "Meditation",
      detail: "The strongest lane in the most recent sample window.",
      confidence: "Estimated",
    },
    {
      label: "Upload consistency",
      value: recentPosts.length >= 8 ? "High" : recentPosts.length >= 4 ? "Medium" : "Low",
      detail: "Estimated from how many recent publish dates are available in the current set.",
      confidence: "Estimated",
    },
  ];
}

export function getTopicMap(posts: TrackedPost[]): TopicInsight[] {
  const topicMap = new Map<string, TrackedPost[]>();

  for (const post of posts) {
    const topic = inferTopicBucket(post);
    const current = topicMap.get(topic) ?? [];
    current.push(post);
    topicMap.set(topic, current);
  }

  return [...topicMap.entries()]
    .map(([topic, topicPosts]) => {
      const recentPosts = topicPosts.filter((post) => {
        const age = getAgeInDays(post.publishedAt);
        return age !== null && age <= 30;
      });
      const avgViews = Math.round(average(topicPosts.map((post) => post.visibleViews)));
      const avgVelocity = Math.round(average(topicPosts.map((post) => getViewVelocity(post))));
      const recentGrowthScore = Math.round(
        average(recentPosts.map((post) => getViewVelocity(post))) || avgVelocity,
      );
      const saturation: TopicInsight["saturation"] =
        topicPosts.length >= 6 ? "High" : topicPosts.length >= 3 ? "Medium" : "Low";
      const fit: TopicInsight["fit"] =
        /scripture|breathwork|stress relief|yoga in daily life|meditation/.test(topic)
          ? "Strong"
          : /beginner|spiritual awakening/.test(topic)
            ? "Medium"
            : "Explore";

      return {
        topic,
        frequency: topicPosts.length,
        recentGrowthScore,
        avgViews,
        avgVelocity,
        saturation,
        fit,
        sampleTitles: topicPosts.slice(0, 3).map((post) => post.title),
      };
    })
    .sort((a, b) => b.recentGrowthScore - a.recentGrowthScore)
    .slice(0, 8);
}

export function getTitlePatternInsights(posts: TrackedPost[]): TitlePatternInsight[] {
  const patternMap = new Map<string, TrackedPost[]>();
  const globalAverageViews = average(posts.map((post) => post.visibleViews));

  for (const post of posts) {
    const pattern = inferTitlePattern(post.title);
    const current = patternMap.get(pattern) ?? [];
    current.push(post);
    patternMap.set(pattern, current);
  }

  return [...patternMap.entries()]
    .map(([pattern, patternPosts]) => {
      const wins = patternPosts.filter((post) => post.visibleViews >= globalAverageViews).length;

      return {
        pattern,
        examples: patternPosts.slice(0, 3).map((post) => post.title),
        avgViews: Math.round(average(patternPosts.map((post) => post.visibleViews))),
        avgVelocity: Math.round(average(patternPosts.map((post) => getViewVelocity(post)))),
        winRate: Number((wins / patternPosts.length).toFixed(2)),
      };
    })
    .sort((a, b) => b.winRate - a.winRate || b.avgVelocity - a.avgVelocity)
    .slice(0, 6);
}

export function getWeeklyBrief(posts: TrackedPost[]): WeeklyBrief {
  const topicMap = getTopicMap(posts);
  const titlePatterns = getTitlePatternInsights(posts);
  const spikes = getSpikeInsights(posts);

  const strongestOpportunities = [
    topicMap[0]
      ? `${topicMap[0].topic} content with recency-weighted momentum`
      : "Practical spirituality with a clear promised result",
    titlePatterns[0]
      ? `${titlePatterns[0].pattern} titles in the strongest current lane`
      : "Outcome-led titles with stronger specificity",
    spikes[0]
      ? `${spikes[0].platform} clips that mirror ${spikes[0].reason.toLowerCase()}`
      : "Short clips built from deeper anchor teachings",
  ];

  const avoid = [
    "Broad spiritual titles with no promised result",
    "Low-context event promos unless they are tied to a transformation story",
    "Long talks without a clear question, benefit, or tension hook",
  ];

  const nextMoves = [
    "Pick one anchor teaching and cut three short clips from it.",
    "Draft ten titles using the top-performing pattern structures.",
    "Save two overperforming competitor videos and note why they beat baseline.",
  ];

  return {
    strongestOpportunities,
    avoid,
    nextMoves,
  };
}
