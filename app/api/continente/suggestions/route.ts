import { NextRequest, NextResponse } from "next/server";
import { SuggestionsResponse } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  const response: SuggestionsResponse = {
    suggestions: ["arroz", "arroz carolino", "arroz agulha", "arroz basmati"].filter(s => s.includes(q.toLowerCase()))
  };

  return NextResponse.json(response);
}
