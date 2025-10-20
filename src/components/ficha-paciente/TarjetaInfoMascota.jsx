"use client";

import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import ImageDisplay from "@/components/ImageDisplay";
import { getPetIcon } from "./utils";

const InfoCard = ({ title, children, className, headerAction }) => (
  <div
    className={`bg-white rounded-lg p-4 ${className}`}
  >
    <div className="flex justify-between items-center border-b border-purple-200 pb-2 mb-3">
      <h3 className="font-bold text-purple-700">{title}</h3>
      {headerAction}
    </div>
    <div>{children}</div>
  </div>
);

export default function TarjetaInfoMascota({ 
  ficha, 
  onEditPet, 
  onDeletePet, 
  onAddNewPet,
  historial = []
}) {
  if (!ficha?.mascota) {
    return (
      <div className="lg:col-span-1">
        <InfoCard title="Información de la Mascota">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No hay información de mascota disponible</p>
            <Button onClick={onAddNewPet} className="bg-purple-600 hover:bg-purple-700">
              Agregar Nueva Mascota
            </Button>
          </div>
        </InfoCard>
      </div>
    );
  }

  const { mascota, owner } = ficha;

  return (
    <div className="space-y-4">
      <InfoCard
        title="Info del animal"
        headerAction={
          <Button
            size="icon"
            variant="ghost"
            onClick={onEditPet}
          >
            <Settings
              size={20}
              className="text-gray-500 hover:text-purple-700"
            />
          </Button>
        }
      >
        <div className="flex flex-col items-center text-center p-6">
          <div
            className="cursor-pointer group"
            onClick={onEditPet}
            title="Hacer click para editar la información"
          >
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-100 shadow-lg transition-all duration-200 group-hover:border-purple-300 group-hover:shadow-xl">
              <ImageDisplay
                src={mascota.foto}
                alt="Foto mascota"
                className="w-full h-full object-cover"
                showControls={false}
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Información Básica - Más compacta */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-4">
            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
              Información Básica
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Especie
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {mascota.especie}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Raza
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {mascota.raza}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Sexo
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {mascota.sexo}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Esterilizado
                </div>
                <div
                  className={`text-sm font-semibold ${
                    mascota.estado_reproductivo
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {mascota.estado_reproductivo ? "Sí" : "No"}
                </div>
              </div>
            </div>
          </div>

          {/* Datos Médicos y Propietario en dos columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Datos Médicos */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
                Datos Médicos
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">
                    Edad
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {mascota.edad} años
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">
                    Último peso
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {historial.length > 0 && historial[0].peso
                      ? `${historial[0].peso} kg`
                      : mascota.peso
                      ? `${mascota.peso} kg`
                      : "No registrado"}
                  </span>
                </div>
                {mascota.deceso && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        Estado
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                          Fallecido
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onDeletePet}
                          className="h-6 px-2 text-xs border-gray-300 hover:bg-gray-50"
                        >
                          Editar
                        </Button>
                      </div>
                    </div>
                    {mascota.fecha_seceso && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600">
                          Fecha de deceso
                        </span>
                        <span className="text-sm font-semibold text-red-600">
                          {new Date(
                            mascota.fecha_seceso
                          ).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Propietario */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
                Propietario
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">
                    Dueño
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {owner?.nombre} {owner?.apellido}
                  </span>
                </div>
                <div className="flex justify-end py-2">
                  <Button
                    onClick={onDeletePet}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {mascota.deceso ? "Desmarcar Fallecido" : "Marcar como fallecido"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </InfoCard>
    </div>
  );
}
