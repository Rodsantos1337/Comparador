import { NextRequest, NextResponse } from "next/server";

/**
 * CORS for the public API routes.
 *
 * The grocery app calls these endpoints straight from the browser, so the
 * response must echo its origin. Only origins listed in SHOP_ALLOWED_ORIGINS are
 * accepted — a browser on any other site gets no CORS header and is blocked by
 * the browser (curl is unaffected, these endpoints stay public read-only).
 */
const DEFAULT_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

function allowedOrigins(): string[] {
  const raw = process.env.SHOP_ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ORIGINS;
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function withCors(response: NextResponse, origin: string | null): NextResponse {
  // The allowed set can differ per environment, so caches must key on Origin.
  response.headers.set("Vary", "Origin");

  if (!origin || !allowedOrigins().includes(origin)) return response;

  response.headers.set("Access-Control-Allow-Origin", origin);
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
