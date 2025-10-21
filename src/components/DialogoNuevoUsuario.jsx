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
  DialogFooter,
} from "@/components/ui/dialog";
import { Camera, Eye, EyeOff } from "lucide-react";

export default function DialogoNuevoUsuario({ 
  isOpen, 
  onClose, 
  onSubmit 
}) {
  const [formData, setFormData] = useState({
    usuario: "",
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    calle: "",
    numero: "",
    codigo_postal: "",
    tipo_usuario: "admin",
    password: "",
    foto: null,
  });
  const [errores, setErrores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const validateForm = () => {
    const newErrores = {};
    
    if (!formData.nombre?.trim()) {
      newErrores.nombre = "El nombre es requerido";
    }
    
    if (!formData.apellido?.trim()) {
      newErrores.apellido = "El apellido es requerido";
    }
    
    if (!formData.email?.trim()) {
      newErrores.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrores.email = "El formato del email no es válido";
    }
    
    if (!formData.password?.trim()) {
      newErrores.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrores.password = "La contraseña debe tener al menos 6 caracteres";
    }
    
    if (!formData.usuario?.trim()) {
      newErrores.usuario = "El usuario es requerido";
    }
    
    if (!formData.tipo_usuario?.trim()) {
      newErrores.tipo_usuario = "El tipo de usuario es requerido";
    }
    
    if (formData.telefono && isNaN(formData.telefono)) {
      newErrores.telefono = "El teléfono debe ser un número válido";
    }
    
    if (formData.numero && isNaN(formData.numero)) {
      newErrores.numero = "El número debe ser un número válido";
    }
    
    if (formData.codigo_postal && isNaN(formData.codigo_postal)) {
      newErrores.codigo_postal = "El código postal debe ser un número válido";
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
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error("Error al crear usuario:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      usuario: "",
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      calle: "",
      numero: "",
      codigo_postal: "",
      tipo_usuario: "admin",
      password: "",
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
            Agregar Nuevo Usuario
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-8">
            {/* Foto del usuario - Lado izquierdo */}
            <div className="flex-shrink-0">
              <div className="flex flex-col items-center">
                <Label className="text-gray-700 font-semibold mb-4">
                  Foto del usuario
                </Label>
                <div 
                  className="w-40 h-40 bg-purple-100 rounded-full flex items-center justify-center cursor-pointer group hover:shadow-lg transition-all duration-200 overflow-hidden"
                  onClick={() => document.getElementById('foto_usuario').click()}
                  title="Hacer click para seleccionar foto"
                >
                  <input
                    id="foto_usuario"
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
                  onClick={() => document.getElementById('foto_usuario').click()}
                  className="mt-3 text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Seleccionar Foto
                </Button>
              </div>
            </div>

            {/* Campos del formulario - Lado derecho */}
            <div className="flex-1 space-y-4">
              {/* Primera fila - Usuario y Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="usuario"
                    className="text-gray-700 font-semibold"
                  >
                    Usuario <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="usuario"
                    value={formData.usuario || ''}
                    onChange={(e) => handleInputChange('usuario', e.target.value)} 
                    placeholder="Nombre de usuario"
                    required
                    className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                      errores.usuario ? 'border-red-400' : 'border-purple-400'
                    }`}
                  />
                  {errores.usuario && (
                    <p className="text-red-500 text-xs mt-1">{errores.usuario}</p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="tipo_usuario"
                    className="text-gray-700 font-semibold"
                  >
                    Tipo de Usuario <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="tipo_usuario"
                    value={formData.tipo_usuario || ''}
                    onChange={(e) => handleInputChange('tipo_usuario', e.target.value)}
                    required
                    className={`mt-1 w-full h-12 px-3 border-2 rounded-full focus:ring-purple-500 focus:border-transparent ${
                      errores.tipo_usuario ? 'border-red-400' : 'border-purple-400'
                    }`}
                  >
                    <option value="">Seleccionar</option>
                    <option value="admin">Administrador</option>
                    <option value="veterinario">Veterinario</option>
                    <option value="empleado">Empleado</option>
                  </select>
                  {errores.tipo_usuario && (
                    <p className="text-red-500 text-xs mt-1">{errores.tipo_usuario}</p>
                  )}
                </div>
              </div>

              {/* Segunda fila - Nombre y Apellido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="nombre"
                    className="text-gray-700 font-semibold"
                  >
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre || ''}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Nombre del usuario"
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
                    htmlFor="apellido"
                    className="text-gray-700 font-semibold"
                  >
                    Apellido <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="apellido"
                    value={formData.apellido || ''}
                    onChange={(e) => handleInputChange('apellido', e.target.value)}
                    placeholder="Apellido del usuario"
                    required
                    className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                      errores.apellido ? 'border-red-400' : 'border-purple-400'
                    }`}
                  />
                  {errores.apellido && (
                    <p className="text-red-500 text-xs mt-1">{errores.apellido}</p>
                  )}
                </div>
              </div>

              {/* Tercera fila - Email y Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="email"
                    className="text-gray-700 font-semibold"
                  >
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@ejemplo.com"
                    required
                    className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                      errores.email ? 'border-red-400' : 'border-purple-400'
                    }`}
                  />
                  {errores.email && (
                    <p className="text-red-500 text-xs mt-1">{errores.email}</p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="telefono"
                    className="text-gray-700 font-semibold"
                  >
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono || ''}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    placeholder="Número de teléfono"
                    className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                      errores.telefono ? 'border-red-400' : 'border-purple-400'
                    }`}
                  />
                  {errores.telefono && (
                    <p className="text-red-500 text-xs mt-1">{errores.telefono}</p>
                  )}
                </div>
              </div>

              {/* Cuarta fila - Dirección */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label
                    htmlFor="calle"
                    className="text-gray-700 font-semibold"
                  >
                    Calle
                  </Label>
                  <Input
                    id="calle"
                    value={formData.calle || ''}
                    onChange={(e) => handleInputChange('calle', e.target.value)}
                    placeholder="Nombre de la calle"
                    className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="numero"
                    className="text-gray-700 font-semibold"
                  >
                    Número
                  </Label>
                  <Input
                    id="numero"
                    type="number"
                    value={formData.numero || ''}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                    placeholder="Número"
                    className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                      errores.numero ? 'border-red-400' : 'border-purple-400'
                    }`}
                  />
                  {errores.numero && (
                    <p className="text-red-500 text-xs mt-1">{errores.numero}</p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="codigo_postal"
                    className="text-gray-700 font-semibold"
                  >
                    Código Postal
                  </Label>
                  <Input
                    id="codigo_postal"
                    type="number"
                    value={formData.codigo_postal || ''}
                    onChange={(e) => handleInputChange('codigo_postal', e.target.value)}
                    placeholder="CP"
                    className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 ${
                      errores.codigo_postal ? 'border-red-400' : 'border-purple-400'
                    }`}
                  />
                  {errores.codigo_postal && (
                    <p className="text-red-500 text-xs mt-1">{errores.codigo_postal}</p>
                  )}
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <Label
                  htmlFor="password"
                  className="text-gray-700 font-semibold"
                >
                  Contraseña <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password || ''}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Contraseña del usuario"
                    required
                    className={`mt-1 h-12 rounded-full border-2 focus:ring-purple-500 pr-12 ${
                      errores.password ? 'border-red-400' : 'border-purple-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errores.password && (
                  <p className="text-red-500 text-xs mt-1">{errores.password}</p>
                )}
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
              {isSubmitting ? "Creando..." : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
