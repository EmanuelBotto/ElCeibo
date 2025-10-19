"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('search') || '';

  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT
          c.id_clinete,
          c.nombre,
          c.apellido,
          c.calle,
          c.numero,
          c.codigo_postal,
          COALESCE(c.telefono, '') as telefono,
          COALESCE(c.mail, '') as email,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id_mascota', m.id_mascota,
                  'nombre', m.nombre,
                  'especie', m.especie,
                  'raza', m.raza,
                  'sexo', m.sexo
                ) ORDER BY m.nombre
              )
              FROM mascota m
              WHERE m.id_cliente = c.id_clinete
            ),
            '[]'::json
          ) as mascotas
        FROM
          cliente c
        WHERE
          c.nombre ILIKE $1 OR c.apellido ILIKE $1
        GROUP BY
          c.id_clinete
        ORDER BY
          c.apellido, c.nombre;
      `;
      
      const result = await client.query(query, [`%${searchTerm}%`]);
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en API /fichas:', err);
    return NextResponse.json({ error: 'Error en la base de datos: ' + err.message }, { status: 500 });
  }
} 