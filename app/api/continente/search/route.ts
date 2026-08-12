import { NextRequest, NextResponse } from "next/server";
import { SearchResponse, Product } from "@/lib/types";

const MOCK_PRODUCTS: Product[] = [
  {
    ean: "arroz",
    id: "4949515",
    brand: "Continente",
    nome: "Arroz Basmati Continente",
    price: 1.89,
    desconto: null,
    pvp_recomendado: null,
    promocao: null,
    preco_por_volume: "1,89 €/kg",
    category: "Mercearia",
    embalagem: "emb. 1 kg",
    link_produto: "https://www.continente.pt/produto/arroz-basmati-continente-4949515.html",
    link_imagem: "https://picsum.photos/seed/continente/200/200",
    ivazero: false
  },
  {
    ean: "arroz",
    id: "4949516",
    brand: "Continente",
    nome: "Arroz Agulha Continente",
    price: 1.25,
    desconto: "10%",
    pvp_recomendado: 1.39,
    promocao: "Poupança",
    preco_por_volume: "1,25 €/kg",
    category: "Mercearia",
    embalagem: "emb. 1 kg",
    link_produto: "https://www.continente.pt/produto/arroz-agulha",
    link_imagem: null,
    ivazero: true
  }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const filtered = MOCK_PRODUCTS.filter((p) => p.nome.toLowerCase().includes(q.toLowerCase()) || "arroz".includes(q.toLowerCase()));

  const response: SearchResponse = {
    query: q,
    count: filtered.length,
    products: filtered
  };

  return NextResponse.json(response);
}
