"use server";

import { NextResponse } from 'next/server';

// POST logout
export async function POST() {
  try {
    // Crear respuesta de logout
    const response = NextResponse.json({
      message: 'Logout exitoso'
    }, { status: 200 });

    // Limpiar cookies
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // Expirar inmediatamente
    });

    response.cookies.set('isAuthenticated', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // Expirar inmediatamente
    });

    return response;
  } catch (err) {
    console.error('Error en logout:', err);
    return NextResponse.json({ 
      error: 'Error en el servidor: ' + err.message 
    }, { status: 500 });
  }
}
