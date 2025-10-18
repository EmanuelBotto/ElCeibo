"use client";

import { useState } from "react";
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

export default function DialogoNuevaMascota({ 
  isOpen, 
  onClose, 
  onSubmit, 
  clienteId 
}) {
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errores[field]) {
      setErrores(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, foto: file }));
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
      const dataToSubmit = {
        ...formData,
        id_cliente: clienteId
      };
      
      // Si se seleccionó "Otro", usar el valor personalizado
      if (formData.especie === 'Otro' && formData.especieCustom) {
        dataToSubmit.especie = formData.especieCustom;
      }
      
      await onSubmit(dataToSubmit);
      handleClose();
    } catch (error) {
      console.error("Error al crear mascota:", error);
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
          <DialogTitle className="text-2xl font-bold text-purple-800">
            Agregar Nueva Mascota
          </DialogTitle>
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
                  onClick={() => document.getElementById('foto_mascota').click()}
                  title="Hacer click para seleccionar foto"
                >
                  <input
                    id="foto_mascota"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {formData.foto ? (
                    <img
                      src={URL.createObjectURL(formData.foto)}
                      alt="Vista previa"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Camera className="text-purple-600" size={40} />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('foto_mascota').click()}
                  className="mt-3 text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Seleccionar Foto
                </Button>
              </div>
            </div>

            {/* Campos del formulario - Lado derecho */}
            <div className="flex-1 space-y-4">
              {/* Primera fila - Nombre y Especie */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="nombre_mascota"
                    className="text-gray-700 font-semibold"
                  >
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombre_mascota"
                    value={formData.nombre || ''}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Nombre de la mascota"
                    required
                    className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                      errores.nombre ? 'border-red-400' : 'border-purple-400'
                    }`}
                  />
                  {errores.nombre && (
                    <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="especie_mascota"
                    className="text-gray-700 font-semibold"
                  >
                    Especie <span className="text-red-500">*</span>
                  </Label>
                  {formData.especie === 'Otro' ? (
                    <Input
                      id="especie_mascota"
                      value={formData.especieCustom || ''}
                      onChange={(e) => handleInputChange('especieCustom', e.target.value)}
                      placeholder="Especificar especie"
                      required
                      className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                        errores.especie ? 'border-red-400' : 'border-purple-400'
                      }`}
                    />
                  ) : (
                    <select
                      id="especie_mascota"
                      value={formData.especie || ''}
                      onChange={(e) => {
                        if (e.target.value === 'Otro') {
                          handleInputChange('especie', 'Otro');
                          handleInputChange('especieCustom', '');
                        } else {
                          handleInputChange('especie', e.target.value);
                          handleInputChange('especieCustom', '');
                        }
                      }}
                      required
                      className={`mt-1 w-full h-12 px-3 border-2 rounded-full focus:ring-purple-500 focus:border-transparent ${
                        errores.especie ? 'border-red-400' : 'border-purple-400'
                      }`}
                    >
                      <option value="">Seleccionar</option>
                      <option value="Perro">Perro</option>
                      <option value="Gato">Gato</option>
                      <option value="Conejo">Conejo</option>
                      <option value="Ave">Ave</option>
                      <option value="Otro">Otro</option>
                    </select>
                  )}
                  {errores.especie && (
                    <p className="text-red-500 text-xs mt-1">{errores.especie}</p>
                  )}
                </div>
              </div>

              {/* Segunda fila - Raza y Sexo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="raza_mascota"
                    className="text-gray-700 font-semibold"
                  >
                    Raza
                  </Label>
                  <Input
                    id="raza_mascota"
                    value={formData.raza || ''}
                    onChange={(e) => handleInputChange('raza', e.target.value)}
                    placeholder="Raza de la mascota"
                    className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="sexo_mascota"
                    className="text-gray-700 font-semibold"
                  >
                    Sexo <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="sexo_mascota"
                    value={formData.sexo || ''}
                    onChange={(e) => handleInputChange('sexo', e.target.value)}
                    required
                    className={`mt-1 w-full h-12 px-3 border-2 rounded-full focus:ring-purple-500 focus:border-transparent ${
                      errores.sexo ? 'border-red-400' : 'border-purple-400'
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
                    htmlFor="edad_mascota"
                    className="text-gray-700 font-semibold"
                  >
                    Edad (años)
                  </Label>
                  <Input
                    id="edad_mascota"
                    type="number"
                    value={formData.edad || ''}
                    onChange={(e) => handleInputChange('edad', e.target.value)}
                    placeholder="Edad en años"
                    min="0"
                    step="0.1"
                    className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="peso_mascota"
                    className="text-gray-700 font-semibold"
                  >
                    Peso (kg)
                  </Label>
                  <Input
                    id="peso_mascota"
                    type="number"
                    value={formData.peso || ''}
                    onChange={(e) => handleInputChange('peso', e.target.value)}
                    placeholder="Peso en kg"
                    min="0"
                    step="0.1"
                    className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Estado reproductivo */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="estado_reproductivo_mascota"
                  checked={formData.estado_reproductivo}
                  onChange={(e) => handleInputChange('estado_reproductivo', e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <Label
                  htmlFor="estado_reproductivo_mascota"
                  className="text-gray-700 font-semibold"
                >
                  Esterilizado
                </Label>
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
              {isSubmitting ? "Agregando..." : "Agregar Mascota"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
