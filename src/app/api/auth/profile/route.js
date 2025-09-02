"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// PUT update user profile
export async function PUT(request) {
  try {
    const client = await pool.connect();
    try {
      const body = await request.json();
      const {
        id_usuario,
        nombre,
        apellido,
        email,
        calle,
        numero,
        codigo_postal,
        telefono
      } = body;

      if (!id_usuario) {
        return NextResponse.json({ 
          error: 'ID de usuario requerido' 
        }, { status: 400 });
      }

      if (!nombre?.trim() || !apellido?.trim() || !email?.trim() || 
          !calle?.trim() || numero === null || codigo_postal === null || telefono === null) {
        return NextResponse.json({ 
          error: 'Todos los campos son requeridos' 
        }, { status: 400 });
      }

      const result = await client.query(
        `UPDATE usuario 
         SET nombre = $1, apellido = $2, email = $3, calle = $4, 
             numero = $5, codigo_postal = $6, telefono = $7
         WHERE id_usuario = $8
         RETURNING id_usuario, nombre, apellido, email, tipo_usuario, 
                   calle, numero, codigo_postal, telefono, usuario, foto`,
        [
          nombre.trim(),
          apellido.trim(),
          email.trim(),
          calle.trim(),
          parseInt(numero, 10),
          parseInt(codigo_postal, 10),
          parseInt(telefono, 10),
          parseInt(id_usuario, 10)
        ]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Usuario no encontrado' 
        }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Perfil actualizado exitosamente',
        user: result.rows[0]
      }, { status: 200 });

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    return NextResponse.json({ 
      error: 'Error al actualizar el perfil: ' + err.message 
    }, { status: 500 });
  }
} 