import { NextRequest, NextResponse } from "next/server";
import { SearchResponse, Product } from "@/lib/types";

const MOCK_PRODUCTS: Product[] = [
  {
    ean: "arroz",
    id: "651178",
    brand: "Pingo Doce",
    nome: "Arroz Agulha Europa Pingo Doce",
    price: 0.75,
    desconto: "35%",
    pvp_recomendado: 1.15,
    promocao: "Leve 2 Pague 1",
    preco_por_volume: "0,75 €/kg",
    category: "Mercearia",
    embalagem: "1 kg",
    link_produto: "https://www.pingodoce.pt/home/produtos/mercearia/arroz",
    link_imagem: "https://picsum.photos/seed/pingodoce/200/200",
    ivazero: true
  },
  {
    ean: "arroz",
    id: "651179",
    brand: "Pingo Doce",
    nome: "Arroz Carolino Pingo Doce",
    price: 1.10,
    desconto: null,
    pvp_recomendado: null,
    promocao: null,
    preco_por_volume: "1,10 €/kg",
    category: "Mercearia",
    embalagem: "1 kg",
    link_produto: null,
    link_imagem: null,
    ivazero: false
  }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  const filtered = MOCK_PRODUCTS.filter((p) => p.nome.toLowerCase().includes(q.toLowerCase()) || "arroz".includes(q.toLowerCase()));

  const response: SearchResponse = {
    query: q,
    count: filtered.length,
    products: filtered
  };

  return NextResponse.json(response);
}
