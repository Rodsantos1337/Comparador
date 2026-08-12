"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, SlidersHorizontal, AlertCircle, ShoppingCart } from "lucide-react";
import { useDebounce } from "use-debounce";

import { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

type SortOption = "price_asc" | "price_desc" | "discount_desc";

export default function ComparePage() {
  const [query, setQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [debouncedInput] = useDebounce(inputValue, 200);
  
  const [suggestions, setSuggestions] = useState<{ text: string, store: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Health
  const [health, setHealth] = useState({ continente: false, pingodoce: false });
  
  // Filters and Sort
  const [sortParam, setSortParam] = useState<SortOption>("price_asc");
  const [filterPromo, setFilterPromo] = useState(false);
  const [filterIva, setFilterIva] = useState(false);
  
  // Store toggles
  const [showContinente, setShowContinente] = useState(true);
  const [showPingoDoce, setShowPingoDoce] = useState(true);

  // Health polling
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          const stores = data.stores || [];
          setHealth({
            continente: data.status === "ok" && stores.includes("continente"),
            pingodoce: data.status === "ok" && stores.includes("pingodoce"),
          });
        }
      } catch (e) {
        setHealth({ continente: false, pingodoce: false });
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Suggestions fetching
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedInput.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const [resCont, resPd] = await Promise.allSettled([
          fetch(`/api/continente/suggestions?q=${encodeURIComponent(debouncedInput)}`).then(r => r.json()),
          fetch(`/api/pingodoce/suggestions?q=${encodeURIComponent(debouncedInput)}`).then(r => r.json())
        ]);
        
        let newSuggestions: { text: string, store: string }[] = [];
        
        if (resCont.status === "fulfilled" && resCont.value.suggestions) {
          newSuggestions.push(...resCont.value.suggestions.map((s: string) => ({ text: s, store: "Continente" })));
        }
        if (resPd.status === "fulfilled" && resPd.value.suggestions) {
          newSuggestions.push(...resPd.value.suggestions.map((s: string) => ({ text: s, store: "Pingo Doce" })));
        }
        
        // deduplicate by text (case insensitive) and pick first store for the tag
        const unique = Array.from(new Map(newSuggestions.map(item => [item.text.toLowerCase(), item])).values());
        setSuggestions(unique.slice(0, 8));
      } catch (e) {
        // ignore suggestion errors
      }
    };
    
    fetchSuggestions();
  }, [debouncedInput]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setShowSuggestions(false);
    setQuery(searchQuery);
    setInputValue(searchQuery);
    setLoading(true);
    setHasSearched(true);
    setError(null);
    setProducts([]);
    
    try {
      const [resCont, resPd] = await Promise.allSettled([
        fetch(`/api/continente/search?q=${encodeURIComponent(searchQuery)}`),
        fetch(`/api/pingodoce/search?q=${encodeURIComponent(searchQuery)}`)
      ]);
      
      let allProducts: Product[] = [];
      
      if (resCont.status === "fulfilled" && resCont.value.ok) {
        const data = await resCont.value.json();
        if (data.products) allProducts = allProducts.concat(data.products);
      }
      
      if (resPd.status === "fulfilled" && resPd.value.ok) {
        const data = await resPd.value.json();
        if (data.products) allProducts = allProducts.concat(data.products);
      }
      
      if (resCont.status === "rejected" && resPd.status === "rejected") {
        setError("Não foi possível aceder aos supermercados neste momento. Tente novamente.");
      } else {
        setProducts(allProducts);
      }
      
    } catch (err) {
      setError("Ocorreu um erro ao pesquisar os produtos.");
    } finally {
      setLoading(false);
    }
  };

  const getDiscountPercent = (descontoStr: string | null) => {
    if (!descontoStr) return 0;
    const match = descontoStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(p => {
      // Store filter
      if (!showContinente && p.brand === "Continente") return false;
      if (!showPingoDoce && p.brand === "Pingo Doce") return false;
      
      // Promo filter
      if (filterPromo && !(p.desconto || p.pvp_recomendado || p.promocao)) return false;
      
      // IVA filter
      if (filterIva && p.ivazero !== true) return false;
      
      return true;
    });

    result.sort((a, b) => {
      if (sortParam === "price_asc") return a.price - b.price;
      if (sortParam === "price_desc") return b.price - a.price;
      if (sortParam === "discount_desc") {
        const aDisc = getDiscountPercent(a.desconto);
        const bDisc = getDiscountPercent(b.desconto);
        if (aDisc === 0 && bDisc === 0) return a.price - b.price; // fallback to price
        return bDisc - aDisc;
      }
      return 0;
    });
    
    return result;
  }, [products, showContinente, showPingoDoce, filterPromo, filterIva, sortParam]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans overflow-x-hidden">
      {/* Top Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-zinc-200 shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-800">
              Comparador
            </h1>
            <div className="hidden sm:flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1.5" title="Estado Continente">
                <div className={`w-1.5 h-1.5 rounded-full ${health.continente ? 'bg-red-500 animate-pulse' : 'bg-red-200'}`}></div>
                <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Continente</span>
              </div>
              <div className="flex items-center gap-1.5" title="Estado Pingo Doce">
                <div className={`w-1.5 h-1.5 rounded-full ${health.pingodoce ? 'bg-green-500' : 'bg-green-200'}`}></div>
                <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Pingo Doce</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex-1 max-w-xl mx-4 sm:mx-12">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(inputValue); }} className="relative group">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full h-9 pl-9 pr-4 bg-zinc-100 border border-transparent rounded-md text-sm focus:bg-white focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 transition-all outline-none placeholder:text-zinc-500"
              placeholder="Pesquisar produtos..."
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1.5 bg-white rounded-md shadow-lg border border-zinc-200 z-50 p-1.5">
                <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Sugestões</div>
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-zinc-50 rounded cursor-pointer"
                    onClick={() => handleSearch(s.text)}
                  >
                    <span className="text-sm text-zinc-700">{s.text}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase ${s.store === 'Continente' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {s.store}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg>
                <span className="hidden sm:inline">Filtros</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-4 rounded-md border-zinc-200 shadow-md">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-zinc-900 mb-3 text-sm">Filtros</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="promo" checked={filterPromo} onCheckedChange={(checked) => setFilterPromo(!!checked)} />
                      <label htmlFor="promo" className="text-sm font-medium leading-none cursor-pointer text-zinc-700">
                        Em promoção
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="iva" checked={filterIva} onCheckedChange={(checked) => setFilterIva(!!checked)} />
                      <label htmlFor="iva" className="text-sm font-medium leading-none cursor-pointer text-zinc-700">
                        IVA Zero
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        
        {/* Results Header */}
        {hasSearched && !loading && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 bg-white shrink-0 gap-4 sticky z-20 border-b border-zinc-200">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm text-zinc-500">
                <span className="text-zinc-900 font-medium">{filteredAndSortedProducts.length} de {products.length}</span> produtos
              </span>
              <div className="hidden sm:block h-4 w-px bg-zinc-200"></div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowContinente(!showContinente)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    showContinente 
                      ? "bg-red-50 text-red-700 border border-red-200" 
                      : "bg-zinc-100 text-zinc-400 border border-transparent"
                  }`}
                >Continente</button>
                <button
                  onClick={() => setShowPingoDoce(!showPingoDoce)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    showPingoDoce 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : "bg-zinc-100 text-zinc-400 border border-transparent"
                  }`}
                >Pingo Doce</button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Ordenar</span>
              <select 
                value={sortParam}
                onChange={(e) => setSortParam(e.target.value as SortOption)}
                className="bg-transparent text-sm font-medium text-zinc-900 focus:outline-none cursor-pointer py-1"
              >
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="discount_desc">Maior desconto</option>
              </select>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6">
          {/* Empty State (Initial) */}
          {!hasSearched && !loading && (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="w-16 h-16 bg-white border border-zinc-200 rounded-full flex items-center justify-center mb-2 shadow-sm">
                <ShoppingCart className="w-6 h-6 text-zinc-400" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Bem-vindo ao Comparador</h1>
              <p className="text-zinc-500 max-w-sm text-sm">
                Pesquise por qualquer produto para comparar preços entre o Continente e o Pingo Doce.
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <Skeleton className="h-5 w-40 bg-zinc-200 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-20 rounded-md bg-zinc-200" />
                  <Skeleton className="h-7 w-20 rounded-md bg-zinc-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-3 p-3 border border-zinc-100 rounded-lg bg-white shadow-sm">
                    <Skeleton className="w-full aspect-square rounded-md bg-zinc-100" />
                    <Skeleton className="h-4 w-3/4 bg-zinc-200" />
                    <Skeleton className="h-4 w-1/2 bg-zinc-200" />
                    <Skeleton className="h-5 w-1/3 mt-2 bg-zinc-200" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {hasSearched && !loading && (
            <div className="animate-in fade-in duration-500">
              {error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                  <p className="text-zinc-600 max-w-sm text-sm">{error}</p>
                  <Button onClick={() => handleSearch(query)} variant="outline" size="sm" className="rounded-md">Tentar novamente</Button>
                </div>
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-white rounded-lg border border-zinc-200 border-dashed">
                  <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-1">
                    <Search className="w-5 h-5 text-zinc-400" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900">Nenhum resultado</h3>
                  <p className="text-zinc-500 text-sm">
                    {products.length === 0 
                      ? `Não encontrámos produtos para "${query}".`
                      : "Nenhum produto corresponde aos filtros e lojas selecionadas."
                    }
                  </p>
                  {products.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-md mt-2"
                      onClick={() => {
                        setShowContinente(true);
                        setShowPingoDoce(true);
                        setFilterPromo(false);
                        setFilterIva(false);
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 content-start h-full">
                  {filteredAndSortedProducts.map((product, idx) => (
                    <ProductCard key={`${product.id}-${idx}`} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
