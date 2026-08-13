import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parsePingoDoceProducts,
  parsePingoDoceSuggestions,
} from "@/lib/scraper/pingodoce";

const fixture = () => readFileSync(join(__dirname, "../fixtures/pingodoce-search.html"), "utf8");

describe("parsePingoDoceProducts", () => {
  it("extracts products with parsed prices", () => {
    const products = parsePingoDoceProducts(fixture());
    expect(products.length).toBeGreaterThanOrEqual(1);

    const first = products[0];
    expect(first.brand).toBe("Pingo Doce");
    expect(first.nome).toBe("Arroz Basmati");
    expect(first.price).toBeCloseTo(1.89, 2);
    expect(first.id).toBe("651101");
    expect(first.link_imagem).toBeTruthy();
  });

  it("resolves product links against the store origin", () => {
    const products = parsePingoDoceProducts(fixture());
    for (const product of products) {
      if (product.link_produto) {
        expect(product.link_produto).toMatch(/^https:\/\/www\.pingodoce\.pt/);
      }
    }
  });

  it("falls back when no product containers are found", () => {
    expect(parsePingoDoceProducts("<html><body></body></html>")).toEqual([]);
  });
});

describe("parsePingoDoceSuggestions", () => {
  const SUGGESTIONS_FIXTURE = `
<html>
<body>
  <div class="item product-suggestion" data-pid="1">
    <div class="product-name">Arroz Basmati</div>
  </div>
  <div class="item product-suggestion" data-pid="2">
    <div class="product-name">Macarrão</div>
  </div>
  <div data-suggestion="Arroz Integral"></div>
  <div data-value="Arroz Carolino"></div>
</body>
</html>
`;

  it("filters suggestions by the query keyword", () => {
    const suggestions = parsePingoDoceSuggestions(SUGGESTIONS_FIXTURE, "arroz");
    expect(suggestions).toEqual(["Arroz Basmati", "Arroz Integral", "Arroz Carolino"]);
    expect(suggestions).not.toContain("Macarrão");
  });

  it("returns an empty list for empty markup", () => {
    expect(parsePingoDoceSuggestions("", "arroz")).toEqual([]);
  });
});