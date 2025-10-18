"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// GET all clients
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id_clinete,
          nombre,
          apellido,
          calle,
          numero,
          codigo_postal,
          COALESCE(telefono, '') as telefono,
          COALESCE(mail, '') as email
        FROM 
          cliente
        ORDER BY 
          apellido, nombre
      `);
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en API /clientes:', err);
    return NextResponse.json({ error: 'Error en la base de datos: ' + err.message }, { status: 500 });
  }
}

// POST a new client
export async function POST(request) {
  try {
    const client = await pool.connect();
    try {
      const body = await request.json();
      const {
        nombre,
        apellido,
        calle,
        numero,
        telefono,
        email,
        codigo_postal
      } = body;

      console.log('Datos recibidos en API POST:', body);
      console.log('Teléfono extraído:', telefono);

      if (!nombre?.trim() || !apellido?.trim() || !calle?.trim() || numero === null) {
        return NextResponse.json({ error: 'Los campos nombre, apellido, calle y número son requeridos' }, { status: 400 });
      }

      const result = await client.query(
        `INSERT INTO cliente (nombre, apellido, calle, numero, telefono, mail, codigo_postal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id_clinete`,
        [
          nombre.trim(),
          apellido.trim(),
          calle.trim(),
          parseInt(numero, 10),
          telefono?.trim() || null,
          email?.trim() || null,
          codigo_postal ? parseInt(codigo_postal, 10) : null
        ]
      );

      return NextResponse.json({
        message: 'Cliente creado exitosamente',
        id_cliente: result.rows[0].id_clinete
      }, { status: 201 });

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al crear cliente:', err);
    return NextResponse.json({ error: 'Error al crear el cliente: ' + err.message }, { status: 500 });
  }
} 