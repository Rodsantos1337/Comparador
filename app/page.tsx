"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, AlertCircle, ShoppingBag, Sparkles, Filter, ChevronDown } from "lucide-react";
import { useDebounce } from "use-debounce";

import { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

type SortOption = "price_asc" | "price_desc" | "discount_desc";

const QUICK_SEARCHES = ["Arroz", "Azeite", "Leite", "Café", "Detergente", "Massa"];

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
        
        const unique = Array.from(new Map(newSuggestions.map(item => [item.text.toLowerCase(), item])).values());
        setSuggestions(unique.slice(0, 8));
      } catch (e) {
        // ignore
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
      if (!showContinente && p.brand === "Continente") return false;
      if (!showPingoDoce && p.brand === "Pingo Doce") return false;
      if (filterPromo && !(p.desconto || p.pvp_recomendado || p.promocao)) return false;
      if (filterIva && p.ivazero !== true) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sortParam === "price_asc") return a.price - b.price;
      if (sortParam === "price_desc") return b.price - a.price;
      if (sortParam === "discount_desc") {
        const aDisc = getDiscountPercent(a.desconto);
        const bDisc = getDiscountPercent(b.desconto);
        if (aDisc === 0 && bDisc === 0) return a.price - b.price;
        return bDisc - aDisc;
      }
      return 0;
    });
    
    return result;
  }, [products, showContinente, showPingoDoce, filterPromo, filterIva, sortParam]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased overflow-x-hidden flex flex-col">
      {/* Top Navigation Header */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 bg-zinc-900/90 border-b border-zinc-800/90 backdrop-blur-md sticky top-0 z-30 shrink-0">
        {/* Brand & Health indicators */}
        <div className="flex items-center gap-5">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Comparador
              </h1>
            </div>
            
            <div className="hidden sm:flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1.5" title="Continente Status">
                <div className={`w-1.5 h-1.5 rounded-full ${health.continente ? 'bg-rose-500' : 'bg-rose-950 border border-rose-800'}`}></div>
                <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Continente</span>
              </div>
              <div className="flex items-center gap-1.5" title="Pingo Doce Status">
                <div className={`w-1.5 h-1.5 rounded-full ${health.pingodoce ? 'bg-emerald-500' : 'bg-emerald-950 border border-emerald-800'}`}></div>
                <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Pingo Doce</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg mx-3 sm:mx-8">
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
              className="w-full h-9 pl-9 pr-8 bg-zinc-950/80 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-950 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/50 transition-all outline-none"
              placeholder="Pesquisar produtos (ex: Arroz, Leite, Azeite)..."
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            
            {/* Auto-complete Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1.5 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 p-1.5 backdrop-blur-xl">
                <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Sugestões
                </div>
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2.5 py-1.5 hover:bg-zinc-800/80 rounded cursor-pointer transition-colors"
                    onClick={() => handleSearch(s.text)}
                  >
                    <span className="text-xs text-zinc-200">{s.text}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      s.store === 'Continente' ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                    }`}>
                      {s.store}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Filter Trigger Button */}
        <div className="flex items-center gap-2 shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950/80 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-900 transition-colors">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Filtros</span>
                {(filterPromo || filterIva) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-60 p-4 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-zinc-100 mb-3 text-xs tracking-wider uppercase text-zinc-400">Filtros Ativos</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-2.5">
                      <Checkbox 
                        id="promo" 
                        checked={filterPromo} 
                        onCheckedChange={(checked) => setFilterPromo(!!checked)}
                        className="border-zinc-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" 
                      />
                      <label htmlFor="promo" className="text-xs font-medium leading-none cursor-pointer text-zinc-300 hover:text-white">
                        Apenas em Promoção
                      </label>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <Checkbox 
                        id="iva" 
                        checked={filterIva} 
                        onCheckedChange={(checked) => setFilterIva(!!checked)}
                        className="border-zinc-700 data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                      />
                      <label htmlFor="iva" className="text-xs font-medium leading-none cursor-pointer text-zinc-300 hover:text-white">
                        Apenas IVA Zero
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </nav>

      {/* Main Content View */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Results Bar */}
        {hasSearched && !loading && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-2.5 bg-zinc-900/60 border-b border-zinc-800/80 shrink-0 gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-zinc-400">
                <span className="text-white font-semibold">{filteredAndSortedProducts.length}</span> de <span className="text-zinc-300">{products.length}</span> resultados
              </span>
              <div className="hidden sm:block h-3.5 w-px bg-zinc-800"></div>
              
              {/* Store Toggle Buttons */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setShowContinente(!showContinente)}
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold tracking-wide transition-all ${
                    showContinente 
                      ? "bg-rose-950/80 text-rose-300 border border-rose-800/80 shadow-sm" 
                      : "bg-zinc-950 text-zinc-600 border border-zinc-900 opacity-60 hover:opacity-100"
                  }`}
                >
                  Continente
                </button>
                <button
                  onClick={() => setShowPingoDoce(!showPingoDoce)}
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold tracking-wide transition-all ${
                    showPingoDoce 
                      ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shadow-sm" 
                      : "bg-zinc-950 text-zinc-600 border border-zinc-900 opacity-60 hover:opacity-100"
                  }`}
                >
                  Pingo Doce
                </button>
              </div>
            </div>
            
            {/* Sorting Select */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ordenar</span>
              <div className="relative">
                <select 
                  value={sortParam}
                  onChange={(e) => setSortParam(e.target.value as SortOption)}
                  className="bg-zinc-950 text-xs font-medium text-zinc-200 border border-zinc-800 rounded px-2.5 py-1 focus:outline-none focus:border-zinc-700 cursor-pointer pr-6 appearance-none"
                >
                  <option value="price_asc">Menor preço</option>
                  <option value="price_desc">Maior preço</option>
                  <option value="discount_desc">Maior desconto</option>
                </select>
                <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-1.5 top-2 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {/* Initial State / Welcome Card */}
          {!hasSearched && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 max-w-lg mx-auto">
              <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-xl">
                <ShoppingBag className="w-6 h-6 text-zinc-400" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-white">Comparador de Preços</h2>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
                  Pesquisa e compara instantaneamente preços, promoções e unidades entre o Continente e o Pingo Doce.
                </p>
              </div>

              {/* Quick Search Chips */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Pesquisas populares:</span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {QUICK_SEARCHES.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearch(chip)}
                      className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-full text-xs font-medium text-zinc-300 hover:text-white transition-all duration-150"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Skeleton Loading State */}
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="flex items-center justify-between px-1">
                <Skeleton className="h-4 w-32 bg-zinc-900 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded bg-zinc-900" />
                  <Skeleton className="h-6 w-20 rounded bg-zinc-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-2.5 p-3 border border-zinc-800/80 rounded-xl bg-zinc-900/60">
                    <Skeleton className="w-full aspect-square rounded-lg bg-zinc-800/80" />
                    <Skeleton className="h-3.5 w-3/4 bg-zinc-800/80 rounded" />
                    <Skeleton className="h-3 w-1/2 bg-zinc-800/80 rounded" />
                    <Skeleton className="h-5 w-1/3 mt-2 bg-zinc-800/80 rounded" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results Grid */}
          {hasSearched && !loading && (
            <div className="animate-in fade-in duration-300">
              {error ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-rose-500 mb-1" />
                  <p className="text-zinc-400 max-w-sm text-xs">{error}</p>
                  <Button onClick={() => handleSearch(query)} variant="outline" size="sm" className="rounded-lg bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 text-xs">
                    Tentar novamente
                  </Button>
                </div>
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-zinc-900/40 rounded-xl border border-zinc-800/80 border-dashed max-w-md mx-auto">
                  <Search className="w-6 h-6 text-zinc-500 mb-1" />
                  <h3 className="text-sm font-semibold text-zinc-200">Sem resultados</h3>
                  <p className="text-zinc-400 text-xs">
                    {products.length === 0 
                      ? `Não foram encontrados produtos para "${query}".`
                      : "Nenhum produto corresponde aos filtros e lojas selecionadas."
                    }
                  </p>
                  {products.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-lg bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs mt-2"
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 content-start">
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
