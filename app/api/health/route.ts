import { NextResponse } from "next/server";
import { isUrlReachable } from "@/lib/scraper/probe";
import { SUGGESTIONS_URL as CONTINENTE_SUGGESTIONS_URL } from "@/lib/scraper/continente";
import { SUGGESTIONS_URL as PINGODOCE_SUGGESTIONS_URL } from "@/lib/scraper/pingodoce";
import type { HealthResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const probes = [
    { id: "continente", url: CONTINENTE_SUGGESTIONS_URL("ar") },
    { id: "pingodoce", url: PINGODOCE_SUGGESTIONS_URL("ar") },
  ];

  const results = await Promise.all(
    probes.map(async (probe) => ({
      id: probe.id,
      reachable: await isUrlReachable(probe.url),
    })),
  );

  const stores = results.filter((result) => result.reachable).map((result) => result.id);

  const response: HealthResponse = {
    status: "ok",
    stores,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response);
}