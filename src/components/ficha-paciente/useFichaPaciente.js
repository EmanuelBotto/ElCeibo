import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { obtenerItemsVacunas, calcularAlertasVacunas } from "./utils";

export function useFichaPaciente(mascotaId) {
  const [ficha, setFicha] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [historial, setHistorial] = useState([]);
  const [itemsVacunas, setItemsVacunas] = useState([]);
  const [proximasVacunas, setProximasVacunas] = useState([]);
  const [alertasVacunas, setAlertasVacunas] = useState([]);

  // Cargar datos de la ficha del paciente
  const cargarDatosMascota = useCallback(async () => {
    if (!mascotaId) return;

    setIsLoading(true);
    try {
      // Ejecutar todas las llamadas API en paralelo
      const [fichaRes, historialRes, itemsRes, proximasVacunasRes] =
        await Promise.allSettled([
          fetch(`/api/fichas-paciente/${mascotaId}`),
          fetch(`/api/historial-mascota/${mascotaId}`),
          obtenerItemsVacunas(),
          fetch(`/api/vacunas-aplicadas/proximas?id_mascota=${mascotaId}`),
        ]);

      // Procesar respuesta de ficha principal
      if (fichaRes.status === "fulfilled" && fichaRes.value.ok) {
        const fichaData = await fichaRes.value.json();
        setFicha(fichaData);
      } else if (fichaRes.status === "rejected" || !fichaRes.value.ok) {
        const error =
          fichaRes.status === "rejected"
            ? fichaRes.reason
            : await fichaRes.value.json();
        throw new Error(error?.error || "No se pudo cargar la ficha");
      }

      // Procesar historial médico
      if (historialRes.status === "fulfilled" && historialRes.value.ok) {
        const historialData = await historialRes.value.json();
        setHistorial(historialData);
      }

      // Procesar items de vacunas
      if (itemsRes.status === "fulfilled") {
        console.log("Items de vacunas cargados:", itemsRes.value);
        setItemsVacunas(itemsRes.value);
      } else {
        console.error("Error al cargar items de vacunas:", itemsRes.reason);
      }

      // Procesar próximas vacunas
      if (
        proximasVacunasRes.status === "fulfilled" &&
        proximasVacunasRes.value.ok
      ) {
        const proximasData = await proximasVacunasRes.value.json();
        setProximasVacunas(proximasData);

        // Calcular alertas de vacunas
        const alertas = calcularAlertasVacunas(proximasData);
        setAlertasVacunas(alertas);
      }
    } catch (error) {
      console.error("Error al cargar datos de la mascota:", error);
      toast.error(error.message || "Error al cargar los datos del paciente");
    } finally {
      setIsLoading(false);
    }
  }, [mascotaId]);

  // Cargar datos al montar el componente o cambiar mascotaId
  useEffect(() => {
    cargarDatosMascota();
  }, [cargarDatosMascota]);

  // Función para agregar nueva visita
  const agregarVisita = async (visitaData) => {
    try {
      const response = await fetch("/api/historial-mascota", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visitaData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al agregar la visita");
      }

      const nuevaVisita = await response.json();
      setHistorial((prev) => [nuevaVisita, ...prev]);
      toast.success("Visita agregada correctamente");
      return nuevaVisita;
    } catch (error) {
      console.error("Error al agregar visita:", error);
      toast.error(error.message || "Error al agregar la visita");
      throw error;
    }
  };

  // Función para actualizar visita
  const actualizarVisita = async (visitaData) => {
    try {
      const response = await fetch("/api/historial-mascota", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visitaData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar la visita");
      }

      const visitaActualizada = await response.json();

      // Recargar el historial completo para asegurar que tenemos todos los datos actualizados
      await cargarDatosMascota();

      toast.success("Visita actualizada correctamente");
      return visitaActualizada;
    } catch (error) {
      console.error("Error al actualizar visita:", error);
      toast.error(error.message || "Error al actualizar la visita");
      throw error;
    }
  };

  // Función para eliminar visita
  const eliminarVisita = async (idVisita) => {
    try {
      const response = await fetch(`/api/historial-mascota/${idVisita}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar la visita");
      }

      setHistorial((prev) =>
        prev.filter((visita) => visita.id_visita !== idVisita)
      );
      toast.success("Visita eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar visita:", error);
      toast.error(error.message || "Error al eliminar la visita");
      throw error;
    }
  };

  // Función para agregar nueva mascota
  const agregarMascota = async (mascotaData) => {
    try {
      const formData = new FormData();

      // Agregar todos los campos del formulario
      Object.keys(mascotaData).forEach((key) => {
        if (key === "foto" && mascotaData[key]) {
          formData.append("foto", mascotaData[key]);
        } else if (
          mascotaData[key] !== null &&
          mascotaData[key] !== undefined
        ) {
          formData.append(key, mascotaData[key]);
        }
      });

      const response = await fetch("/api/mascotas", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al agregar la mascota");
      }

      const nuevaMascota = await response.json();
      toast.success("Mascota agregada correctamente");

      // Recargar datos para mostrar la nueva mascota
      await cargarDatosMascota();

      return nuevaMascota;
    } catch (error) {
      console.error("Error al agregar mascota:", error);
      toast.error(error.message || "Error al agregar la mascota");
      throw error;
    }
  };

  // Función para eliminar mascota
  const eliminarMascota = async (idMascota) => {
    try {
      const response = await fetch(`/api/mascotas/${idMascota}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar la mascota");
      }

      toast.success("Mascota eliminada correctamente");

      // Recargar datos
      await cargarDatosMascota();
    } catch (error) {
      console.error("Error al eliminar mascota:", error);
      toast.error(error.message || "Error al eliminar la mascota");
      throw error;
    }
  };

  // Función para actualizar foto de mascota
  const actualizarFotoMascota = async (idMascota, foto) => {
    try {
      const formData = new FormData();
      formData.append("foto", foto);

      const response = await fetch(`/api/mascotas/${idMascota}/foto`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar la foto");
      }

      toast.success("Foto actualizada correctamente");

      // Recargar datos para mostrar la nueva foto
      await cargarDatosMascota();
    } catch (error) {
      console.error("Error al actualizar foto:", error);
      toast.error(error.message || "Error al actualizar la foto");
      throw error;
    }
  };

  return {
    // Estado
    ficha,
    isLoading,
    historial,
    itemsVacunas,
    proximasVacunas,
    alertasVacunas,

    // Acciones
    cargarDatosMascota,
    agregarVisita,
    actualizarVisita,
    eliminarVisita,
    agregarMascota,
    eliminarMascota,
    actualizarFotoMascota,
  };
}
