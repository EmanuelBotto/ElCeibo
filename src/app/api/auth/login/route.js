"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// POST login
export async function POST(request) {
  try {
    const client = await pool.connect();
    try {
      const body = await request.json();
      const { usuario, contrasenia } = body;

      if (!usuario?.trim() || !contrasenia?.trim()) {
        return NextResponse.json({ 
          error: 'Usuario y contraseña son requeridos' 
        }, { status: 400 });
      }

      // Buscar usuario en la base de datos
      const result = await client.query(
        `SELECT *
        FROM usuario 
        WHERE usuario = $1`,
        [usuario.trim()]
      );
      

      if (result.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Usuario o contraseña incorrectos' 
        }, { status: 401 });
      }

      const user = result.rows[0];

      // Verificar contraseña con bcrypt
      const isValidPassword = await bcrypt.compare(contrasenia, user.contrasenia);
      
      if (!isValidPassword) {
        return NextResponse.json({ 
          error: 'Usuario o contraseña incorrectos' 
        }, { status: 401 });
      }

      // Retornar datos del usuario (sin contraseña)
      const { contrasenia: password, ...userData } = user;
      
      return NextResponse.json({
        message: 'Login exitoso',
        user: userData
      }, { status: 200 });

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en login:', err);
    return NextResponse.json({ 
      error: 'Error en el servidor: ' + err.message 
    }, { status: 500 });
  }
} 