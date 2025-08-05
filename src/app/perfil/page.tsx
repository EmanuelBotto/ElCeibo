"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { User, Edit, Camera, Mail, Phone, MapPin, Shield } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function PerfilPage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    calle: '',
    numero: '',
    codigo_postal: '',
    telefono: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        calle: user.calle || '',
        numero: user.numero?.toString() || '',
        codigo_postal: user.codigo_postal?.toString() || '',
        telefono: user.telefono?.toString() || ''
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Usuario no encontrado');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_usuario: user.id_usuario,
          ...formData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar perfil');
      }

      toast.success('Perfil actualizado exitosamente');
      setIsEditing(false);
      
      // Actualizar el contexto de autenticación con los nuevos datos
      updateUser(data.user);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errorMessage);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-8">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-10 w-full max-w-4xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold text-purple-800 tracking-tight mb-2">Mi Perfil</h1>
              <p className="text-gray-600 text-lg">Gestiona tu información personal</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-2"
                variant={isEditing ? "outline" : "default"}
              >
                <Edit className="mr-2" size={16} />
                {isEditing ? 'Cancelar' : 'Editar Perfil'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Panel izquierdo - Información del usuario */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-full">
                <div className="bg-[#a06ba5] px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Información Personal</h2>
                </div>
                
                <div className="p-6">
                  {/* Foto de perfil */}
                  <div className="text-center mb-6">
                    <div className="relative inline-block">
                      <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        {user.foto ? (
                          <img 
                            src={user.foto} 
                            alt="Foto de perfil" 
                            className="w-32 h-32 rounded-full object-cover"
                          />
                        ) : (
                          <User className="text-purple-600" size={48} />
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                      >
                        <Camera size={16} />
                      </Button>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {user.nombre} {user.apellido}
                    </h3>
                    <p className="text-gray-600">{user.email}</p>
                  </div>

                  {/* Información de contacto */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="text-purple-600" size={16} />
                      <span className="text-gray-700">{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="text-purple-600" size={16} />
                      <span className="text-gray-700">{user.telefono}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="text-purple-600" size={16} />
                      <span className="text-gray-700">
                        {user.calle} {user.numero}, CP {user.codigo_postal}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="text-purple-600" size={16} />
                      <span className="text-gray-700 capitalize">{user.tipo_usuario}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel derecho - Formulario de edición */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-full">
                <div className="bg-[#a06ba5] px-6 py-4">
                  <h2 className="text-xl font-bold text-white">
                    {isEditing ? 'Editar Información' : 'Detalles del Perfil'}
                  </h2>
                </div>
                
                <div className="p-6">
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nombre" className="text-gray-700 font-semibold">Nombre</Label>
                          <Input 
                            id="nombre" 
                            name="nombre" 
                            value={formData.nombre} 
                            onChange={handleInputChange} 
                            required 
                            className="mt-1 h-12"
                          />
                        </div>
                        <div>
                          <Label htmlFor="apellido" className="text-gray-700 font-semibold">Apellido</Label>
                          <Input 
                            id="apellido" 
                            name="apellido" 
                            value={formData.apellido} 
                            onChange={handleInputChange} 
                            required 
                            className="mt-1 h-12"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email" 
                          value={formData.email} 
                          onChange={handleInputChange} 
                          required 
                          className="mt-1 h-12"
                        />
                      </div>
                      <div>
                        <Label htmlFor="calle" className="text-gray-700 font-semibold">Calle</Label>
                        <Input 
                          id="calle" 
                          name="calle" 
                          value={formData.calle} 
                          onChange={handleInputChange} 
                          required 
                          className="mt-1 h-12"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="numero" className="text-gray-700 font-semibold">Número</Label>
                          <Input 
                            id="numero" 
                            name="numero" 
                            type="number" 
                            value={formData.numero} 
                            onChange={handleInputChange} 
                            required 
                            className="mt-1 h-12"
                          />
                        </div>
                        <div>
                          <Label htmlFor="codigo_postal" className="text-gray-700 font-semibold">Código Postal</Label>
                          <Input 
                            id="codigo_postal" 
                            name="codigo_postal" 
                            type="number" 
                            value={formData.codigo_postal} 
                            onChange={handleInputChange} 
                            required 
                            className="mt-1 h-12"
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefono" className="text-gray-700 font-semibold">Teléfono</Label>
                          <Input 
                            id="telefono" 
                            name="telefono" 
                            type="tel" 
                            value={formData.telefono} 
                            onChange={handleInputChange} 
                            required 
                            className="mt-1 h-12"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          Guardar Cambios
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Nombre</h4>
                          <p className="text-gray-600">{user.nombre}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Apellido</h4>
                          <p className="text-gray-600">{user.apellido}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Email</h4>
                          <p className="text-gray-600">{user.email}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Teléfono</h4>
                          <p className="text-gray-600">{user.telefono}</p>
                        </div>
                        <div className="col-span-2">
                          <h4 className="font-semibold text-gray-700 mb-2">Dirección</h4>
                          <p className="text-gray-600">
                            {user.calle} {user.numero}, CP {user.codigo_postal}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Tipo de Usuario</h4>
                          <p className="text-gray-600 capitalize">{user.tipo_usuario}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Usuario</h4>
                          <p className="text-gray-600">{user.usuario}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 