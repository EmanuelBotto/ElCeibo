"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
        </h2>
        <p className="text-gray-600">
          {isEditing ? 'Modifica la información del usuario' : 'Completa la información del usuario'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              placeholder="Nombre del usuario"
              required
            />
          </div>
          <div>
            <Label htmlFor="apellido">Apellido *</Label>
            <Input
              id="apellido"
              value={formData.apellido}
              onChange={(e) => handleInputChange('apellido', e.target.value)}
              placeholder="Apellido del usuario"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={formData.telefono}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
              placeholder="123456789"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="direccion">Dirección</Label>
          <Input
            id="direccion"
            value={formData.direccion}
            onChange={(e) => handleInputChange('direccion', e.target.value)}
            placeholder="Dirección completa"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tipo_usuario">Tipo de Usuario *</Label>
            <Select
              value={formData.tipo_usuario}
              onValueChange={(value) => handleInputChange('tipo_usuario', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="veterinario">Veterinario</SelectItem>
                <SelectItem value="asistente">Asistente</SelectItem>
                <SelectItem value="recepcionista">Recepcionista</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="password">
              {isEditing ? 'Nueva Contraseña' : 'Contraseña *'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder={isEditing ? 'Dejar en blanco para no cambiar' : 'Contraseña'}
              required={!isEditing}
            />
          </div>
        </div>

        {/* Subida de imagen */}
        <ImageUpload
          onImageChange={(base64) => handleInputChange('foto', base64)}
          currentImage={formData.foto}
          label="Foto del Usuario"
        />

        {/* Vista previa de la imagen */}
        {formData.foto && (
          <div>
            <Label>Vista Previa</Label>
            <ImageDisplay
              src={formData.foto}
              alt="Foto del usuario"
              className="mt-2"
            />
          </div>
        )}

        {/* Botón de envío */}
        <Button 
          type="submit" 
          className="w-full bg-[#a06ba5] hover:bg-[#8a5a8f]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Guardando...</span>
            </div>
          ) : (
            <span>{isEditing ? 'Actualizar Usuario' : 'Guardar Usuario'}</span>
          )}
        </Button>
      </form>
    </div>
  );
}
