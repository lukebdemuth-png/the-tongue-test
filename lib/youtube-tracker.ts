import { TrackedPost } from "@/lib/creator-intelligence";
import {
  getActiveWatchlistSeeds,
  watchlistSeeds,
  watchlistUniverseStats,
} from "@/lib/watchlist-config";

type YouTubeSearchItem = {
  id?: {
    channelId?: string;
  };
  snippet?: {
    channelTitle?: string;
    title?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
};

type YouTubeChannelItem = {
  id: string;
  snippet?: {
    title?: string;
    customUrl?: string;
    thumbnails?: {
      high?: { url?: string };
    };
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
  };
  contentDetails?: {
    relatedPlaylists?: {
      uploads?: string;
    };
  };
};

type YouTubePlaylistItem = {
  contentDetails?: {
    videoId?: string;
  };
};

type YouTubeVideoItem = {
  id: string;
  snippet?: {
    title?: string;
    publishedAt?: string;
    channelTitle?: string;
    channelId?: string;
    thumbnails?: {
      maxres?: { url?: string };
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
  statistics?: {
    viewCount?: string;
    commentCount?: string;
    likeCount?: string;
  };
  contentDetails?: {
    duration?: string;
  };
};

export type AutoTrackedChannel = {
  query: string;
  channelId: string;
  title: string;
  handle: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  thumbnailUrl: string;
  niche: string;
  topicFocus: string[];
  priority: "Core" | "Growth" | "Explore";
  layer: "Stable Core" | "Rotating Discovery";
  sizeTier: "Flagship" | "Established" | "Mid-Market" | "Emerging";
  growthStage: "Leader" | "Scaling" | "Steady" | "Breakout";
  cohort: string;
};

export type AutoTrackedVideo = {
  channelId: string;
  channelTitle: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  views: number;
  comments: number;
  likes: number;
  duration: string;
};

export type AutoTrackResult = {
  configured: boolean;
  watchlistSize: number;
  activeWatchlistSize: number;
  stableCoreSize: number;
  rotatingDiscoverySize: number;
  channels: AutoTrackedChannel[];
  videos: AutoTrackedVideo[];
  trackedPosts: TrackedPost[];
  lastRefreshedAt: string;
  message: string;
};

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

async function fetchYouTubeJson<T>(path: string, apiKey: string) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${YOUTUBE_API_BASE}${path}${separator}key=${apiKey}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`YouTube API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function toNumber(value?: string) {
  return value ? Number(value) : 0;
}

function parseIsoDurationToSeconds(duration: string) {
  const match =
    /P(?:\d+Y)?(?:\d+M)?(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(duration);

  if (!match) {
    return 0;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  return hours * 3600 + minutes * 60 + seconds;
}

function inferLane(title: string): TrackedPost["lane"] {
  const normalized = title.toLowerCase();

  if (normalized.includes("sri sukta")) {
    return "Sri Sukta";
  }

  if (
    normalized.includes("yoga") ||
    normalized.includes("asana") ||
    normalized.includes("stretch")
  ) {
    return "Yoga";
  }

  if (
    normalized.includes("meditation") ||
    normalized.includes("breath") ||
    normalized.includes("mindful")
  ) {
    return "Meditation";
  }

  if (
    normalized.includes("retreat") ||
    normalized.includes("ashram") ||
    normalized.includes("center")
  ) {
    return "Retreat";
  }

  if (
    normalized.includes("mantra") ||
    normalized.includes("chant") ||
    normalized.includes("kirtan")
  ) {
    return "Mantra";
  }

  if (
    normalized.includes("why") ||
    normalized.includes("what") ||
    normalized.includes("how") ||
    normalized.includes("?")
  ) {
    return "Philosophy";
  }

  return "Teacher Clip";
}

function inferHookStyle(title: string) {
  const normalized = title.toLowerCase().trim();

  if (normalized.includes("?") || normalized.startsWith("why ") || normalized.startsWith("what ")) {
    return "question-led";
  }

  if (normalized.startsWith("how to")) {
    return "how-to";
  }

  if (/^\d+/.test(normalized)) {
    return "numbered list";
  }

  if (normalized.includes("for ")) {
    return "specific outcome";
  }

  return "teacher insight";
}

function inferThumbnailStyle(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("meditation") || normalized.includes("breath")) {
    return "teacher close-up with calm practice cue";
  }

  if (normalized.includes("yoga") || normalized.includes("stretch")) {
    return "movement pose with short benefit text";
  }

  if (normalized.includes("sri sukta") || normalized.includes("mantra")) {
    return "sacred-text framing with teacher portrait";
  }

  if (normalized.includes("?")) {
    return "teacher portrait with a big question hook";
  }

  return "speaker portrait with simple contrast text";
}

function toTrackedPost(video: AutoTrackedVideo, channel: AutoTrackedChannel): TrackedPost {
  const durationSeconds = parseIsoDurationToSeconds(video.duration);

  return {
    account: channel.title,
    platform: "YouTube",
    format: durationSeconds >= 600 ? "Long Video" : "Short Clip",
    lane: inferLane(video.title),
    title: video.title,
    durationSeconds,
    hookStyle: inferHookStyle(video.title),
    visibleViews: video.views,
    visibleComments: video.comments,
    visibleLikes: video.likes,
    publishedAt: video.publishedAt,
    thumbnailStyle: inferThumbnailStyle(video.title),
    lesson: `${channel.niche}. Watch for ${channel.topicFocus.slice(0, 2).join(" and ")} patterns.`,
  };
}

async function resolveChannelId(apiKey: string, query: string) {
  const data = await fetchYouTubeJson<{ items?: YouTubeSearchItem[] }>(
    `/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(query)}`,
    apiKey,
  );

  return data.items?.[0]?.id?.channelId;
}

async function fetchChannel(channelId: string, apiKey: string) {
  const data = await fetchYouTubeJson<{ items?: YouTubeChannelItem[] }>(
    `/channels?part=snippet,statistics,contentDetails&id=${encodeURIComponent(channelId)}`,
    apiKey,
  );

  return data.items?.[0];
}

async function fetchLatestUploads(playlistId: string, apiKey: string) {
  const data = await fetchYouTubeJson<{ items?: YouTubePlaylistItem[] }>(
    `/playlistItems?part=contentDetails&playlistId=${encodeURIComponent(playlistId)}&maxResults=5`,
    apiKey,
  );

  return (data.items ?? [])
    .map((item) => item.contentDetails?.videoId)
    .filter((value): value is string => Boolean(value));
}

async function fetchVideos(videoIds: string[], apiKey: string) {
  if (videoIds.length === 0) {
    return [];
  }

  const data = await fetchYouTubeJson<{ items?: YouTubeVideoItem[] }>(
    `/videos?part=snippet,statistics,contentDetails&id=${encodeURIComponent(videoIds.join(","))}`,
    apiKey,
  );

  return data.items ?? [];
}

export async function fetchAutoTrackedYouTubeData(): Promise<AutoTrackResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const lastRefreshedAt = new Date().toISOString();
  const activeSeeds = getActiveWatchlistSeeds();

  if (!apiKey) {
    return {
      configured: false,
      watchlistSize: watchlistSeeds.length,
      activeWatchlistSize: activeSeeds.length,
      stableCoreSize: watchlistUniverseStats.stableCoreSeeds,
      rotatingDiscoverySize: watchlistUniverseStats.rotatingDiscoverySeeds,
      channels: [],
      videos: [],
      trackedPosts: [],
      lastRefreshedAt,
      message:
        "No uploads are required, but the app still needs a YOUTUBE_API_KEY to pull public channel data automatically across the broader 200+ channel intelligence universe. Instagram auto-tracking will require separate Meta access.",
    };
  }

  const resolved = await Promise.all(
    activeSeeds.map(async (seed) => {
      const channelId = await resolveChannelId(apiKey, seed.query);
      if (!channelId) {
        return null;
      }

      const channel = await fetchChannel(channelId, apiKey);
      if (!channel) {
        return null;
      }

      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
      const videoIds = uploadsPlaylistId ? await fetchLatestUploads(uploadsPlaylistId, apiKey) : [];
      const videos = await fetchVideos(videoIds, apiKey);

      return {
        channel: {
          query: seed.query,
          channelId,
          title: channel.snippet?.title ?? seed.name,
          handle: channel.snippet?.customUrl ? `@${channel.snippet.customUrl}` : seed.name,
          subscribers: toNumber(channel.statistics?.subscriberCount),
          totalViews: toNumber(channel.statistics?.viewCount),
          videoCount: toNumber(channel.statistics?.videoCount),
          thumbnailUrl: channel.snippet?.thumbnails?.high?.url ?? "",
          niche: seed.niche,
          topicFocus: seed.topicFocus,
          priority: seed.priority,
          layer: seed.layer,
          sizeTier: seed.sizeTier,
          growthStage: seed.growthStage,
          cohort: seed.cohort,
        },
        videos: videos.map<AutoTrackedVideo>((video) => ({
          channelId,
          channelTitle: video.snippet?.channelTitle ?? seed.name,
          title: video.snippet?.title ?? "Untitled video",
          publishedAt: video.snippet?.publishedAt ?? "",
          thumbnailUrl:
            video.snippet?.thumbnails?.maxres?.url ??
            video.snippet?.thumbnails?.high?.url ??
            video.snippet?.thumbnails?.medium?.url ??
            video.snippet?.thumbnails?.default?.url ??
            "",
          views: toNumber(video.statistics?.viewCount),
          comments: toNumber(video.statistics?.commentCount),
          likes: toNumber(video.statistics?.likeCount),
          duration: video.contentDetails?.duration ?? "",
        })),
      };
    }),
  );

  const channels = resolved
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => item.channel);
  const videos = resolved
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .flatMap((item) => item.videos)
    .sort((a, b) => b.views - a.views);
  const channelMap = new Map(channels.map((channel) => [channel.channelId, channel]));
  const trackedPosts = videos
    .map((video) => {
      const channel = channelMap.get(video.channelId);
      return channel ? toTrackedPost(video, channel) : null;
    })
    .filter((post): post is TrackedPost => Boolean(post));

  return {
    configured: true,
    watchlistSize: watchlistSeeds.length,
    activeWatchlistSize: activeSeeds.length,
    stableCoreSize: watchlistUniverseStats.stableCoreSeeds,
    rotatingDiscoverySize: watchlistUniverseStats.rotatingDiscoverySeeds,
    channels,
    videos,
    trackedPosts,
    lastRefreshedAt,
    message: `Fetched ${channels.length} channels and ${videos.length} recent public videos from an active slice of ${activeSeeds.length} channels inside a ${watchlistSeeds.length}-channel intelligence universe. Recommendations are based on the broader market base, not just a few dominant creators.`,
  };
}
