"use client";
import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  ExternalLink,
  Loader2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Store,
  Tag,
  Printer,
  RefreshCw,
} from "lucide-react";
import type { Product, ProjectData, Proposal } from "@/lib/types";

type Props = {
  data: ProjectData;
  update: (fn: (d: ProjectData) => ProjectData) => void;
  onPrev: () => void;
};

export function ProductsPanel({ data, update, onPrev }: Props) {
  const [loading, setLoading] = useState(false);
  const chosenProposal =
    data.proposals.find((p) => p.id === data.chosenProposalId) ||
    data.proposals.find((p) => p.id === data.activeProposalId) ||
    data.proposals[0];

  const searchProducts = async () => {
    if (!chosenProposal) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal: chosenProposal,
          budget: data.budget,
          country: "España",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error buscando productos");
      if (json.products) {
        update((d) => ({ ...d, products: json.products }));
      }
    } catch (e: any) {
      alert(e.message || "Error al buscar productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data.products.length === 0 && chosenProposal) {
      searchProducts();
    }
  }, []);

  const printShoppingList = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-slate-800">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-1">
          Paso 5 · Lista de Productos y Compra
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Productos reales y parecidos a tu distribución elegida ({chosenProposal?.title || "Diseño"}), con enlaces
          directos para comprar.
        </p>
      </div>

      {/* Resumen de la propuesta elegida */}
      {chosenProposal && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Propuesta Elegida</span>
            <span className="font-bold text-slate-800 text-sm">{chosenProposal.title}</span>
            <span className="text-slate-500 block text-[11px] mt-0.5">{chosenProposal.style} · {chosenProposal.items.length} elementos</span>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={searchProducts}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold text-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>
      )}

      {/* Lista de productos */}
      <div className="flex flex-col gap-2 flex-1 max-h-[55vh] overflow-y-auto pr-1">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <div className="text-xs">
              <span className="font-semibold block text-slate-700">Buscando productos reales en tiendas online...</span>
              <span className="text-[11px] text-slate-400">Consultando IKEA, Maisons du Monde, Kave Home, Amazon...</span>
            </div>
          </div>
        )}

        {!loading && data.products.length === 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500 space-y-3">
            <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto" />
            <p>No se encontraron productos aún. Pulsa el botón para buscar coincidencias reales con IA.</p>
            <button
              type="button"
              onClick={searchProducts}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              Buscar Productos
            </button>
          </div>
        )}

        {!loading &&
          data.products.map((p, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-3 text-xs space-y-2 shadow-xs transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded">
                    {p.item}
                  </span>
                  <h4 className="font-bold text-slate-800 text-sm mt-1">{p.name}</h4>
                </div>
                {p.price && (
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg whitespace-nowrap">
                    {p.price}
                  </span>
                )}
              </div>

              {p.description && <p className="text-slate-600 text-[11px] leading-relaxed">{p.description}</p>}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500 flex items-center gap-1 font-medium">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.store}</span>
                  {p.dimensions && <span>· {p.dimensions}</span>}
                </span>

                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition"
                >
                  <span>Ver / Comprar</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
      </div>

      {/* Acciones inferiores */}
      <div className="mt-auto pt-4 flex items-center gap-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center justify-center gap-1 text-slate-600 hover:bg-slate-100 font-semibold text-xs py-3 px-3 rounded-xl border border-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Diseño</span>
        </button>

        <button
          type="button"
          onClick={printShoppingList}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / Guardar PDF</span>
        </button>
      </div>
    </div>
  );
}
