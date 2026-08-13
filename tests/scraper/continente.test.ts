import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseContinenteProducts,
  parseContinenteSuggestions,
} from "@/lib/scraper/continente";

const fixture = () => readFileSync(join(__dirname, "../fixtures/continente-search.html"), "utf8");

const SUGGESTIONS_FIXTURE = `
<html>
<body>
  <div class="suggestion-product-item" data-pid="1">
    <a class="suggestion-product-name">Arroz Basmati</a>
  </div>
  <div class="suggestion-product-item" data-pid="2">
    <a class="suggestion-product-name">Arroz Agulha</a>
  </div>
  <div class="suggestions-item">
    <a class="suggested-item">Arroz</a>
  </div>
  <div class="suggestions-item">
    <a class="suggested-item">arroz basmati</a>
  </div>
  <div class="suggestions-item">
    <a class="suggested-item">Macarrão</a>
  </div>
  <span class="suggestions-category-parent suggested-item">em Arroz, Massa e Farinha</span>
</body>
</html>
`;

describe("parseContinenteProducts", () => {
  it("extracts products from tile impressions", () => {
    const products = parseContinenteProducts(fixture());
    expect(products.length).toBeGreaterThanOrEqual(1);

    const first = products[0];
    expect(first.brand).toBe("Continente");
    expect(first.nome).toBeTruthy();
    expect(first.id).toBeTruthy();
    expect(first.price).toBeGreaterThan(0);
  });

  it("resolves product links against the store origin", () => {
    const products = parseContinenteProducts(fixture());
    for (const product of products) {
      if (product.link_produto) {
        expect(product.link_produto).toMatch(/^https:\/\/www\.continente\.pt/);
      }
    }
  });

  it("never duplicates the origin when the tile already provides an absolute URL", () => {
    const html = `
<html><body>
  <div class="row product-grid no-gutters gtm-list">
    <div class="product">
      <div data-product-tile-impression='{&quot;name&quot;:&quot;A&quot;,&quot;id&quot;:&quot;1&quot;,&quot;url&quot;:&quot;https://www.continente.pt/produto/a.html&quot;}'></div>
    </div>
  </div>
</body></html>
`;
    const products = parseContinenteProducts(html);
    expect(products[0].link_produto).toBe("https://www.continente.pt/produto/a.html");
  });

  it("drops stock-availability badges from promocao", () => {
    const html = `
<html><body>
  <div class="row product-grid no-gutters gtm-list">
    <div class="product">
      <div data-product-tile-impression='{&quot;name&quot;:&quot;B&quot;,&quot;id&quot;:&quot;2&quot;}'></div>
      <div class="dual-badge-message-text">Indisponível</div>
    </div>
    <div class="product">
      <div data-product-tile-impression='{&quot;name&quot;:&quot;C&quot;,&quot;id&quot;:&quot;3&quot;}'></div>
      <div class="dual-badge-message-text">Leve 2 Pague 1</div>
    </div>
  </div>
</body></html>
`;
    const products = parseContinenteProducts(html);
    expect(products[0].promocao).toBeNull();
    expect(products[1].promocao).toBe("Leve 2 Pague 1");
  });

  it("recombines the discount number and percent sign", () => {
    const html = `
<html><body>
  <div class="row product-grid no-gutters gtm-list">
    <div class="product">
      <div data-product-tile-impression='{&quot;name&quot;:&quot;D&quot;,&quot;id&quot;:&quot;4&quot;,&quot;price&quot;:3.29}'></div>
      <span class="ct-product-tile-badge-value--pvpr">40</span>
      <span class="ct-product-tile-badge-value--pvpr-quantifier">%</span>
    </div>
    <div class="product">
      <div data-product-tile-impression='{&quot;name&quot;:&quot;E&quot;,&quot;id&quot;:&quot;5&quot;,&quot;price&quot;:1.99}'></div>
    </div>
  </div>
</body></html>
`;
    const products = parseContinenteProducts(html);
    expect(products[0].desconto).toBe("40%");
    expect(products[1].desconto).toBeNull();
  });

  it("parses the unit price from the current secondary-price markup", () => {
    const products = parseContinenteProducts(fixture());
    const withUnit = products.filter((p) => p.preco_por_volume);
    expect(withUnit.length).toBeGreaterThan(0);
    for (const product of withUnit) {
      expect(product.preco_por_volume).toMatch(/^\d+,\d+ €\//);
    }
  });

  it("falls back to the legacy unit-price element", () => {
    const html = `
<html><body>
  <div class="row product-grid no-gutters gtm-list">
    <div class="product">
      <div data-product-tile-impression='{&quot;name&quot;:&quot;F&quot;,&quot;id&quot;:&quot;6&quot;,&quot;price&quot;:1.99}'></div>
      <span class="ct-price-value">1,99 €/kg</span>
    </div>
    <div class="product">
      <div data-product-tile-impression='{&quot;name&quot;:&quot;G&quot;,&quot;id&quot;:&quot;7&quot;,&quot;price&quot;:2.5}'></div>
    </div>
  </div>
</body></html>
`;
    const products = parseContinenteProducts(html);
    expect(products[0].preco_por_volume).toBe("1,99 €/kg");
    expect(products[1].preco_por_volume).toBeNull();
  });

  it("returns an empty list when no product tiles are present", () => {
    expect(parseContinenteProducts("<html><body></body></html>")).toEqual([]);
  });
});

describe("parseContinenteSuggestions", () => {
  it("deduplicates, filters by query and limits suggestions", () => {
    const suggestions = parseContinenteSuggestions(SUGGESTIONS_FIXTURE, "arroz");
    expect(suggestions).toEqual(["Arroz Basmati", "Arroz Agulha", "Arroz", "arroz basmati"]);
    expect(suggestions).not.toContain("Macarrão");
    expect(suggestions).not.toContain("em Arroz, Massa e Farinha");
  });

  it("returns an empty list for empty markup", () => {
    expect(parseContinenteSuggestions("", "arroz")).toEqual([]);
  });
});