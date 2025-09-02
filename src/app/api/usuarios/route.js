"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// GET - Obtener todos los usuarios
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id_usuario, usuario, nombre, apellido, email, telefono, calle, numero, codigo_postal, tipo_usuario, foto
         FROM usuario 
         ORDER BY nombre, apellido`
      );

      return NextResponse.json({
        users: result.rows
      }, { status: 200 });

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    return NextResponse.json({ 
      error: 'Error en el servidor: ' + err.message 
    }, { status: 500 });
  }
}

// POST - Crear nuevo usuario
export async function POST(request) {
  try {
    const client = await pool.connect();
    try {
      const body = await request.json();
      const { 
        usuario, 
        nombre, 
        apellido, 
        email, 
        telefono, 
        direccion, 
        tipo_usuario, 
        contrasenia 
      } = body;

      // Validaciones
      if (!usuario?.trim() || !nombre?.trim() || !apellido?.trim() || !email?.trim() || !contrasenia?.trim()) {
        return NextResponse.json({ 
          error: 'Todos los campos obligatorios son requeridos' 
        }, { status: 400 });
      }

      // Validar que el usuario no exista
      const existingUser = await client.query(
        'SELECT id FROM usuario WHERE usuario = $1',
        [usuario.trim()]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json({ 
          error: 'El nombre de usuario ya existe' 
        }, { status: 409 });
      }

      // Validar que el email no exista
      const existingEmail = await client.query(
        'SELECT id FROM usuario WHERE email = $1',
        [email.trim()]
      );

      if (existingEmail.rows.length > 0) {
        return NextResponse.json({ 
          error: 'El email ya está registrado' 
        }, { status: 409 });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(contrasenia, 10);

      // Insertar nuevo usuario
      const result = await client.query(
        `INSERT INTO usuario (usuario, nombre, apellido, email, telefono, calle, numero, codigo_postal, tipo_usuario, contrasenia)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id_usuario, usuario, nombre, apellido, email, telefono, calle, numero, codigo_postal, tipo_usuario, foto`,
        [
          usuario.trim(),
          nombre.trim(),
          apellido.trim(),
          email.trim(),
          telefono?.trim() || null,
          'Calle Principal', // calle por defecto
          123, // numero por defecto
          12345, // codigo_postal por defecto
          tipo_usuario || 'asistente',
          hashedPassword
        ]
      );

      const newUser = result.rows[0];

      return NextResponse.json({
        message: 'Usuario creado exitosamente',
        user: newUser
      }, { status: 201 });

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al crear usuario:', err);
    return NextResponse.json({ 
      error: 'Error en el servidor: ' + err.message 
    }, { status: 500 });
  }
} 