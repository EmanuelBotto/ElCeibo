"use client";

import { useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

type OpcionesBusquedaProductoProps = {
  tipoBusqueda: string;
  tipoCliente: string;
  onTipoBusquedaChange: (value: "nombre" | "codigo") => void;
  onTipoClienteChange: (value: string) => void;
  abierto: boolean;
  onToggle: () => void;
  onCerrar: () => void;
};

function resumenOpciones(tipoBusqueda: string, tipoCliente: string) {
  const busqueda =
    tipoBusqueda === "codigo" ? "Código" : "Descripción";
  const cliente =
    tipoCliente === "mayorista" ? "Mayorista" : "Final";
  return `${busqueda} · ${cliente}`;
}

export default function OpcionesBusquedaProducto({
  tipoBusqueda,
  tipoCliente,
  onTipoBusquedaChange,
  onTipoClienteChange,
  abierto,
  onToggle,
  onCerrar,
}: OpcionesBusquedaProductoProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(event.target as Node)
      ) {
        onCerrar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [abierto, onCerrar]);

  return (
    <div ref={contenedorRef} className="relative flex-shrink-0">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="h-9 gap-1.5 text-xs sm:text-sm whitespace-nowrap max-w-[10rem] sm:max-w-none truncate"
        aria-expanded={abierto}
        aria-haspopup="true"
      >
        <SlidersHorizontal className="h-4 w-4 flex-shrink-0" />
        <span className="hidden sm:inline truncate">
          {resumenOpciones(tipoBusqueda, tipoCliente)}
        </span>
        <span className="sm:hidden">Opciones</span>
      </Button>

      {abierto ? (
        <div className="absolute right-0 top-full mt-1 z-30 w-64 sm:w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Buscar por
              </Label>
              <div className="mt-2 flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoBusquedaToolbar"
                    checked={tipoBusqueda === "nombre"}
                    onChange={() => onTipoBusquedaChange("nombre")}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Descripción</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoBusquedaToolbar"
                    checked={tipoBusqueda === "codigo"}
                    onChange={() => onTipoBusquedaChange("codigo")}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Código</span>
                </label>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Tipo de cliente
              </Label>
              <div className="mt-2 flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoClienteToolbar"
                    checked={tipoCliente === "cliente final"}
                    onChange={() => onTipoClienteChange("cliente final")}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Final</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoClienteToolbar"
                    checked={tipoCliente === "mayorista"}
                    onChange={() => onTipoClienteChange("mayorista")}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Mayorista</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
