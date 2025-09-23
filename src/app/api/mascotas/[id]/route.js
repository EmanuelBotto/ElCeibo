"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// Obtener una mascota por ID
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM mascota WHERE id_mascota = $1', [id]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404 });
      }
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`Error al obtener mascota ${id}:`, err);
    return NextResponse.json({ error: 'Error en la base de datos: ' + err.message }, { status: 500 });
  }
}

// Actualizar una mascota
export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const client = await pool.connect();
    try {
      const body = await request.json();
      const {
        nombre,
        especie,
        raza,
        sexo,
        edad,
        peso,
        foto,
        estado_reproductivo,
        dia,
        mes,
        anio,
        id_cliente,
        deceso,
        fecha_deceso
      } = body;

      // Validaciones (similares a POST)
      if (!nombre?.trim() || !especie?.trim() || !raza?.trim() || !sexo?.trim() || edad === null || peso === null || estado_reproductivo === null || dia === null || !mes?.trim() || anio === null || id_cliente === null) {
        return NextResponse.json({ error: 'Todos los campos son requeridos para la actualización' }, { status: 400 });
      }

      const result = await client.query(
        `UPDATE mascota SET 
          nombre = $1, 
          especie = $2, 
          raza = $3, 
          sexo = $4, 
          edad = $5, 
          peso = $6, 
          foto = $7, 
          estado_reproductivo = $8, 
          dia = $9, 
          mes = $10, 
          anio = $11, 
          id_cliente = $12,
          deceso = $13,
          fecha_deceso = $14
        WHERE id_mascota = $15
        RETURNING *`,
        [
          nombre.trim(),
          especie.trim(),
          raza.trim(),
          sexo.trim(),
          parseInt(edad, 10),
          parseInt(peso, 10),
          foto,
          estado_reproductivo,
          parseInt(dia, 10),
          mes.trim(),
          parseInt(anio, 10),
          parseInt(id_cliente, 10),
          deceso || false,
          fecha_deceso,
          id
        ]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Mascota no encontrada para actualizar' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Mascota actualizada exitosamente', mascota: result.rows[0] });

    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`Error al actualizar mascota ${id}:`, err);
    return NextResponse.json({ error: 'Error al actualizar la mascota: ' + err.message }, { status: 500 });
  }
}

// Eliminar una mascota
export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM mascota WHERE id_mascota = $1 RETURNING id_mascota', [id]);
      
      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Mascota no encontrada para eliminar' }, { status: 404 });
      }

      return NextResponse.json({ message: `Mascota con ID ${id} eliminada exitosamente` });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`Error al eliminar mascota ${id}:`, err);
    return NextResponse.json({ error: 'Error al eliminar la mascota: ' + err.message }, { status: 500 });
  }
} 