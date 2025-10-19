"use client";

import { useState, useEffect } from "react";
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
import { validarFormularioVisita } from "./utils";

export default function DialogoVisita({ 
  isOpen, 
  onClose, 
  onSubmit, 
  mascotaId,
  visitaData = null, // Para edición
  isEditing = false
}) {
  const [formData, setFormData] = useState({
    fecha: "",
    diagnostico: "",
    frecuencia_cardiaca: "",
    frecuencia_respiratoria: "",
    peso: "",
  });
  const [errores, setErrores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos de la visita si estamos editando
  useEffect(() => {
    if (isEditing && visitaData) {
      setFormData({
        fecha: visitaData.fecha || "",
        diagnostico: visitaData.diagnostico || "",
        frecuencia_cardiaca: visitaData.frecuencia_cardiaca || "",
        frecuencia_respiratoria: visitaData.frecuencia_respiratoria || "",
        peso: visitaData.peso || "",
      });
    } else if (!isEditing) {
      // Resetear formulario para nueva visita
      setFormData({
        fecha: new Date().toISOString().split("T")[0], // Fecha actual
        diagnostico: "",
        frecuencia_cardiaca: "",
        frecuencia_respiratoria: "",
        peso: "",
      });
    }
  }, [isEditing, visitaData, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errores[field]) {
      setErrores(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validacion = validarFormularioVisita(formData);
    if (!validacion.esValido) {
      setErrores(validacion.errores);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        id_mascota: mascotaId,
        id_visita: isEditing ? visitaData.id_visita : undefined
      });
      handleClose();
    } catch (error) {
      console.error("Error al guardar visita:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      fecha: "",
      diagnostico: "",
      frecuencia_cardiaca: "",
      frecuencia_respiratoria: "",
      peso: "",
    });
    setErrores({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-purple-800">
            {isEditing ? "Editar Visita" : "Nueva Visita Médica"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isEditing 
              ? "Modifica los datos de la visita médica." 
              : "Registra una nueva visita médica para el paciente."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Fecha */}
            <div>
              <Label
                htmlFor="fecha"
                className="text-gray-700 font-semibold"
              >
                Fecha <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => handleInputChange('fecha', e.target.value)}
                required
                className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                  errores.fecha ? 'border-red-400' : 'border-purple-400'
                }`}
              />
              {errores.fecha && (
                <p className="text-red-500 text-xs mt-1">{errores.fecha}</p>
              )}
            </div>

            {/* Diagnóstico */}
            <div>
              <Label
                htmlFor="diagnostico"
                className="text-gray-700 font-semibold"
              >
                Diagnóstico <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="diagnostico"
                value={formData.diagnostico}
                onChange={(e) => handleInputChange('diagnostico', e.target.value)}
                placeholder="Describe el diagnóstico o motivo de la visita"
                required
                rows={3}
                className={`mt-1 w-full px-3 py-2 border-2 rounded-lg focus:ring-purple-500 focus:border-transparent resize-none ${
                  errores.diagnostico ? 'border-red-400' : 'border-purple-400'
                }`}
              />
              {errores.diagnostico && (
                <p className="text-red-500 text-xs mt-1">{errores.diagnostico}</p>
              )}
            </div>

            {/* Signos vitales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="frecuencia_cardiaca"
                  className="text-gray-700 font-semibold"
                >
                  Frecuencia Cardíaca (lpm)
                </Label>
                <Input
                  id="frecuencia_cardiaca"
                  type="number"
                  value={formData.frecuencia_cardiaca}
                  onChange={(e) => handleInputChange('frecuencia_cardiaca', e.target.value)}
                  placeholder="Ej: 120"
                  min="0"
                  className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label
                  htmlFor="frecuencia_respiratoria"
                  className="text-gray-700 font-semibold"
                >
                  Frecuencia Respiratoria (rpm)
                </Label>
                <Input
                  id="frecuencia_respiratoria"
                  type="number"
                  value={formData.frecuencia_respiratoria}
                  onChange={(e) => handleInputChange('frecuencia_respiratoria', e.target.value)}
                  placeholder="Ej: 20"
                  min="0"
                  className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Peso */}
            <div>
              <Label
                htmlFor="peso"
                className="text-gray-700 font-semibold"
              >
                Peso (kg)
              </Label>
              <Input
                id="peso"
                type="number"
                value={formData.peso}
                onChange={(e) => handleInputChange('peso', e.target.value)}
                placeholder="Peso actual del paciente"
                min="0"
                step="0.1"
                className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
              />
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
              {isSubmitting 
                ? (isEditing ? "Actualizando..." : "Guardando...") 
                : (isEditing ? "Actualizar Visita" : "Guardar Visita")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
