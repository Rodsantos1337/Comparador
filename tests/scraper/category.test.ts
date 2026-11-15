import { describe, expect, it } from "vitest";
import { categoryFromProductUrl, leafCategory } from "@/lib/scraper/category";

describe("leafCategory", () => {
  it("keeps only the last segment of a Continente breadcrumb", () => {
    expect(leafCategory("Supermercado/Mercearia/Arroz, Massa e Farinha/Arroz")).toBe("Arroz");
    expect(leafCategory("Supermercado/Mercearia/Azeite, Óleo e Vinagre/Azeite")).toBe("Azeite");
  });

  it("ignores empty segments and surrounding whitespace", () => {
    expect(leafCategory("/Supermercado/Mercearia/Azeite/")).toBe("Azeite");
    expect(leafCategory("  Mercearia / Conservas  ")).toBe("Conservas");
  });

  it("returns an empty string when there is no category", () => {
    expect(leafCategory(null)).toBe("");
    expect(leafCategory(undefined)).toBe("");
    expect(leafCategory("")).toBe("");
    expect(leafCategory("///")).toBe("");
  });
});

describe("categoryFromProductUrl", () => {
  it("reads the leaf from the Pingo Doce breadcrumb path", () => {
    expect(
      categoryFromProductUrl(
        "https://www.pingodoce.pt/home/produtos/mercearia/arroz-massa-e-leguminosas/arroz/arroz-basmati-pingo-doce-651101.html",
      ),
    ).toBe("Arroz");
    expect(
      categoryFromProductUrl(
        "https://www.pingodoce.pt/home/produtos/mercearia/azeite-oleo-e-vinagre/azeite/azeite-virgem-extra-123.html",
      ),
    ).toBe("Azeite");
    expect(
      categoryFromProductUrl(
        "https://www.pingodoce.pt/home/produtos/mercearia/conservas/atum/atum-posta-azeite-999.html",
      ),
    ).toBe("Atum");
  });

  it("humanizes deeper categories and strips zero-width characters", () => {
    expect(
      categoryFromProductUrl(
        "https://www.pingodoce.pt/home/produtos/leite-e-bebidas-vegetais/leite/leite-meio-gordo-e-gordo%E2%80%8B/leite-uht-meio-gordo-pingo-doce-48150.html",
      ),
    ).toBe("Leite Meio Gordo E Gordo");
  });

  it("falls back to the only category level when there is no subcategory", () => {
    expect(
      categoryFromProductUrl("https://www.pingodoce.pt/home/produtos/mercearia/arroz.html"),
    ).toBe("Mercearia");
  });

  it("returns an empty string for malformed or unrelated URLs", () => {
    expect(categoryFromProductUrl(null)).toBe("");
    expect(categoryFromProductUrl("")).toBe("");
    expect(categoryFromProductUrl("not a url")).toBe("");
    expect(categoryFromProductUrl("https://www.pingodoce.pt/produto/arroz.html")).toBe("");
    expect(categoryFromProductUrl("https://www.pingodoce.pt/home/produtos/arroz.html")).toBe("");
  });
});
