'use client';

import PermissionGate from './PermissionGate';

// Componente que oculta completamente el contenido si no tiene permisos
export default function HiddenIfNoPermission({ 
  permission, 
  children, 
  userType = null 
}) {
  return (
    <PermissionGate 
      permission={permission} 
      userType={userType}
      hide={true}
    >
      {children}
    </PermissionGate>
  );
}

// Componente para mostrar solo a administradores
export function AdminOnly({ children, userType = null }) {
  return (
    <HiddenIfNoPermission 
      permission="usuarios:gestionar" 
      userType={userType}
    >
      {children}
    </HiddenIfNoPermission>
  );
}

// Componente para mostrar solo a veterinarios y administradores
export function VeterinarioOrAdmin({ children, userType = null }) {
  return (
    <HiddenIfNoPermission 
      permission="fichas:gestionar" 
      userType={userType}
    >
      {children}
    </HiddenIfNoPermission>
  );
}

// Componente para mostrar solo a empleados, veterinarios y administradores
export function EmpleadoOrAbove({ children, userType = null }) {
  return (
    <HiddenIfNoPermission 
      permission="reportes:generar" 
      userType={userType}
    >
      {children}
    </HiddenIfNoPermission>
  );
}
