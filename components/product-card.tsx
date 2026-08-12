"use client";

import Image from "next/image";
import { useState } from "react";
import { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const [imageError, setImageError] = useState(false);
  const isContinente = product.brand === "Continente";
  
  const content = (
    <div className="bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/90 hover:border-zinc-700/90 rounded-xl p-3 shadow-md hover:shadow-xl hover:shadow-black/50 transition-all duration-200 flex flex-col relative overflow-hidden group h-full">
      
      {/* Image Container with clean white background so product photos render crisply */}
      <div className="relative w-full aspect-square bg-white rounded-lg mb-2.5 flex items-center justify-center overflow-hidden p-2">
        {/* Brand Badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 items-start">
          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider shadow-sm ${
            isContinente 
              ? 'bg-rose-600 text-white' 
              : 'bg-emerald-600 text-white'
          }`}>
            {product.brand}
          </span>
        </div>

        {/* Discount Badge */}
        {product.desconto && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-gradient-to-r from-rose-600 to-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
              -{product.desconto}
            </span>
          </div>
        )}
        
        {!imageError && product.link_imagem ? (
          <Image
            src={product.link_imagem}
            alt={product.nome}
            fill
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center border border-dashed border-zinc-300 w-2/3 h-2/3 rounded-md bg-zinc-50">
            <span className="text-[10px] font-medium text-zinc-400">Sem imagem</span>
          </div>
        )}
      </div>

      {/* Product Title */}
      <h3 className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors leading-relaxed line-clamp-2 min-h-[32px] mb-1">
        {product.nome}
      </h3>
      
      {/* Pricing & Details */}
      <div className="mt-auto pt-2">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base font-bold text-white tracking-tight">
            {product.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
          </span>
          {product.pvp_recomendado && product.pvp_recomendado > product.price && (
            <span className="text-[11px] text-zinc-500 line-through">
              {product.pvp_recomendado.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
            </span>
          )}
          {product.embalagem && product.embalagem !== product.preco_por_volume && (
            <span className="text-[9px] text-zinc-400 uppercase font-mono ml-auto truncate max-w-[80px]" title={product.embalagem}>
              {product.embalagem}
            </span>
          )}
        </div>
        
        {/* Badges / Unit price */}
        <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
          {product.preco_por_volume && (
            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-1.5 py-0.5 rounded-sm">
              {product.preco_por_volume}
            </span>
          )}
          {product.ivazero && (
            <span className="text-[9px] font-bold text-sky-400 bg-sky-950/70 border border-sky-800/60 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
              IVA Zero
            </span>
          )}
          {product.promocao && (
            <span className="text-[10px] font-medium text-amber-300 bg-amber-950/60 border border-amber-800/50 px-1.5 py-0.5 rounded-sm max-w-full truncate" title={product.promocao}>
              {product.promocao}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (product.link_produto) {
    return (
      <a href={product.link_produto} target="_blank" rel="noopener noreferrer" className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 rounded-xl">
        {content}
      </a>
    );
  }

  return <div className="h-full">{content}</div>;
}

