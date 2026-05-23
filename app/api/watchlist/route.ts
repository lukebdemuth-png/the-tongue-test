import { NextResponse } from "next/server";

import { fetchAutoTrackedYouTubeData } from "@/lib/youtube-tracker";

export async function GET() {
  try {
    const data = await fetchAutoTrackedYouTubeData();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error while fetching watchlist data.";

    return NextResponse.json(
      {
        configured: false,
        watchlistSize: 0,
        activeWatchlistSize: 0,
        stableCoreSize: 0,
        rotatingDiscoverySize: 0,
        channels: [],
        videos: [],
        trackedPosts: [],
        lastRefreshedAt: new Date().toISOString(),
        message,
      },
      { status: 500 },
    );
  }
}
