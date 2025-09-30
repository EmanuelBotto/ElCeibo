"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from './ImageUpload';
import ImageDisplay from './ImageDisplay';

interface UserFormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  foto: string;
  tipo_usuario: string;
  password: string;
}

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => Promise<void>;
  isEditing?: boolean;
}

export default function UserForm({ initialData, onSubmit, isEditing = false }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    nombre: initialData?.nombre || '',
    apellido: initialData?.apellido || '',
    email: initialData?.email || '',
    telefono: initialData?.telefono || '',
    direccion: initialData?.direccion || '',
    foto: initialData?.foto || '',
    tipo_usuario: initialData?.tipo_usuario || 'asistente',
    password: initialData?.password || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </h2>
            <p className="text-purple-100">
              {isEditing ? 'Modifica la información del usuario' : 'Completa la información del usuario'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-b-xl shadow-lg border border-gray-200">
        <div className="p-6 space-y-8">
          {/* Información Personal */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="nombre" className="text-sm font-semibold text-gray-700 mb-2 block">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Nombre del usuario"
                  required
                  className="h-12 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="apellido" className="text-sm font-semibold text-gray-700 mb-2 block">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => handleInputChange('apellido', e.target.value)}
                  placeholder="Apellido del usuario"
                  required
                  className="h-12 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  required
                  className="h-12 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="telefono" className="text-sm font-semibold text-gray-700 mb-2 block">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  placeholder="123456789"
                  className="h-12 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="direccion" className="text-sm font-semibold text-gray-700 mb-2 block">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  placeholder="Dirección completa"
                  className="h-12 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Tipo de Usuario */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Tipo de Usuario *
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer group">
                <input
                  type="radio"
                  id="admin"
                  name="tipo_usuario"
                  value="admin"
                  checked={formData.tipo_usuario === 'admin'}
                  onChange={(e) => handleInputChange('tipo_usuario', e.target.value)}
                  className="w-5 h-5 text-purple-600 border-2 border-purple-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                />
                <div className="flex-1">
                  <Label htmlFor="admin" className="text-sm font-semibold text-gray-700 cursor-pointer group-hover:text-purple-700">
                    Administrador
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">Acceso completo al sistema</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer group">
                <input
                  type="radio"
                  id="veterinario"
                  name="tipo_usuario"
                  value="veterinario"
                  checked={formData.tipo_usuario === 'veterinario'}
                  onChange={(e) => handleInputChange('tipo_usuario', e.target.value)}
                  className="w-5 h-5 text-purple-600 border-2 border-purple-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                />
                <div className="flex-1">
                  <Label htmlFor="veterinario" className="text-sm font-semibold text-gray-700 cursor-pointer group-hover:text-purple-700">
                    Veterinario
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">Acceso a fichas médicas y tratamientos</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer group">
                <input
                  type="radio"
                  id="asistente"
                  name="tipo_usuario"
                  value="asistente"
                  checked={formData.tipo_usuario === 'asistente'}
                  onChange={(e) => handleInputChange('tipo_usuario', e.target.value)}
                  className="w-5 h-5 text-purple-600 border-2 border-purple-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                />
                <div className="flex-1">
                  <Label htmlFor="asistente" className="text-sm font-semibold text-gray-700 cursor-pointer group-hover:text-purple-700">
                    Asistente
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">Soporte en consultas y citas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer group">
                <input
                  type="radio"
                  id="recepcionista"
                  name="tipo_usuario"
                  value="recepcionista"
                  checked={formData.tipo_usuario === 'recepcionista'}
                  onChange={(e) => handleInputChange('tipo_usuario', e.target.value)}
                  className="w-5 h-5 text-purple-600 border-2 border-purple-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                />
                <div className="flex-1">
                  <Label htmlFor="recepcionista" className="text-sm font-semibold text-gray-700 cursor-pointer group-hover:text-purple-700">
                    Recepcionista
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">Gestión de citas y clientes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Seguridad y Foto */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                Seguridad
              </h3>
              <div>
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 mb-2 block">
                  {isEditing ? 'Nueva Contraseña' : 'Contraseña *'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={isEditing ? 'Dejar en blanco para no cambiar' : 'Contraseña segura'}
                  required={!isEditing}
                  className="h-12 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                {isEditing && (
                  <p className="text-xs text-gray-500 mt-2">Deja en blanco si no quieres cambiar la contraseña</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Foto de Perfil
              </h3>
              <ImageUpload
                onImageChange={(base64) => handleInputChange('foto', base64)}
                currentImage={formData.foto}
                label=""
              />
              {formData.foto && (
                <div className="mt-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Vista Previa</Label>
                  <ImageDisplay
                    src={formData.foto}
                    alt="Foto del usuario"
                    className="w-20 h-20 rounded-full border-2 border-purple-200"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botón de envío */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Procesando...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}