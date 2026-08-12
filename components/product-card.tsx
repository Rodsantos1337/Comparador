"use client";

import Image from "next/image";
import { useState } from "react";
import { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const [imageError, setImageError] = useState(false);
  const isContinente = product.brand === "Continente";
  
  const content = (
    <div className="bg-white rounded-lg border border-zinc-200 p-3 shadow-sm hover:shadow-md transition-shadow flex flex-col relative overflow-hidden group h-full">
      
      <div className="relative w-full aspect-square bg-zinc-50 rounded-md mb-2.5 flex items-center justify-center overflow-hidden">
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10 items-start">
          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm uppercase tracking-wide border ${
            isContinente ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
          }`}>
            {product.brand}
          </span>
        </div>

        {product.desconto && (
          <div className="absolute top-1.5 right-1.5 z-10">
            <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              -{product.desconto}
            </span>
          </div>
        )}
        
        {!imageError && product.link_imagem ? (
          <Image
            src={product.link_imagem}
            alt={product.nome}
            fill
            className="object-contain p-2 mix-blend-multiply transition-transform group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 50vw, 25vw"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center border border-dashed border-zinc-200 w-2/3 h-2/3 rounded-md">
            <span className="text-[10px] font-medium text-zinc-400">Sem imagem</span>
          </div>
        )}
      </div>

      <h3 className="text-xs font-medium text-zinc-800 line-clamp-2 min-h-[32px] group-hover:text-zinc-900 transition-colors leading-relaxed">
        {product.nome}
      </h3>
      
      <div className="mt-auto pt-2.5">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base font-bold text-zinc-900">
            {product.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
          </span>
          {product.pvp_recomendado && product.pvp_recomendado > product.price && (
            <span className="text-[11px] text-zinc-400 line-through">
              {product.pvp_recomendado.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
            </span>
          )}
          {product.embalagem && product.embalagem !== product.preco_por_volume && (
            <span className="text-[9px] text-zinc-400 uppercase ml-auto">
              {product.embalagem}
            </span>
          )}
        </div>
        
        <div className="mt-1 flex flex-wrap gap-1.5 items-center">
          {product.preco_por_volume && (
            <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 px-1 py-0.5 rounded-sm">
              {product.preco_por_volume}
            </span>
          )}
          {product.ivazero && (
            <span className="text-[9px] font-bold text-blue-600 border border-blue-200 px-1 py-0.5 rounded-sm uppercase bg-blue-50">
              IVA Zero
            </span>
          )}
          {product.promocao && (
            <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-1 py-0.5 rounded-sm max-w-full truncate border border-orange-100" title={product.promocao}>
              {product.promocao}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (product.link_produto) {
    return (
      <a href={product.link_produto} target="_blank" rel="noopener noreferrer" className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded-lg">
        {content}
      </a>
    );
  }

  return <div className="h-full">{content}</div>;
}
