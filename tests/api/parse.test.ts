import { describe, expect, it } from "vitest";
import { parseSearchQuery, parseStart, parseSuggestionsQuery } from "@/lib/api/parse";

describe("parseSearchQuery", () => {
  it("accepts a non-empty query and trims whitespace", () => {
    expect(parseSearchQuery("  arroz  ")).toBe("arroz");
  });

  it("rejects empty or missing queries", () => {
    expect(parseSearchQuery("")).toBeNull();
    expect(parseSearchQuery("   ")).toBeNull();
    expect(parseSearchQuery(null)).toBeNull();
  });
});

describe("parseStart", () => {
  it("parses a non-negative integer", () => {
    expect(parseStart("0")).toBe(0);
    expect(parseStart("24")).toBe(24);
  });

  it("defaults to 0 for invalid input", () => {
    expect(parseStart("abc")).toBe(0);
    expect(parseStart("-1")).toBe(0);
    expect(parseStart("1.5")).toBe(0);
    expect(parseStart(null)).toBe(0);
  });
});

describe("parseSuggestionsQuery", () => {
  it("accepts queries of at least two characters", () => {
    expect(parseSuggestionsQuery("ar")).toBe("ar");
    expect(parseSuggestionsQuery("arroz")).toBe("arroz");
  });

  it("rejects single-character or missing queries", () => {
    expect(parseSuggestionsQuery("a")).toBeNull();
    expect(parseSuggestionsQuery(null)).toBeNull();
  });
});