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

export default function DialogoEditarItem({
  isOpen,
  onClose,
  onSubmit,
  itemData,
}) {
  const [formData, setFormData] = useState({
    detalle: "",
    rubro: "",
    duracion: "",
    prospecto: "",
  });
  const [errores, setErrores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos del item cuando se abre el diálogo
  useEffect(() => {
    if (isOpen && itemData) {
      setFormData({
        detalle: itemData.detalle || "",
        rubro: itemData.rubro || "",
        duracion: itemData.duracion || "",
        prospecto: itemData.prospecto || "",
      });
    }
  }, [isOpen, itemData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errores[field]) {
      setErrores((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrores = {};

    if (!formData.detalle?.trim()) {
      newErrores.detalle = "La descripción es requerida";
    }

    if (!formData.rubro?.trim()) {
      newErrores.rubro = "El rubro es requerido";
    }

    return newErrores;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errores = validateForm();
    if (Object.keys(errores).length > 0) {
      setErrores(errores);
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...formData,
        id_item: itemData?.id_item,
      };

      await onSubmit(dataToSubmit);
      handleClose();
    } catch (error) {
      console.error("Error al actualizar item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      detalle: "",
      rubro: "",
      duracion: "",
      prospecto: "",
    });
    setErrores({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-purple-800">
            Editar Item
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Modifica la información del item
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Descripción */}
            <div>
              <Label
                htmlFor="detalle_edit"
                className="text-gray-700 font-semibold"
              >
                Descripción <span className="text-red-500">*</span>
              </Label>
              <Input
                id="detalle_edit"
                value={formData.detalle || ""}
                onChange={(e) => handleInputChange("detalle", e.target.value)}
                placeholder="Descripción del item"
                required
                className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                  errores.detalle ? "border-red-400" : "border-purple-400"
                }`}
              />
              {errores.detalle && (
                <p className="text-red-500 text-xs mt-1">{errores.detalle}</p>
              )}
            </div>

            {/* Rubro */}
            <div>
              <Label
                htmlFor="rubro_edit"
                className="text-gray-700 font-semibold"
              >
                Rubro <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rubro_edit"
                value={formData.rubro || ""}
                onChange={(e) => handleInputChange("rubro", e.target.value)}
                placeholder="Rubro del item"
                required
                className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                  errores.rubro ? "border-red-400" : "border-purple-400"
                }`}
              />
              {errores.rubro && (
                <p className="text-red-500 text-xs mt-1">{errores.rubro}</p>
              )}
            </div>

            {/* Duración */}
            <div>
              <Label
                htmlFor="duracion_edit"
                className="text-gray-700 font-semibold"
              >
                Duración
              </Label>
              <Input
                id="duracion_edit"
                value={formData.duracion || ""}
                onChange={(e) => handleInputChange("duracion", e.target.value)}
                placeholder="Duración (ej: 12 meses)"
                className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
              />
            </div>

            {/* Prospecto */}
            <div>
              <Label
                htmlFor="prospecto_edit"
                className="text-gray-700 font-semibold"
              >
                Prospecto
              </Label>
              <textarea
                id="prospecto_edit"
                value={formData.prospecto || ""}
                onChange={(e) => handleInputChange("prospecto", e.target.value)}
                placeholder="Prospecto del item..."
                rows={4}
                className={`mt-1 w-full p-3 border-2 rounded-lg resize-none focus:ring-purple-500 focus:outline-none ${
                  errores.prospecto ? "border-red-400" : "border-purple-400"
                }`}
              />
              {errores.prospecto && (
                <p className="text-red-500 text-xs mt-1">{errores.prospecto}</p>
              )}
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
              {isSubmitting ? "Actualizando..." : "Actualizar Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
