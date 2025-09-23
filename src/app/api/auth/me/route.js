"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// GET current user info
export async function GET(request) {
  try {
    // Obtener el ID del usuario desde los parámetros de la URL
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ 
        error: 'ID de usuario requerido' 
      }, { status: 400 });
    }

    // Verificar si hay cookies de autenticación (opcional para compatibilidad)
    const authToken = request.cookies.get('auth-token');
    const isAuthenticated = request.cookies.get('isAuthenticated');

    // Si no hay cookies, permitir acceso con ID válido (para compatibilidad con localStorage)
    if (!authToken || !isAuthenticated) {
      // Solo verificar que el ID sea numérico
      if (isNaN(parseInt(userId, 10))) {
        return NextResponse.json({ 
          error: 'ID de usuario inválido' 
        }, { status: 400 });
      }
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          id_usuario,
          nombre,
          apellido,
          email,
          tipo_usuario,
          calle,
          numero,
          codigo_postal,
          telefono,
          usuario,
          foto
        FROM usuario 
        WHERE id_usuario = $1`,
        [parseInt(userId, 10)]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Usuario no encontrado' 
        }, { status: 404 });
      }

      return NextResponse.json({
        user: result.rows[0]
      }, { status: 200 });

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    return NextResponse.json({ 
      error: 'Error en el servidor: ' + err.message 
    }, { status: 500 });
  }
} 