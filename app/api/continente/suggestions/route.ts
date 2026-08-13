import { NextRequest, NextResponse } from "next/server";
import { parseSuggestionsQuery } from "@/lib/api/parse";
import { getContinenteSuggestions } from "@/lib/scraper/continente";
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
    const suggestions = await getContinenteSuggestions(query);
    const response: SuggestionsResponse = { suggestions };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[continente/suggestions]", error);
    return NextResponse.json({ suggestions: [] });
  }
}