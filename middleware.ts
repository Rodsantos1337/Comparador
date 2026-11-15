import { NextRequest, NextResponse } from "next/server";

/**
 * CORS for the public API routes.
 *
 * The API is public and read-only (scraped prices, no user data, no auth), so
 * every origin is allowed to read it by default — that lets a separate frontend
 * consume it straight from the browser. Deployments that want to restrict this
 * set SHOP_ALLOWED_ORIGINS to a comma separated list of origins; browsers on any
 * other site then get no CORS header and are blocked by the browser (curl is
 * unaffected).
 */

function allowedOrigins(): string[] | null {
  const raw = process.env.SHOP_ALLOWED_ORIGINS;
  if (!raw || !raw.trim()) return null; // null = allow any origin

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function withCors(response: NextResponse, origin: string | null): NextResponse {
  if (!origin) return response; // not a browser cross-origin request

  const allowed = allowedOrigins();

  if (allowed) {
    // The allowed set can differ per environment, so caches must key on Origin.
    response.headers.set("Vary", "Origin");
    if (!allowed.includes(origin)) return response;

    response.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return withCors(new NextResponse(null, { status: 204 }), origin);
  }

  return withCors(NextResponse.next(), origin);
}

export const config = {
  matcher: "/api/:path*",
};
