"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({ connectionString });

export async function PUT(request, { params }) {
  let client;
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ 
        error: 'ID de usuario es requerido' 
      }, { status: 400 });
    }

    client = await pool.connect();

    // Verificar que el usuario existe
    const checkResult = await client.query(
      'SELECT id_usuario FROM usuario WHERE id_usuario = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado' 
      }, { status: 404 });
    }

    // Reactivar el usuario
    await client.query(
      'UPDATE usuario SET estado = true WHERE id_usuario = $1',
      [id]
    );

    return NextResponse.json({
      message: 'Usuario reactivado exitosamente'
    }, { status: 200 });

  } catch (err) {
    console.error('Error al reactivar usuario:', err);
    return NextResponse.json({ 
      error: 'Error interno del servidor: ' + err.message 
    }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
