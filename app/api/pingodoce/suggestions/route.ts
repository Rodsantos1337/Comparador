import { NextRequest, NextResponse } from "next/server";
import { parseSuggestionsQuery } from "@/lib/api/parse";
import { getPingoDoceSuggestions } from "@/lib/scraper/pingodoce";
import type { SuggestionsResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = parseSuggestionsQuery(searchParams.get("q"));

  // Suggestions are best-effort: anything unusable or failing yields an empty list.
  if (!query) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await getPingoDoceSuggestions(query);
    const response: SuggestionsResponse = { suggestions };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[pingodoce/suggestions]", error);
    return NextResponse.json({ suggestions: [] });
  }
}