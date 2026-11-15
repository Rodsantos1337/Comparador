import { NextRequest, NextResponse } from "next/server";
import { BROWSER_HEADERS, REQUEST_TIMEOUT_MS } from "@/lib/scraper/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Proxy for store product images.
 *
 * The store CDNs send no CORS headers, so a browser app cannot read the bytes of
 * an <img> it displays. This route re-serves the image from our own origin (with
 * CORS from middleware.ts) so the grocery app can copy it into Firestore.
 *
 * Only the two store CDNs are allowed, over https — the URL comes from the
 * caller, so this is also an SSRF guard.
 */
const ALLOWED_HOSTS = new Set([
  "www.continente.pt",
  "www.pingodoce.pt",
  "static.pingodoce.pt",
]);

function parseImageUrl(raw: string | null): URL | null {
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (!ALLOWED_HOSTS.has(url.hostname)) return null;

  return url;
}

export async function GET(req: NextRequest) {
  const url = parseImageUrl(new URL(req.url).searchParams.get("url"));

  if (!url) {
    return NextResponse.json(
      { error: 'Query parameter "url" must be an https URL on an allowed store host' },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(url, {
      headers: BROWSER_HEADERS,
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Store returned ${upstream.status}` },
        { status: 502 },
      );
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    console.error("[image]", error);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
