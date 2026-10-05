"use client";
import React, { useEffect, useState } from "react";
import { Settings, X, CheckCircle2, AlertCircle, Database, Sparkles, ExternalLink, Key } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({ isOpen, onClose }: Props) {
  const [status, setStatus] = useState<{ db: boolean; ai: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/status")
        .then((r) => r.json())
        .then(setStatus)
        .catch(() => setStatus({ db: false, ai: false }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="relative max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl space-y-4 text-slate-800 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <Settings className="w-5 h-5 text-indigo-600" />
            <span>Configuración y Servicios</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estado de servicios */}
        <div className="space-y-3">
          {/* Inteligencia Artificial Gemini */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Google Gemini API</span>
              </div>
              {status?.ai ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Conectado</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Falta API Key</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Necesario para la generación de ideas de distribución, diseño de interiores y renders 3D fotorrealistas.
            </p>
            <div className="text-[10px] text-slate-400 bg-white p-2 rounded-lg border border-slate-200">
              Añade <code className="text-indigo-600 font-bold">GEMINI_API_KEY</code> en tu archivo{" "}
              <code>.env.local</code> o en las variables de entorno de Vercel.
            </div>
          </div>

          {/* Base de datos Postgres (Neon) */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Database className="w-4 h-4 text-indigo-500" />
                <span>Base de Datos (Neon Postgres)</span>
              </div>
              {status?.db ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Conectada</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                  <span>Modo LocalStorage</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Permite sincronizar tus planos y guardar renders en la nube. Si no está configurada, todo se guarda
              automáticamente en tu navegador.
            </p>
            <div className="text-[10px] text-slate-400 bg-white p-2 rounded-lg border border-slate-200">
              Añade <code className="text-indigo-600 font-bold">DATABASE_URL</code> con tu cadena de conexión de Neon
              o Vercel Storage.
            </div>
          </div>

          {/* Bibliotecas de Inteligencia de Interiorismo y Eficiencia */}
          <div className="p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bibliotecas de Interiorismo y Sostenibilidad</span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Activas
              </span>
            </div>
            <p className="text-[11px] text-emerald-900 leading-relaxed">
              Google Gemini consulta automáticamente las bibliotecas canónicas de <b>ergonomía Neufert</b>, <b>confort bioclimático</b>, <b>optimización de habitáculos</b> y la <b>enciclopedia de estilos</b> en cada propuesta y render.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
