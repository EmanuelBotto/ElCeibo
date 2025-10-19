// Sistema de permisos por tipo de usuario
export const PERMISSIONS = {
  // Permisos básicos para empleados
  EMPLEADO: [
    'reportes:generar',
    'productos:buscar',
    'caja:gestionar'
  ],
  
  // Permisos de veterinario (incluye todo lo de empleado + más)
  VETERINARIO: [
    'reportes:generar',
    'productos:buscar', 
    'caja:gestionar',
    'fichas:gestionar',
    'items:gestionar'
  ],
  
  // Permisos de administrador (incluye todo)
  ADMIN: [
    'reportes:generar',
    'productos:buscar',
    'caja:gestionar', 
    'fichas:gestionar',
    'items:gestionar',
    'usuarios:gestionar'
  ]
};

// Función para verificar si un usuario tiene un permiso específico
export const hasPermission = (userType, permission) => {
  if (!userType || !PERMISSIONS[userType.toUpperCase()]) {
    return false;
  }
  
  return PERMISSIONS[userType.toUpperCase()].includes(permission);
};

// Función para verificar múltiples permisos
export const hasAnyPermission = (userType, permissions) => {
  return permissions.some(permission => hasPermission(userType, permission));
};

// Función para verificar todos los permisos
export const hasAllPermissions = (userType, permissions) => {
  return permissions.every(permission => hasPermission(userType, permission));
};

// Función para obtener todos los permisos de un usuario
export const getUserPermissions = (userType) => {
  if (!userType || !PERMISSIONS[userType.toUpperCase()]) {
    return [];
  }
  
  return PERMISSIONS[userType.toUpperCase()];
};
