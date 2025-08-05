"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// GET - Obtener usuario específico
export async function GET(request, { params }) {
  try {
    const client = await pool.connect();
    try {
      const { id } = params;

      const result = await client.query(
        `SELECT id_usuario, usuario, nombre, apellido, email, telefono, calle, numero, codigo_postal, tipo_usuario, foto
         FROM usuario 
         WHERE id_usuario = $1`,
        [id]
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

// PUT - Actualizar usuario
export async function PUT(request, { params }) {
  try {
    const client = await pool.connect();
    try {
      const { id } = params;
      const body = await request.json();
      const { 
        nombre, 
        apellido, 
        email, 
        telefono, 
        tipo_usuario 
      } = body;

      // Validaciones
      if (!nombre?.trim() || !apellido?.trim() || !email?.trim()) {
        return NextResponse.json({ 
          error: 'Nombre, apellido y email son requeridos' 
        }, { status: 400 });
      }

      // Verificar que el usuario existe
      const existingUser = await client.query(
        'SELECT id_usuario FROM usuario WHERE id_usuario = $1',
        [id]
      );

      if (existingUser.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Usuario no encontrado' 
        }, { status: 404 });
      }

      // Verificar que el email no esté en uso por otro usuario
      const existingEmail = await client.query(
        'SELECT id_usuario FROM usuario WHERE email = $1 AND id_usuario != $2',
        [email.trim(), id]
      );

      if (existingEmail.rows.length > 0) {
        return NextResponse.json({ 
          error: 'El email ya está registrado por otro usuario' 
        }, { status: 409 });
      }

      // Actualizar usuario
      const result = await client.query(
        `UPDATE usuario 
         SET nombre = $1, apellido = $2, email = $3, telefono = $4, tipo_usuario = $5
         WHERE id_usuario = $6
         RETURNING id_usuario, usuario, nombre, apellido, email, telefono, calle, numero, codigo_postal, tipo_usuario, foto`,
        [
          nombre.trim(),
          apellido.trim(),
          email.trim(),
          telefono?.trim() || null,
          tipo_usuario || 'asistente',
          id
        ]
      );

      const updatedUser = result.rows[0];

      return NextResponse.json({
        message: 'Usuario actualizado exitosamente',
        user: updatedUser
      }, { status: 200 });

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    return NextResponse.json({ 
      error: 'Error en el servidor: ' + err.message 
    }, { status: 500 });
  }
}

// DELETE - Eliminar usuario
export async function DELETE(request, { params }) {
  try {
    const client = await pool.connect();
    try {
      const { id } = params;

      // Verificar que el usuario existe
      const existingUser = await client.query(
        'SELECT id_usuario FROM usuario WHERE id_usuario = $1',
        [id]
      );

      if (existingUser.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Usuario no encontrado' 
        }, { status: 404 });
      }

      // Eliminar usuario
      await client.query(
        'DELETE FROM usuario WHERE id_usuario = $1',
        [id]
      );

      return NextResponse.json({
        message: 'Usuario eliminado exitosamente'
      }, { status: 200 });

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    return NextResponse.json({ 
      error: 'Error en el servidor: ' + err.message 
    }, { status: 500 });
  }
} 