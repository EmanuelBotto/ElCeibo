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
import { Syringe, AlertTriangle, CheckCircle, Clock, PlusCircle, Edit, Trash2 } from "lucide-react";
import { formatearFechaCorta, validarFormularioVacuna } from "./utils";

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

export default function SeccionVacunas({ 
  proximasVacunas, 
  alertasVacunas, 
  itemsVacunas,
  onAddVaccination,
  onEditVaccination,
  onDeleteVaccination,
  mascotaId 
}) {
  const [isVacunaDialogOpen, setIsVacunaDialogOpen] = useState(false);
  const [isEditarVacunaDialogOpen, setIsEditarVacunaDialogOpen] = useState(false);
  const [vacunaForm, setVacunaForm] = useState({
    nombre_vacuna: "",
    fecha_aplicacion: new Date().toISOString().split("T")[0],
    duracion_meses: "",
    observaciones: "",
    id_item: "",
  });
  const [vacunaSeleccionada, setVacunaSeleccionada] = useState(null);
  const [vacunaManual, setVacunaManual] = useState(false);
  const [duracionEditable, setDuracionEditable] = useState(false);
  const [errores, setErrores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setVacunaForm(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errores[field]) {
      setErrores(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleVacunaChange = (idItem) => {
    const item = itemsVacunas.find(item => item.id_item === parseInt(idItem));
    if (item) {
      setVacunaForm(prev => ({
        ...prev,
        id_item: idItem,
        nombre_vacuna: item.nombre,
        duracion_meses: item.duracion_meses.toString(),
      }));
      setDuracionEditable(false);
    }
  };

  const handleManualToggle = () => {
    setVacunaManual(!vacunaManual);
    if (!vacunaManual) {
      setVacunaForm(prev => ({
        ...prev,
        id_item: "",
        nombre_vacuna: "",
        duracion_meses: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validacion = validarFormularioVacuna(vacunaForm);
    if (!validacion.esValido) {
      setErrores(validacion.errores);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddVaccination({
        ...vacunaForm,
        id_mascota: mascotaId,
        duracion_meses: parseInt(vacunaForm.duracion_meses)
      });
      handleClose();
    } catch (error) {
      console.error("Error al guardar vacuna:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    const validacion = validarFormularioVacuna(vacunaForm);
    if (!validacion.esValido) {
      setErrores(validacion.errores);
      return;
    }

    setIsSubmitting(true);
    try {
      await onEditVaccination({
        ...vacunaForm,
        id_vacuna: vacunaSeleccionada.id_vacuna,
        duracion_meses: parseInt(vacunaForm.duracion_meses)
      });
      handleClose();
    } catch (error) {
      console.error("Error al actualizar vacuna:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setVacunaForm({
      nombre_vacuna: "",
      fecha_aplicacion: new Date().toISOString().split("T")[0],
      duracion_meses: "",
      observaciones: "",
      id_item: "",
    });
    setVacunaSeleccionada(null);
    setVacunaManual(false);
    setDuracionEditable(false);
    setErrores({});
    setIsVacunaDialogOpen(false);
    setIsEditarVacunaDialogOpen(false);
  };

  const handleEditVaccination = (vacuna) => {
    setVacunaSeleccionada(vacuna);
    setVacunaForm({
      nombre_vacuna: vacuna.nombre_vacuna,
      fecha_aplicacion: vacuna.fecha_aplicacion.split('T')[0],
      duracion_meses: vacuna.duracion_meses.toString(),
      observaciones: vacuna.observaciones || "",
      id_item: vacuna.id_item?.toString() || "",
    });
    setVacunaManual(true);
    setDuracionEditable(true);
    setIsEditarVacunaDialogOpen(true);
  };

  const getAlertIcon = (tipo) => {
    switch (tipo) {
      case "hoy":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "urgente":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "pronto":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getAlertColor = (tipo) => {
    switch (tipo) {
      case "hoy":
        return "bg-red-100 text-red-800 border-red-200";
      case "urgente":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "pronto":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  return (
    <>
      <InfoCard
        title="Próximas Vacunas"
        headerAction={
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsVacunaDialogOpen(true)}
          >
            <PlusCircle
              size={20}
              className="text-gray-500 hover:text-purple-700"
            />
          </Button>
        }
      >
        <div className="space-y-3">
          {proximasVacunas.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Syringe size={24} className="mx-auto mb-2 text-gray-300" />
              <p>No hay vacunas registradas</p>
            </div>
          )}
          {proximasVacunas.map((vac) => {
            const fechaProxima = new Date(vac.fecha_proxima);
            const hoy = new Date();
            const diff = Math.ceil(
              (fechaProxima - hoy) / (1000 * 60 * 60 * 24)
            );

            let color = "text-gray-600";
            let bgColor = "bg-gray-50";
            let aviso = "";
            let iconColor = "text-purple-500";

            switch (vac.estado) {
              case "vencida":
                color = "text-red-600 font-bold";
                bgColor = "bg-red-50 border-red-200";
                aviso = "¡Vencida!";
                iconColor = "text-red-500";
                break;
              case "muy_proxima":
                color = "text-orange-600 font-bold";
                bgColor = "bg-orange-50 border-orange-200";
                aviso = "¡Muy próxima!";
                iconColor = "text-orange-500";
                break;
              case "proxima":
                color = "text-yellow-600 font-semibold";
                bgColor = "bg-yellow-50 border-yellow-200";
                aviso = "Próxima";
                iconColor = "text-yellow-500";
                break;
              case "reciente":
                color = "text-green-600 font-semibold";
                bgColor = "bg-green-50 border-green-200";
                aviso = "Recién aplicada";
                iconColor = "text-green-500";
                break;
              default:
                color = "text-gray-600";
                bgColor = "bg-gray-50 border-gray-200";
                aviso = "Programada";
            }

            return (
              <div
                key={`${vac.id_vacuna_aplicada}-${vac.nombre_vacuna}-${vac.fecha_proxima}`}
                className={`p-3 rounded-lg border ${bgColor} transition-all duration-200 hover:shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Syringe size={16} className={`mr-3 ${iconColor}`} />
                    <div>
                      <span className="font-medium text-gray-800">
                        {vac.nombre_vacuna}
                      </span>
                      <p className="text-xs text-gray-500">
                        Aplicada:{" "}
                        {new Date(
                          vac.fecha_aplicacion
                        ).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${color}`}>
                        {fechaProxima.toLocaleDateString("es-ES")}
                      </div>
                      <div className={`text-xs ${color}`}>{aviso}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditVaccination(vac)}
                        className="h-6 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Edit size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteVaccination(vac.id_vacuna_aplicada)}
                        className="h-6 px-2 text-xs border-red-300 text-red-700 hover:bg-red-100"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </InfoCard>

      {/* Dialog para nueva vacuna */}
      <Dialog open={isVacunaDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-purple-800">
              Nueva Vacuna
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Registra una nueva vacuna aplicada al paciente.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Modo de entrada */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="vacuna_manual"
                  checked={vacunaManual}
                  onChange={handleManualToggle}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <Label htmlFor="vacuna_manual" className="text-gray-700 font-semibold">
                  Ingresar vacuna manualmente
                </Label>
              </div>

              {/* Selección de vacuna */}
              {!vacunaManual && (
                <div>
                  <Label
                    htmlFor="vacuna_item"
                    className="text-gray-700 font-semibold"
                  >
                    Vacuna <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="vacuna_item"
                    value={vacunaForm.id_item}
                    onChange={(e) => handleVacunaChange(e.target.value)}
                    required
                    className="mt-1 w-full h-12 px-3 border-2 border-purple-400 rounded-full focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar vacuna...</option>
                    {itemsVacunas.map((item) => (
                      <option key={item.id_item} value={item.id_item}>
                        {item.nombre} ({item.duracion_meses} meses)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Nombre de vacuna (manual) */}
              {vacunaManual && (
                <div>
                  <Label
                    htmlFor="nombre_vacuna"
                    className="text-gray-700 font-semibold"
                  >
                    Nombre de la Vacuna <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombre_vacuna"
                    value={vacunaForm.nombre_vacuna}
                    onChange={(e) => handleInputChange('nombre_vacuna', e.target.value)}
                    placeholder="Nombre de la vacuna"
                    required
                    className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                      errores.nombre_vacuna ? 'border-red-400' : 'border-purple-400'
                    }`}
                  />
                  {errores.nombre_vacuna && (
                    <p className="text-red-500 text-xs mt-1">{errores.nombre_vacuna}</p>
                  )}
                </div>
              )}

              {/* Fecha de aplicación */}
              <div>
                <Label
                  htmlFor="fecha_aplicacion"
                  className="text-gray-700 font-semibold"
                >
                  Fecha de Aplicación <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fecha_aplicacion"
                  type="date"
                  value={vacunaForm.fecha_aplicacion}
                  onChange={(e) => handleInputChange('fecha_aplicacion', e.target.value)}
                  required
                  className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                    errores.fecha_aplicacion ? 'border-red-400' : 'border-purple-400'
                  }`}
                />
                {errores.fecha_aplicacion && (
                  <p className="text-red-500 text-xs mt-1">{errores.fecha_aplicacion}</p>
                )}
              </div>

              {/* Duración */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Label
                    htmlFor="duracion_meses"
                    className="text-gray-700 font-semibold"
                  >
                    Duración (meses) <span className="text-red-500">*</span>
                  </Label>
                  {!vacunaManual && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDuracionEditable(!duracionEditable)}
                      className="text-xs"
                    >
                      {duracionEditable ? "Usar predeterminado" : "Editar"}
                    </Button>
                  )}
                </div>
                <Input
                  id="duracion_meses"
                  type="number"
                  value={vacunaForm.duracion_meses}
                  onChange={(e) => handleInputChange('duracion_meses', e.target.value)}
                  placeholder="Duración en meses"
                  required
                  min="1"
                  disabled={!vacunaManual && !duracionEditable}
                  className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                    errores.duracion_meses ? 'border-red-400' : 'border-purple-400'
                  }`}
                />
                {errores.duracion_meses && (
                  <p className="text-red-500 text-xs mt-1">{errores.duracion_meses}</p>
                )}
              </div>

              {/* Observaciones */}
              <div>
                <Label
                  htmlFor="observaciones"
                  className="text-gray-700 font-semibold"
                >
                  Observaciones
                </Label>
                <textarea
                  id="observaciones"
                  value={vacunaForm.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  placeholder="Observaciones adicionales"
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border-2 border-purple-400 rounded-lg focus:ring-purple-500 focus:border-transparent resize-none"
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
                {isSubmitting ? "Guardando..." : "Guardar Vacuna"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar vacuna */}
      <Dialog open={isEditarVacunaDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-purple-800">
              Editar Vacuna
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Modifica los datos de la vacuna.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Nombre de vacuna */}
              <div>
                <Label
                  htmlFor="edit_nombre_vacuna"
                  className="text-gray-700 font-semibold"
                >
                  Nombre de la Vacuna <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit_nombre_vacuna"
                  value={vacunaForm.nombre_vacuna}
                  onChange={(e) => handleInputChange('nombre_vacuna', e.target.value)}
                  placeholder="Nombre de la vacuna"
                  required
                  className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                    errores.nombre_vacuna ? 'border-red-400' : 'border-purple-400'
                  }`}
                />
                {errores.nombre_vacuna && (
                  <p className="text-red-500 text-xs mt-1">{errores.nombre_vacuna}</p>
                )}
              </div>

              {/* Fecha de aplicación */}
              <div>
                <Label
                  htmlFor="edit_fecha_aplicacion"
                  className="text-gray-700 font-semibold"
                >
                  Fecha de Aplicación <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit_fecha_aplicacion"
                  type="date"
                  value={vacunaForm.fecha_aplicacion}
                  onChange={(e) => handleInputChange('fecha_aplicacion', e.target.value)}
                  required
                  className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                    errores.fecha_aplicacion ? 'border-red-400' : 'border-purple-400'
                  }`}
                />
                {errores.fecha_aplicacion && (
                  <p className="text-red-500 text-xs mt-1">{errores.fecha_aplicacion}</p>
                )}
              </div>

              {/* Duración */}
              <div>
                <Label
                  htmlFor="edit_duracion_meses"
                  className="text-gray-700 font-semibold"
                >
                  Duración (meses) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit_duracion_meses"
                  type="number"
                  value={vacunaForm.duracion_meses}
                  onChange={(e) => handleInputChange('duracion_meses', e.target.value)}
                  placeholder="Duración en meses"
                  required
                  min="1"
                  className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                    errores.duracion_meses ? 'border-red-400' : 'border-purple-400'
                  }`}
                />
                {errores.duracion_meses && (
                  <p className="text-red-500 text-xs mt-1">{errores.duracion_meses}</p>
                )}
              </div>

              {/* Observaciones */}
              <div>
                <Label
                  htmlFor="edit_observaciones"
                  className="text-gray-700 font-semibold"
                >
                  Observaciones
                </Label>
                <textarea
                  id="edit_observaciones"
                  value={vacunaForm.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  placeholder="Observaciones adicionales"
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border-2 border-purple-400 rounded-lg focus:ring-purple-500 focus:border-transparent resize-none"
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
                {isSubmitting ? "Actualizando..." : "Actualizar Vacuna"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
