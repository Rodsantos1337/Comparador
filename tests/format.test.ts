import { describe, expect, it } from "vitest";
import { formatCurrency, parsePercent, parsePrice } from "@/lib/format";

describe("parsePrice", () => {
  it.each([
    ["1,89 €", 1.89],
    ["1.89", 1.89],
    ["0,75", 0.75],
    ["1 299,99 €", 1299.99],
    ["12", 12],
  ])("parses %s", (raw, expected) => {
    expect(parsePrice(raw)).toBe(expected);
  });

  it("returns null for unparseable input", () => {
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("n/a")).toBeNull();
    expect(parsePrice(null)).toBeNull();
  });
});

describe("parsePercent", () => {
  it("extracts a percentage from surrounding text", () => {
    expect(parsePercent("Desconto 35%")).toBe("35%");
    expect(parsePercent("35 %")).toBe("35%");
  });

  it("returns null when no percentage is present", () => {
    expect(parsePercent("Promoção Especial")).toBeNull();
    expect(parsePercent(null)).toBeNull();
  });
});

describe("formatCurrency", () => {
  it("formats in Portuguese locale with the euro symbol", () => {
    expect(formatCurrency(1.89)).toMatch(/1,89[^\d]*€/);
  });
});