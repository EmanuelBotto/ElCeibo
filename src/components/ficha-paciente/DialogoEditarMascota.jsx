"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Camera } from "lucide-react";
import { validarFormularioMascota } from "./utils";

export default function DialogoEditarMascota({
  isOpen,
  onClose,
  onSubmit,
  mascotaData,
}) {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    nombre: "",
    especie: "",
    especieCustom: "",
    raza: "",
    sexo: "",
    edad: "",
    peso: "",
    estado_reproductivo: false,
    estado: "Vivo",
    foto: null,
  });
  const [errores, setErrores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función helper para validar si una URL de imagen es válida
  const isValidImageUrl = (url) => {
    if (!url) return false;
    if (url === "{}" || url.includes("{}") || url.trim() === "{}") return false;
    if (url === "null" || url === "undefined") return false;
    if (url.includes("[object Object]")) return false;
    return true;
  };

  // Función helper para obtener la URL de la imagen
  const getImageUrl = (imageData) => {
    if (!imageData) return null;

    // Si es un archivo File, crear URL temporal
    if (imageData instanceof File) {
      return URL.createObjectURL(imageData);
    }

    // Si es una string base64, validar y retornar
    if (typeof imageData === "string" && isValidImageUrl(imageData)) {
      return imageData;
    }

    return null;
  };

  // Cargar datos de la mascota cuando se abre el diálogo
  useEffect(() => {
    if (isOpen && mascotaData) {
      const especiesPredefinidas = ["Perro", "Gato", "Conejo", "Ave"];
      const especieActual = mascotaData.especie || "";
      const especieEsPredefinida = especiesPredefinidas.includes(especieActual);

      setFormData({
        nombre: mascotaData.nombre || "",
        especie: especieEsPredefinida ? especieActual : "Otro",
        especieCustom: especieEsPredefinida ? "" : especieActual,
        raza: mascotaData.raza || "",
        sexo: mascotaData.sexo || "",
        edad: mascotaData.edad || "",
        peso: mascotaData.peso || "",
        estado_reproductivo: mascotaData.estado_reproductivo || false,
        estado: mascotaData.deceso ? "Fallecido" : "Vivo",
        foto: mascotaData.foto || null,
      });
    }
  }, [isOpen, mascotaData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errores[field]) {
      setErrores((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        setFormData((prev) => ({ ...prev, foto: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validacion = validarFormularioMascota(formData);
    if (!validacion.esValido) {
      setErrores(validacion.errores);
      return;
    }

    setIsSubmitting(true);
    try {
      // Asegurar que la foto esté en formato base64
      let fotoBase64 = formData.foto;

      // Si la foto es un archivo File, convertirla a base64
      if (formData.foto instanceof File) {
        const reader = new FileReader();
        fotoBase64 = await new Promise((resolve, reject) => {
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(formData.foto);
        });
      }

      // Preparar datos en el formato que espera el API
      const dataToSubmit = {
        nombre: formData.nombre,
        especie:
          formData.especie === "Otro"
            ? formData.especieCustom
            : formData.especie,
        raza: formData.raza,
        sexo: formData.sexo,
        edad: formData.edad ? parseFloat(formData.edad) : 0,
        peso: formData.peso ? parseFloat(formData.peso) : 0,
        foto: fotoBase64,
        estado_reproductivo: formData.estado_reproductivo,
        dia: mascotaData.dia || 1,
        mes: mascotaData.mes || "Enero",
        anio: mascotaData.anio || new Date().getFullYear(),
        id_cliente: mascotaData.id_cliente,
        deceso: formData.estado === "Fallecido",
        fecha_deceso:
          formData.estado === "Fallecido"
            ? new Date().toISOString().split("T")[0]
            : null,
      };

      await onSubmit(dataToSubmit);
      handleClose();
    } catch (error) {
      console.error("Error al actualizar mascota:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: "",
      especie: "",
      especieCustom: "",
      raza: "",
      sexo: "",
      edad: "",
      peso: "",
      estado_reproductivo: false,
      estado: "Vivo",
      foto: null,
    });
    setErrores({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-purple-800">
            Editar Información de la Mascota
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Modifica los datos de la mascota
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-8">
            {/* Foto de la mascota - Lado izquierdo */}
            <div className="flex-shrink-0">
              <div className="flex flex-col items-center">
                <Label className="text-gray-700 font-semibold mb-4">
                  Foto de la mascota
                </Label>
                <div
                  className="w-40 h-40 bg-purple-100 rounded-full flex items-center justify-center cursor-pointer group hover:shadow-lg transition-all duration-200 overflow-hidden"
                  onClick={() =>
                    document.getElementById("foto_mascota_edit").click()
                  }
                  title="Hacer click para seleccionar foto"
                >
                  <input
                    id="foto_mascota_edit"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {getImageUrl(formData.foto) ? (
                    <img
                      src={getImageUrl(formData.foto)}
                      alt="Vista previa"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        console.error(
                          "Error loading preview image:",
                          e.target.src
                        );
                        e.target.style.display = "none";
                      }}
                    />
                  ) : getImageUrl(mascotaData?.foto) ? (
                    <img
                      src={getImageUrl(mascotaData.foto)}
                      alt="Foto actual"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        console.error(
                          "Error loading current photo:",
                          e.target.src
                        );
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <Camera className="text-purple-600" size={40} />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("foto_mascota_edit").click()
                  }
                  className="mt-3 text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Cambiar Foto
                </Button>
              </div>
            </div>

            {/* Campos del formulario - Lado derecho */}
            <div className="flex-1 space-y-4">
              {/* Primera fila - Nombre y Especie */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="nombre_mascota_edit"
                    className="text-gray-700 font-semibold"
                  >
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombre_mascota_edit"
                    value={formData.nombre || ""}
                    onChange={(e) =>
                      handleInputChange("nombre", e.target.value)
                    }
                    placeholder="Nombre de la mascota"
                    required
                    className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                      errores.nombre ? "border-red-400" : "border-purple-400"
                    }`}
                  />
                  {errores.nombre && (
                    <p className="text-red-500 text-xs mt-1">
                      {errores.nombre}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="especie_mascota_edit"
                    className="text-gray-700 font-semibold"
                  >
                    Especie <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="especie_mascota_edit"
                    value={formData.especie || ""}
                    onChange={(e) =>
                      handleInputChange("especie", e.target.value)
                    }
                    required
                    className={`mt-1 w-full h-12 px-3 border-2 rounded-full focus:ring-purple-500 focus:border-transparent ${
                      errores.especie ? "border-red-400" : "border-purple-400"
                    }`}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Perro">Perro</option>
                    <option value="Gato">Gato</option>
                    <option value="Conejo">Conejo</option>
                    <option value="Ave">Ave</option>
                    <option value="Otro">Otro</option>
                  </select>
                  {errores.especie && (
                    <p className="text-red-500 text-xs mt-1">
                      {errores.especie}
                    </p>
                  )}
                </div>
              </div>

              {/* Campo especie custom */}
              {formData.especie === "Otro" && (
                <div>
                  <Label
                    htmlFor="especie_custom_edit"
                    className="text-gray-700 font-semibold"
                  >
                    Especie personalizada{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="especie_custom_edit"
                    value={formData.especieCustom || ""}
                    onChange={(e) =>
                      handleInputChange("especieCustom", e.target.value)
                    }
                    placeholder="Especificar especie"
                    required
                    className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                      errores.especie ? "border-red-400" : "border-purple-400"
                    }`}
                  />
                </div>
              )}

              {/* Segunda fila - Raza y Sexo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="raza_mascota_edit"
                    className="text-gray-700 font-semibold"
                  >
                    Raza
                  </Label>
                  <Input
                    id="raza_mascota_edit"
                    value={formData.raza || ""}
                    onChange={(e) => handleInputChange("raza", e.target.value)}
                    placeholder="Raza de la mascota"
                    className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="sexo_mascota_edit"
                    className="text-gray-700 font-semibold"
                  >
                    Sexo <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="sexo_mascota_edit"
                    value={formData.sexo || ""}
                    onChange={(e) => handleInputChange("sexo", e.target.value)}
                    required
                    className={`mt-1 w-full h-12 px-3 border-2 rounded-full focus:ring-purple-500 focus:border-transparent ${
                      errores.sexo ? "border-red-400" : "border-purple-400"
                    }`}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                  {errores.sexo && (
                    <p className="text-red-500 text-xs mt-1">{errores.sexo}</p>
                  )}
                </div>
              </div>

              {/* Tercera fila - Edad y Peso */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="edad_mascota_edit"
                    className="text-gray-700 font-semibold"
                  >
                    Edad (años)
                  </Label>
                  <Input
                    id="edad_mascota_edit"
                    type="number"
                    value={formData.edad || ""}
                    onChange={(e) => handleInputChange("edad", e.target.value)}
                    placeholder="Edad en años"
                    className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="peso_mascota_edit"
                    className="text-gray-700 font-semibold"
                  >
                    Peso (kg)
                  </Label>
                  <Input
                    id="peso_mascota_edit"
                    type="number"
                    step="0.1"
                    value={formData.peso || ""}
                    onChange={(e) => handleInputChange("peso", e.target.value)}
                    placeholder="Peso en kg"
                    className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Estado reproductivo */}
              <div>
                <Label className="text-gray-700 font-semibold">
                  Estado Reproductivo
                </Label>
                <div className="mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.estado_reproductivo}
                      onChange={(e) =>
                        handleInputChange(
                          "estado_reproductivo",
                          e.target.checked
                        )
                      }
                      className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">Esterilizado/Castrado</span>
                  </label>
                </div>
              </div>

              {/* Estado */}
              <div>
                <Label
                  htmlFor="estado_mascota_edit"
                  className="text-gray-700 font-semibold"
                >
                  Estado
                </Label>
                <select
                  id="estado_mascota_edit"
                  value={formData.estado || ""}
                  onChange={(e) => handleInputChange("estado", e.target.value)}
                  className="mt-1 w-full h-12 px-3 border-2 border-purple-400 rounded-full focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="Vivo">Vivo</option>
                  <option value="Fallecido">Fallecido</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Actualizando..." : "Actualizar Mascota"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
