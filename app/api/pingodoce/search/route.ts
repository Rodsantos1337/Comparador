import { NextRequest, NextResponse } from "next/server";
import { parseSearchQuery, parseStart } from "@/lib/api/parse";
import { searchPingoDoce } from "@/lib/scraper/pingodoce";
import type { SearchResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = parseSearchQuery(searchParams.get("q"));

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  const start = parseStart(searchParams.get("start"));

  try {
    const products = await searchPingoDoce(query, { start });
    const response: SearchResponse = { query, count: products.length, products };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[pingodoce/search]", error);
    return NextResponse.json(
      { error: "Failed to scrape data", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}