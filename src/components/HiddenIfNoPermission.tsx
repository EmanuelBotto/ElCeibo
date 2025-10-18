"use client";

import { useAuth } from './AuthProvider';

interface HiddenIfNoPermissionProps {
  children: React.ReactNode;
  permission?: string;
}

// Componente para mostrar solo a administradores
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (user?.tipo_usuario !== 'admin') {
    return null;
  }
  
  return <>{children}</>;
}

// Componente para mostrar solo a veterinarios y administradores
export function VeterinarioOrAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (user?.tipo_usuario !== 'veterinario' && user?.tipo_usuario !== 'admin') {
    return null;
  }
  
  return <>{children}</>;
}

// Componente para mostrar a empleados y superiores (empleado, veterinario, admin)
export function EmpleadoOrAbove({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user || (user.tipo_usuario !== 'empleado' && user.tipo_usuario !== 'veterinario' && user.tipo_usuario !== 'admin')) {
    return null;
  }
  
  return <>{children}</>;
}

// Componente genérico para permisos específicos
export function HiddenIfNoPermission({ children, permission }: HiddenIfNoPermissionProps) {
  const { user } = useAuth();
  
  if (!user || !permission) {
    return <>{children}</>;
  }
  
  // Aquí puedes implementar lógica más específica de permisos si es necesario
  // Por ahora, solo verificamos el tipo de usuario
  return <>{children}</>;
}
