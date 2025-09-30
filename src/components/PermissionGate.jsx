'use client';

import { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import { hasPermission } from '../lib/permissions';

// Componente para controlar el acceso basado en permisos
export default function PermissionGate({ 
  permission, 
  children, 
  fallback = null,
  userType = null,
  hide = false // Si es true, no renderiza nada si no tiene permisos
}) {
  const { user } = useContext(AuthContext);
  
  // Usar el tipo de usuario pasado como prop o el del contexto
  const userTypeToCheck = userType || user?.tipo_usuario;
  
  // Verificar si el usuario tiene el permiso requerido
  const hasRequiredPermission = hasPermission(userTypeToCheck, permission);
  
  // Si no tiene permisos y hide es true, no renderizar nada
  if (!hasRequiredPermission && hide) {
    return null;
  }
  
  // Si tiene permisos, mostrar el contenido, sino mostrar el fallback
  return hasRequiredPermission ? children : fallback;
}

// Hook para verificar permisos en componentes
export function usePermissions() {
  const { user } = useContext(AuthContext);
  
  const checkPermission = (permission) => {
    return hasPermission(user?.tipo_usuario, permission);
  };
  
  const checkAnyPermission = (permissions) => {
    return permissions.some(permission => checkPermission(permission));
  };
  
  const checkAllPermissions = (permissions) => {
    return permissions.every(permission => checkPermission(permission));
  };
  
  return {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    userType: user?.tipo_usuario,
    isAdmin: user?.tipo_usuario === 'admin',
    isVeterinario: user?.tipo_usuario === 'veterinario',
    isEmpleado: user?.tipo_usuario === 'empleado'
  };
}
