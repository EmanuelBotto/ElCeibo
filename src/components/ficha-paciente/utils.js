import { Cat, Dog, PawPrint } from "lucide-react";

// Caché simple para items de vacunas (no cambian frecuentemente)
let itemsVacunasCache = null;
let itemsVacunasCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para obtener el ícono de la mascota según su especie
export const getPetIcon = (especie) => {
  switch (especie?.toLowerCase()) {
    case "gato":
      return <Cat className="inline-block mr-2 text-purple-600" size={18} />;
    case "perro":
      return <Dog className="inline-block mr-2 text-purple-600" size={18} />;
    default:
      return (
        <PawPrint className="inline-block mr-2 text-purple-600" size={18} />
      );
  }
};

// Función para calcular alertas de vacunas
export const calcularAlertasVacunas = (vacunas) => {
  const hoy = new Date();
  const alertas = [];

  vacunas.forEach((vacuna) => {
    const fechaProxima = new Date(vacuna.fecha_proxima);
    const diff = Math.ceil((fechaProxima - hoy) / (1000 * 60 * 60 * 24));

    if (diff <= 7 && diff >= 0) {
      alertas.push({
        id: vacuna.id_vacuna,
        nombre: vacuna.nombre_vacuna,
        fecha: vacuna.fecha_proxima,
        dias: diff,
        tipo: diff === 0 ? "hoy" : diff <= 3 ? "urgente" : "pronto",
      });
    }
  });

  return alertas;
};

// Función para obtener items de vacunas con caché
export const obtenerItemsVacunas = async () => {
  const ahora = Date.now();

  if (itemsVacunasCache && ahora - itemsVacunasCacheTime < CACHE_DURATION) {
    return itemsVacunasCache;
  }

  try {
    const response = await fetch("/api/items");
    if (response.ok) {
      const items = await response.json();
      itemsVacunasCache = items;
      itemsVacunasCacheTime = ahora;
      return items;
    }
  } catch (error) {
    console.error("Error al obtener items de vacunas:", error);
  }

  return [];
};

// Función para formatear fechas
export const formatearFecha = (fecha) => {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Función para formatear fechas cortas
export const formatearFechaCorta = (fecha) => {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// Función para calcular la edad de la mascota
export const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return "No especificada";

  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const diffTime = Math.abs(hoy - nacimiento);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} días`;
  } else if (diffDays < 365) {
    const meses = Math.floor(diffDays / 30);
    return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  } else {
    const años = Math.floor(diffDays / 365);
    const meses = Math.floor((diffDays % 365) / 30);
    let resultado = `${años} ${años === 1 ? "año" : "años"}`;
    if (meses > 0) {
      resultado += ` y ${meses} ${meses === 1 ? "mes" : "meses"}`;
    }
    return resultado;
  }
};

// Función para validar formularios
export const validarFormularioVisita = (formData) => {
  const errores = {};

  if (!formData.fecha?.trim()) {
    errores.fecha = "La fecha es requerida";
  }

  // El diagnóstico ya no es obligatorio

  return {
    esValido: Object.keys(errores).length === 0,
    errores,
  };
};

export const validarFormularioVacuna = (formData) => {
  const errores = {};

  if (!formData.nombre_vacuna?.trim()) {
    errores.nombre_vacuna = "El nombre de la vacuna es requerido";
  }

  if (!formData.fecha_aplicacion?.trim()) {
    errores.fecha_aplicacion = "La fecha de aplicación es requerida";
  }

  if (!formData.duracion_meses || formData.duracion_meses <= 0) {
    errores.duracion_meses = "La duración debe ser mayor a 0";
  }

  return {
    esValido: Object.keys(errores).length === 0,
    errores,
  };
};

export const validarFormularioMascota = (formData) => {
  const errores = {};

  if (!formData.nombre?.trim()) {
    errores.nombre = "El nombre es requerido";
  }

  // Validar especie considerando especieCustom
  if (formData.especie === "Otro") {
    if (!formData.especieCustom?.trim()) {
      errores.especie = "Debe especificar la especie";
    }
  } else {
    if (!formData.especie?.trim()) {
      errores.especie = "La especie es requerida";
    }
  }

  if (!formData.sexo?.trim()) {
    errores.sexo = "El sexo es requerido";
  }

  return {
    esValido: Object.keys(errores).length === 0,
    errores,
  };
};
