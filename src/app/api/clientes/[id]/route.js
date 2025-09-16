"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// GET (Obtener) un cliente por ID
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM cliente WHERE id_clinete = $1', [id]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
      }
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (err) {
    return NextResponse.json({ error: 'Error en la base de datos: ' + err.message }, { status: 500 });
  }
}

// PUT (Actualizar) un cliente
export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const client = await pool.connect();
    try {
      const body = await request.json();
      const { nombre, apellido, calle, numero, codigo_postal } = body;

      if (!nombre?.trim() || !apellido?.trim() || !calle?.trim() || numero === null || codigo_postal === null) {
        return NextResponse.json({ error: 'Todos los campos son requeridos para actualizar' }, { status: 400 });
      }

      const result = await client.query(
        `UPDATE cliente SET 
           nombre = $1, 
           apellido = $2, 
           calle = $3, 
           numero = $4, 
           codigo_postal = $5,
           celular = $6
         WHERE id_clinete = $7
         RETURNING *`,
        [
          nombre.trim(),
          apellido.trim(),
          calle.trim(),
          parseInt(numero, 10),
          parseInt(codigo_postal, 10),
          parseInt(celular, 10),
          id
        ]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Cliente no encontrado para actualizar' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Cliente actualizado', cliente: result.rows[0] });

    } finally {
      client.release();
    }
  } catch (err) {
    return NextResponse.json({ error: 'Error al actualizar el cliente: ' + err.message }, { status: 500 });
  }
}

// DELETE (Eliminar) un cliente
export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const client = await pool.connect();
    try {
       // Antes de eliminar el cliente, se podrían eliminar o desasociar las mascotas.
      // Por ahora, asumimos que la base de datos maneja esto (ej. ON DELETE CASCADE)
      // o que no se pueden eliminar clientes con mascotas asociadas.
      
      // Eliminar mascotas asociadas al cliente
      await client.query('DELETE FROM mascota WHERE id_cliente = $1', [id]);
      
      // Ahora eliminar el cliente
      const result = await client.query('DELETE FROM cliente WHERE id_clinete = $1 RETURNING id_clinete', [id]);
      
      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Cliente no encontrado para eliminar' }, { status: 404 });
      }
      return NextResponse.json({ message: `Cliente con ID ${id} y sus mascotas han sido eliminados` });
    } finally {
      client.release();
    }
  } catch (err) {
    return NextResponse.json({ error: 'Error al eliminar el cliente: ' + err.message }, { status: 500 });
  }
} 