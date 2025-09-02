"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    usuario: '',
    contrasenia: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el login');
      }

      // Usar el contexto de autenticación
      login(data.user);

      toast.success('¡Bienvenido! Login exitoso');
      
      // Redirigir al dashboard principal
      router.push('/');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-10 w-full max-w-md">
        {/* Header */}
                 <div className="text-center mb-8">
           <div className="flex items-center justify-center mb-4">
             <Logo size="lg" className="mr-2" />
             <h1 className="text-3xl font-bold text-purple-800">El Ceibo</h1>
           </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Iniciar Sesión</h2>
          <p className="text-gray-600">Accede a tu cuenta para continuar</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo Usuario */}
          <div className="space-y-2">
            <Label htmlFor="usuario" className="text-gray-700 font-semibold">
              Usuario
            </Label>
            <div className="relative">
              <Input
                id="usuario"
                name="usuario"
                type="text"
                value={formData.usuario}
                onChange={handleInputChange}
                placeholder="Ingresa tu usuario"
                required
                className="pl-10 h-12 border-2 border-gray-300 focus:border-purple-400"
                disabled={isLoading}
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="contrasenia" className="text-gray-700 font-semibold">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="contrasenia"
                name="contrasenia"
                type={showPassword ? 'text' : 'password'}
                value={formData.contrasenia}
                onChange={handleInputChange}
                placeholder="Ingresa tu contraseña"
                required
                className="pl-10 pr-10 h-12 border-2 border-gray-300 focus:border-purple-400"
                disabled={isLoading}
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Botón de Login */}
          <Button
            type="submit"
            className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Iniciando sesión...
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Sistema de Gestión Veterinaria
          </p>
        </div>
      </div>
    </div>
  );
} 