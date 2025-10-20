"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FolderOpen, ChevronDown, ChevronRight, Edit, Trash2, Plus, Syringe } from "lucide-react";

export default function HistorialMedico({ 
  historial, 
  onAddVisit, 
  onEditVisit, 
  onDeleteVisit,
  mascotaNombre,
  visitaSeleccionada,
  setVisitaSeleccionada
}) {
  const [carpetasAbiertas, setCarpetasAbiertas] = useState(new Set());

  const estaCarpetaAbierta = (idVisita) => {
    return carpetasAbiertas.has(idVisita);
  };

  const alternarCarpeta = (idVisita) => {
    setCarpetasAbiertas((prev) => {
      const nuevasCarpetas = new Set(prev);
      if (nuevasCarpetas.has(idVisita)) {
        nuevasCarpetas.delete(idVisita);
      } else {
        nuevasCarpetas.add(idVisita);
      }
      return nuevasCarpetas;
    });
  };

  const handleEditVisit = (visita) => {
    onEditVisit(visita);
  };

  const handleDeleteVisit = async (idVisita) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta visita?")) {
      await onDeleteVisit(idVisita);
    }
  };

  return (
    <div className="lg:col-span-2 bg-white rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-purple-800">
          Historial Médico de {mascotaNombre}
        </h2>
        
        {/* Botones de acción al lado del título */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={onAddVisit}
            className="bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Visita
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              visitaSeleccionada && handleEditVisit(visitaSeleccionada)
            }
            disabled={!visitaSeleccionada}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            size="sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modificar Visita
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleDeleteVisit(visitaSeleccionada?.id_visita)}
            disabled={!visitaSeleccionada}
            className="bg-red-600 hover:bg-red-700"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Visita
          </Button>
        </div>
      </div>
      
      {/* Historial real */}
      {historial.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-800 text-2xl">
            No hay visitas registradas para este paciente.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {historial.map((visita, idx) => {
            const isAbierta = estaCarpetaAbierta(visita.id_visita);
            return (
              <div
                key={`${visita.id_visita}-${visita.fecha}-${visita.diagnostico}`}
                className="border rounded-lg bg-gray-50 overflow-hidden"
              >
                {/* Header de la carpeta - siempre visible */}
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors ${
                    visitaSeleccionada?.id_visita === visita.id_visita
                      ? "ring-2 ring-purple-400"
                      : ""
                  }`}
                  onClick={() => {
                    alternarCarpeta(visita.id_visita);
                    setVisitaSeleccionada(visita);
                  }}
                >
                  <div className="flex items-center text-lg font-semibold text-purple-600">
                    {isAbierta ? (
                      <ChevronDown
                        className="mr-2 text-purple-600"
                        size={20}
                      />
                    ) : (
                      <ChevronRight
                        className="mr-2 text-purple-600"
                        size={20}
                      />
                    )}
                    <FolderOpen
                      className="mr-2 text-purple-600"
                      size={18}
                    />
                    {visita.fecha}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">Atendió:</span>{" "}
                    {visita.nombre && visita.apellido
                      ? `${visita.nombre} ${visita.apellido}`
                      : "No registrado"}
                  </div>
                </div>

                {/* Contenido de la carpeta - solo visible si está abierta */}
                {isAbierta && (
                  <div className="px-4 pb-4 border-t border-gray-200 bg-white">
                    {/* Diagnóstico */}
                    <div className="mb-4 pt-3">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Diagnóstico:
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-800">
                          {visita.diagnostico
                            ? visita.diagnostico
                            : "Sin diagnóstico registrado"}
                        </p>
                      </div>
                    </div>

                    {/* Signos vitales */}
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Signos Vitales:
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Frecuencia Cardíaca
                            </span>
                            <span className="text-lg font-semibold text-gray-800">
                              {visita.frecuencia_cardiaca
                                ? `${visita.frecuencia_cardiaca} bpm`
                                : "No registrada"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Frecuencia Respiratoria
                            </span>
                            <span className="text-lg font-semibold text-gray-800">
                              {visita.frecuencia_respiratoria
                                ? `${visita.frecuencia_respiratoria} rpm`
                                : "No registrada"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Peso
                            </span>
                            <span className="text-lg font-semibold text-gray-800">
                              {visita.peso
                                ? `${visita.peso} kg`
                                : "No registrado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vacunas aplicadas */}
                    {visita.vacunas && visita.vacunas.length > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                            <Syringe
                              className="text-purple-600 mr-2"
                              size={16}
                            />
                            Vacunas Aplicadas ({visita.vacunas.length})
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {visita.vacunas.map((vac) => (
                            <div
                              key={`${vac.id_vacuna_aplicada}-${vac.nombre_vacuna}-${vac.fecha_aplicacion}`}
                              className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    <Syringe
                                      className="text-purple-600 mr-2"
                                      size={14}
                                    />
                                    <h4 className="font-semibold text-gray-800 text-sm">
                                      {vac.nombre_vacuna}
                                    </h4>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">
                                        Fecha:
                                      </span>{" "}
                                      {new Date(
                                        vac.fecha_aplicacion
                                      ).toLocaleDateString("es-ES")}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">
                                        Duración:
                                      </span>{" "}
                                      {vac.duracion_meses} meses
                                    </p>
                                    {vac.observaciones && (
                                      <p className="text-xs text-gray-600">
                                        <span className="font-medium">
                                          Obs:
                                        </span>{" "}
                                        {vac.observaciones}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1 ml-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      onEditVisit(vac)
                                    }
                                    className="h-6 px-2 text-xs border-purple-300 text-purple-700 hover:bg-purple-100"
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setVisitaSeleccionada(vac);
                                      handleDeleteVisit(vac.id_vacuna_aplicada);
                                    }}
                                    className="h-6 px-2 text-xs border-red-300 text-red-700 hover:bg-red-100"
                                  >
                                    Eliminar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
