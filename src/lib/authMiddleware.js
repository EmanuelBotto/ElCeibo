import { hasPermission } from './permisos';

// Middleware para verificar permisos en rutas de API
export const requirePermission = (permission) => {
  return async (request, user) => {
    if (!user) {
      return {
        error: 'Usuario no autenticado',
        status: 401
      };
    }

    if (!hasPermission(user.tipo_usuario, permission)) {
      return {
        error: 'No tienes permisos para realizar esta acción',
        status: 403
      };
    }

    return null; // No hay error, el usuario tiene permisos
  };
};

// Middleware para verificar múltiples permisos (cualquiera)
export const requireAnyPermission = (permissions) => {
  return async (request, user) => {
    if (!user) {
      return {
        error: 'Usuario no autenticado',
        status: 401
      };
    }

    const hasAny = permissions.some(permission => hasPermission(user.tipo_usuario, permission));
    
    if (!hasAny) {
      return {
        error: 'No tienes permisos para realizar esta acción',
        status: 403
      };
    }

    return null;
  };
};

// Middleware para verificar que el usuario sea administrador
export const requireAdmin = () => {
  return async (request, user) => {
    if (!user) {
      return {
        error: 'Usuario no autenticado',
        status: 401
      };
    }

    if (user.tipo_usuario !== 'admin') {
      return {
        error: 'Solo los administradores pueden realizar esta acción',
        status: 403
      };
    }

    return null;
  };
};

// Función para obtener el usuario desde el token/sesión
export const getCurrentUser = async (request) => {
  try {
    // Aquí implementarías la lógica para obtener el usuario actual
    // desde el token JWT, sesión, etc.
    // Por ahora, asumimos que viene en los headers o se pasa como parámetro
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return null;
    }

    // Implementar lógica de verificación de token aquí
    // Por ahora retornamos null para que se implemente según tu sistema de auth
    return null;
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return null;
  }
};
