"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  tipo_usuario: string;
  calle: string;
  numero: number;
  codigo_postal: number;
  telefono: number;
  usuario: string;
  foto?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Usuario simulado para app pública (sin autenticación)
  const mockUser: User = {
    id_usuario: 1,
    usuario: 'admin',
    nombre: 'Administrador',
    apellido: 'Sistema',
    email: 'admin@elceibo.com',
    tipo_usuario: 'admin',
    calle: 'Calle Principal',
    numero: 123,
    codigo_postal: 12345,
    telefono: 1234567890,
    foto: undefined
  };

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // NO recordar usuario, siempre requiere login
    // Simular un pequeño delay para evitar problemas de hidratación
    const timer = setTimeout(() => {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    // No guardar en localStorage para mayor seguridad
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // Limpiar localStorage si existe
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    router.push('/login');
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    // No guardar en localStorage para mayor seguridad
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 