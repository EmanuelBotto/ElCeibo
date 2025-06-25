"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id_mascota,
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
          id_cliente
        FROM 
          mascota
        ORDER BY 
          nombre
      `);
      
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error detallado en API /mascotas:', err);
    return NextResponse.json({ error: 'Error en la base de datos: ' + err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const client = await pool.connect();
    try {
      const body = await request.json();
      console.log('Datos recibidos para mascota:', body);

      const {
        nombre,
        especie,
        raza,
        sexo,
        edad,
        peso,
        foto, // Se asume que la foto viene en un formato compatible (ej. base64)
        estado_reproductivo,
        dia,
        mes,
        anio,
        id_cliente
      } = body;

      // Validaciones básicas
      if (!nombre?.trim()) {
        return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
      }
      if (!especie?.trim()) {
        return NextResponse.json({ error: 'La especie es requerida' }, { status: 400 });
      }
      if (!raza?.trim()) {
        return NextResponse.json({ error: 'La raza es requerida' }, { status: 400 });
      }
       if (!sexo?.trim()) {
        return NextResponse.json({ error: 'El sexo es requerido' }, { status: 400 });
      }
      if (edad === undefined || edad === null) {
        return NextResponse.json({ error: 'La edad es requerida' }, { status: 400 });
      }
      if (peso === undefined || peso === null) {
        return NextResponse.json({ error: 'El peso es requerido' }, { status: 400 });
      }
      if (estado_reproductivo === undefined || estado_reproductivo === null) {
          return NextResponse.json({ error: 'El estado reproductivo es requerido' }, { status: 400 });
      }
      if (dia === undefined || dia === null) {
        return NextResponse.json({ error: 'El día de nacimiento es requerido' }, { status: 400 });
      }
      if (!mes?.trim()) {
        return NextResponse.json({ error: 'El mes de nacimiento es requerido' }, { status: 400 });
      }
      if (anio === undefined || anio === null) {
        return NextResponse.json({ error: 'El año de nacimiento es requerido' }, { status: 400 });
      }
      if (id_cliente === undefined || id_cliente === null) {
        return NextResponse.json({ error: 'El ID del cliente es requerido' }, { status: 400 });
      }


      // Insertar la mascota
      const result = await client.query(
        `INSERT INTO mascota (
          nombre, especie, raza, sexo, edad, peso, foto,
          estado_reproductivo, dia, mes, anio, id_cliente
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id_mascota`,
        [
          nombre.trim(),
          especie.trim(),
          raza.trim(),
          sexo.trim(),
          parseInt(edad, 10),
          parseInt(peso, 10),
          foto, // Se pasa directamente. Asegurarse que el driver de pg lo maneje.
          estado_reproductivo,
          parseInt(dia, 10),
          mes.trim(),
          parseInt(anio, 10),
          parseInt(id_cliente, 10)
        ]
      );

      return NextResponse.json({
        message: 'Mascota creada exitosamente',
        id_mascota: result.rows[0].id_mascota
      }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al crear mascota:', err);
    return NextResponse.json(
      { error: 'Error al crear la mascota: ' + err.message },
      { status: 500 }
    );
  }
} 