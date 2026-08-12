export interface Product {
  ean: string;
  id: string;
  brand: "Continente" | "Pingo Doce";
  nome: string;
  price: number;
  desconto: string | null;
  pvp_recomendado: number | null;
  promocao: string | null;
  preco_por_volume: string | null;
  category: string;
  embalagem: string | null;
  link_produto: string | null;
  link_imagem: string | null;
  ivazero: boolean;
}

export interface SearchResponse {
  query: string;
  count: number;
  products: Product[];
}

export interface SuggestionsResponse {
  suggestions: string[];
}

export interface HealthResponse {
  status: "ok" | "error";
  stores: string[];
  timestamp: string;
}
