import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren autenticación
const protectedRoutes = [
  '/',
  '/dashboard',
  '/usuarios',
  '/perfil',
  '/mascota',
  '/Ventana'
];

// Rutas públicas (no requieren autenticación)
const publicRoutes = [
  '/login',
  '/redirect'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar si la ruta está protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Si es una ruta protegida, verificar autenticación
  if (isProtectedRoute) {
    // Verificar si hay token de autenticación en las cookies
    const authToken = request.cookies.get('auth-token')?.value;
    const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';
    
    if (!authToken && !isAuthenticated) {
      // Redirigir al login si no está autenticado
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Si es una ruta pública y está autenticado, redirigir al dashboard
  if (isPublicRoute && pathname === '/login') {
    const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
