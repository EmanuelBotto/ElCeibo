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
    // Cargar usuario desde localStorage o usar mockUser como fallback
    const loadUser = async () => {
      try {
        // Intentar cargar desde localStorage primero
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Si no hay usuario guardado, intentar cargar desde la API
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            // Fallback al usuario simulado
            setUser(mockUser);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
        // Fallback al usuario simulado
        setUser(mockUser);
        setIsAuthenticated(true);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    router.push('/login');
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
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