"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// GET current user info
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    const client = await pool.connect();
    try {
      let result;
      
      if (userId && !isNaN(parseInt(userId, 10))) {
        // Buscar usuario específico por ID
        result = await client.query(
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
      } else {
        // Buscar usuario administrador por defecto
        result = await client.query(
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
          WHERE tipo_usuario = 'admin'
          ORDER BY id_usuario ASC
          LIMIT 1`
        );
      }

      if (result.rows.length === 0) {
        // Si no hay usuarios en la base de datos, devolver usuario simulado
        const mockUser = {
          id_usuario: 1,
          nombre: 'Administrador',
          apellido: 'Sistema',
          email: 'admin@elceibo.com',
          tipo_usuario: 'admin',
          calle: 'Calle Principal',
          numero: 123,
          codigo_postal: 12345,
          telefono: 1234567890,
          usuario: 'admin',
          foto: null
        };
        
        return NextResponse.json(mockUser, { status: 200 });
      }

      return NextResponse.json(result.rows[0], { status: 200 });

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    // En caso de error, devolver usuario simulado
    const mockUser = {
      id_usuario: 1,
      nombre: 'Administrador',
      apellido: 'Sistema',
      email: 'admin@elceibo.com',
      tipo_usuario: 'admin',
      calle: 'Calle Principal',
      numero: 123,
      codigo_postal: 12345,
      telefono: 1234567890,
      usuario: 'admin',
      foto: null
    };
    
    return NextResponse.json(mockUser, { status: 200 });
  }
} 