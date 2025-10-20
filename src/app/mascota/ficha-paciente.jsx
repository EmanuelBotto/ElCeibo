"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Importar componentes modulares
import {
  TarjetaInfoMascota,
  HistorialMedico,
  SeccionVacunas,
  AddPetDialog,
  EditPetDialog,
  VisitDialog,
  useFichaPaciente,
  getPetIcon
} from "@/components/ficha-paciente";

export default function FichaPaciente({ mascotaId }) {
  const router = useRouter();
  
  // Estados para diálogos
  const [isNuevaMascotaDialogOpen, setIsNuevaMascotaDialogOpen] = useState(false);
  const [isEditarMascotaDialogOpen, setIsEditarMascotaDialogOpen] = useState(false);
  const [isVisitaDialogOpen, setIsVisitaDialogOpen] = useState(false);
  const [isEditarVisitaDialogOpen, setIsEditarVisitaDialogOpen] = useState(false);
  const [isFotoDialogOpen, setIsFotoDialogOpen] = useState(false);
  const [isDecesoDialogOpen, setIsDecesoDialogOpen] = useState(false);
  
  // Estados para edición
  const [visitaSeleccionada, setVisitaSeleccionada] = useState(null);
  const [nuevaFoto, setNuevaFoto] = useState("");
  const [isActualizandoFoto, setIsActualizandoFoto] = useState(false);
  const [isActualizandoDeceso, setIsActualizandoDeceso] = useState(false);
  const [decesoForm, setDecesoForm] = useState({
    deceso: false,
    fecha_seceso: new Date().toISOString().split('T')[0],
  });

  // Hook personalizado para manejar la lógica de la ficha
  const {
    ficha,
    isLoading,
    historial,
    itemsVacunas,
    proximasVacunas,
    alertasVacunas,
    cargarDatosMascota,
    agregarVisita,
    actualizarVisita,
    eliminarVisita,
    agregarMascota,
    eliminarMascota,
    actualizarFotoMascota
  } = useFichaPaciente(mascotaId);

  // Estados de carga
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-gray-600 text-lg">Cargando ficha de la mascota...</p>
        <p className="text-gray-400 text-sm mt-2">
          Esto puede tomar unos segundos
        </p>
      </div>
    );
  }

  if (!ficha) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600 text-lg">
          No se encontró la ficha de la mascota.
        </p>
      </div>
    );
  }

  const { mascota, owner, otrasMascotas } = ficha;

  // Handlers para las acciones
  const handleAgregarVisita = () => {
    setVisitaSeleccionada(null);
    setIsVisitaDialogOpen(true);
  };

  const handleEditarVisita = (visita) => {
    setVisitaSeleccionada(visita);
    setIsEditarVisitaDialogOpen(true);
  };

  const handleEliminarVisita = async (idVisita) => {
    if (window.confirm("¿Seguro que deseas eliminar esta visita?")) {
      try {
        await eliminarVisita(idVisita);
      } catch (error) {
        console.error("Error al eliminar visita:", error);
      }
    }
  };

  const handleGuardarVisita = async (visitaData) => {
    try {
      if (visitaSeleccionada) {
        await actualizarVisita(visitaData);
      } else {
        await agregarVisita(visitaData);
      }
    } catch (error) {
      console.error("Error al guardar visita:", error);
    }
  };

  const handleAgregarMascota = async (mascotaData) => {
    try {
      await agregarMascota(mascotaData);
      setIsNuevaMascotaDialogOpen(false);
    } catch (error) {
      console.error("Error al agregar mascota:", error);
    }
  };

  const handleEditarMascota = async (mascotaData) => {
    try {
      const response = await fetch(`/api/mascotas/${mascotaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mascotaData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar la mascota");
      }

      toast.success("Información de la mascota actualizada exitosamente");
      await cargarDatosMascota();
      setIsEditarMascotaDialogOpen(false);
    } catch (error) {
      console.error("Error al editar mascota:", error);
      toast.error(error.message || "Error al actualizar la mascota");
    }
  };

  const handleEliminarMascota = async () => {
    if (window.confirm("¿Seguro que deseas eliminar esta mascota?")) {
      try {
        await eliminarMascota(mascotaId);
        router.push("/");
      } catch (error) {
        console.error("Error al eliminar mascota:", error);
      }
    }
  };

  const handleCambiarFoto = () => {
    setIsFotoDialogOpen(true);
  };

  const handleCambioArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 10MB.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Por favor selecciona un archivo de imagen válido.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNuevaFoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnvioFoto = async (e) => {
    e.preventDefault();
    if (!nuevaFoto) {
      toast.error("Por favor selecciona una foto");
      return;
    }

    setIsActualizandoFoto(true);
    try {
      await actualizarFotoMascota(mascotaId, nuevaFoto);
      setIsFotoDialogOpen(false);
      setNuevaFoto("");
    } catch (error) {
      console.error("Error al actualizar foto:", error);
    } finally {
      setIsActualizandoFoto(false);
    }
  };

  const handleAbrirEdicionDeceso = () => {
    setDecesoForm({
      deceso: ficha?.mascota?.deceso || false,
      fecha_seceso: ficha?.mascota?.fecha_seceso || new Date().toISOString().split('T')[0],
    });
    setIsDecesoDialogOpen(true);
  };

  const handleActualizacionDeceso = async () => {
    setIsActualizandoDeceso(true);
    try {
      const mascotaActualizada = {
        ...ficha.mascota,
        deceso: !ficha.mascota.deceso,
        fecha_seceso: !ficha.mascota.deceso ? new Date().toISOString().split('T')[0] : null,
      };

      const response = await fetch(`/api/mascotas/${mascotaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mascotaActualizada),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar el estado de deceso");
      }

      // Recargar datos
      await cargarDatosMascota();
      setIsDecesoDialogOpen(false);
      toast.success(
        !ficha.mascota.deceso
          ? "Mascota marcada como fallecida"
          : "Estado de fallecido removido"
      );
    } catch (error) {
      console.error("Error al actualizar deceso:", error);
      toast.error(error.message || "Error al actualizar el estado de deceso");
    } finally {
      setIsActualizandoDeceso(false);
    }
  };

  // Handlers para vacunas
  const handleAgregarVacuna = async (vacunaData) => {
    try {
      const response = await fetch("/api/vacunas-aplicadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vacunaData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar la vacuna");
      }

      toast.success("Vacuna registrada exitosamente");
      await cargarDatosMascota();
    } catch (error) {
      console.error("Error al agregar vacuna:", error);
      toast.error(error.message || "Error al agregar la vacuna");
    }
  };

  const handleEditarVacuna = async (vacunaData) => {
    try {
      const response = await fetch(`/api/vacunas-aplicadas/${vacunaData.id_vacuna}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vacunaData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar la vacuna");
      }

      toast.success("Vacuna actualizada exitosamente");
      await cargarDatosMascota();
    } catch (error) {
      console.error("Error al editar vacuna:", error);
      toast.error(error.message || "Error al actualizar la vacuna");
    }
  };

  const handleEliminarVacuna = async (idVacuna) => {
    if (window.confirm("¿Seguro que deseas eliminar esta vacuna?")) {
      try {
        const response = await fetch(`/api/vacunas-aplicadas/${idVacuna}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error al eliminar la vacuna");
        }

        toast.success("Vacuna eliminada exitosamente");
        await cargarDatosMascota();
      } catch (error) {
        console.error("Error al eliminar vacuna:", error);
        toast.error(error.message || "Error al eliminar la vacuna");
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="p-4 flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-purple-800">
          Ficha de Paciente
        </h1>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 p-4 pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Columna principal - Historial Médico */}
          <div className="lg:col-span-2">
            <HistorialMedico
              historial={historial}
              onAddVisit={handleAgregarVisita}
              onEditVisit={handleEditarVisita}
              onDeleteVisit={handleEliminarVisita}
              mascotaNombre={mascota?.nombre}
              visitaSeleccionada={visitaSeleccionada}
              setVisitaSeleccionada={setVisitaSeleccionada}
            />
          </div>

          {/* Columna derecha - Información de la mascota */}
          <div className="space-y-4">
            <TarjetaInfoMascota
              ficha={ficha}
              onEditPet={() => setIsEditarMascotaDialogOpen(true)}
              onDeletePet={handleAbrirEdicionDeceso}
              onAddNewPet={() => setIsNuevaMascotaDialogOpen(true)}
              historial={historial}
            />

            {/* Otras mascotas */}
            {otrasMascotas && otrasMascotas.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-center border-b border-purple-200 pb-2 mb-3">
                  <h3 className="font-bold text-purple-700">Otras mascotas</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsNuevaMascotaDialogOpen(true)}
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <PlusCircle size={16} className="mr-1" />
                    Agregar
                  </Button>
                </div>
                <ul className="space-y-2">
                  {otrasMascotas.map((pet) => (
                    <li
                      key={`${pet.id_mascota}-${pet.nombre}-${pet.especie}`}
                      className="flex items-center cursor-pointer hover:text-purple-700 p-1 rounded hover:bg-gray-100"
                      onClick={() => router.push(`/mascota/${pet.id_mascota}`)}
                    >
                      {getPetIcon(pet.especie)}
                      <span className="font-semibold text-black">
                        {pet.nombre}
                      </span>{" "}
                      - <span className="text-gray-700 ml-1">{pet.especie}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sección de Vacunas */}
            <SeccionVacunas
              proximasVacunas={proximasVacunas}
              alertasVacunas={alertasVacunas}
              itemsVacunas={itemsVacunas}
              onAddVaccination={handleAgregarVacuna}
              onEditVaccination={handleEditarVacuna}
              onDeleteVaccination={handleEliminarVacuna}
              mascotaId={mascotaId}
            />
          </div>
        </div>
      </main>

      {/* Diálogos */}
      <AddPetDialog
        isOpen={isNuevaMascotaDialogOpen}
        onClose={() => setIsNuevaMascotaDialogOpen(false)}
        onSubmit={handleAgregarMascota}
        clienteId={ficha?.owner?.id_clinete}
      />

      <EditPetDialog
        isOpen={isEditarMascotaDialogOpen}
        onClose={() => setIsEditarMascotaDialogOpen(false)}
        onSubmit={handleEditarMascota}
        mascotaData={ficha?.mascota}
      />

      <VisitDialog
        isOpen={isVisitaDialogOpen}
        onClose={() => setIsVisitaDialogOpen(false)}
        onSubmit={handleGuardarVisita}
        mascotaId={mascotaId}
        visitaData={null}
        isEditing={false}
      />

      <VisitDialog
        isOpen={isEditarVisitaDialogOpen}
        onClose={() => setIsEditarVisitaDialogOpen(false)}
        onSubmit={handleGuardarVisita}
        mascotaId={mascotaId}
        visitaData={visitaSeleccionada}
        isEditing={true}
      />

      {/* Diálogo para cambiar foto */}
      {isFotoDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-purple-800 mb-4">
              Cambiar Foto de {mascota?.nombre}
            </h2>
            <form onSubmit={handleEnvioFoto} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="foto_mascota"
                  accept="image/*"
                  onChange={handleCambioArchivo}
                  className="hidden"
                  required
                />
                <label
                  htmlFor="foto_mascota"
                  className="cursor-pointer block"
                >
                  <div className="space-y-3">
                    <div className="text-4xl text-gray-400">📷</div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        Hacer click para seleccionar foto
                      </p>
                      <p className="text-sm text-gray-500">
                        PNG, JPG, GIF hasta 10MB
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {nuevaFoto && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-sm font-semibold text-gray-700 block mb-3">
                    Vista previa:
                  </label>
                  <div className="flex justify-center">
                    <img
                      src={nuevaFoto}
                      alt="Vista previa"
                      className="w-40 h-40 rounded-full border-2 border-purple-300 shadow-md object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFotoDialogOpen(false);
                    setNuevaFoto("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isActualizandoFoto || !nuevaFoto}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isActualizandoFoto ? "Actualizando..." : "Actualizar Foto"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo para editar estado de deceso */}
      <Dialog open={isDecesoDialogOpen} onOpenChange={() => setIsDecesoDialogOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-purple-800 text-center">
              {ficha?.mascota?.deceso ? "Desmarcar Fallecido" : "Marcar como Fallecido"}
            </DialogTitle>
            <div className="text-center text-gray-600 py-4">
              {ficha?.mascota?.deceso 
                ? "¿Estás seguro de que quieres desmarcar a esta mascota como fallecida?"
                : "¿Estás seguro de que quieres marcar a esta mascota como fallecida?"
              }
            </div>
          </DialogHeader>
          
          <DialogFooter className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDecesoDialogOpen(false)}
              disabled={isActualizandoDeceso}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleActualizacionDeceso}
              disabled={isActualizandoDeceso}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isActualizandoDeceso ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}