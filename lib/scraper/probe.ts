import { BROWSER_HEADERS } from "./http";

export const PROBE_TIMEOUT_MS = 8_000;

/**
 * Lightweight reachability probe: issues a GET with a short timeout and
 * browser headers and reports whether the host answered with a 2xx.
 * Never throws — failures simply report the store as unreachable.
 */
export async function isUrlReachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}