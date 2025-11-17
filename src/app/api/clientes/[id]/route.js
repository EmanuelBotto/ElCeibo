"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// GET client by ID
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const client = await pool.connect();
    try {
      console.log('Buscando cliente con ID:', id);
      
      // Primero obtener el cliente
      const clienteResult = await client.query(
        `SELECT 
          id_clinete,
          nombre,
          apellido,
          calle,
          numero,
          codigo_postal,
          COALESCE(telefono, '') as telefono,
          COALESCE(mail, '') as email
        FROM cliente 
        WHERE id_clinete = $1`,
        [id]
      );
      
      if (clienteResult.rows.length === 0) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
      }
      
      const cliente = clienteResult.rows[0];
      console.log('Cliente encontrado:', cliente.id_clinete);
      
      // Luego obtener las mascotas - usando SELECT * para evitar problemas con columnas faltantes
      let mascotas = [];
      try {
        const mascotasResult = await client.query(
          `SELECT * FROM mascota WHERE id_cliente = $1 ORDER BY nombre`,
          [id]
        );
        // Mapear solo las columnas que necesitamos
        mascotas = mascotasResult.rows.map(m => ({
          id_mascota: m.id_mascota,
          nombre: m.nombre,
          especie: m.especie,
          raza: m.raza,
          sexo: m.sexo,
          edad: m.edad,
          peso: m.peso,
          estado_reproductivo: m.estado_reproductivo,
          fecha_nacimiento: m.fecha_nacimiento,
          deceso: m.deceso
        }));
        console.log('Mascotas encontradas:', mascotas.length);
      } catch (mascotasError) {
        console.error('Error al obtener mascotas:', mascotasError);
        // Si hay error al obtener mascotas, continuar sin ellas
        mascotas = [];
      }
      
      // Combinar cliente con mascotas
      const clienteConMascotas = {
        ...cliente,
        mascotas: mascotas
      };
      
      return NextResponse.json(clienteConMascotas);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error completo en GET /api/clientes/[id]:', err);
    return NextResponse.json({ 
      error: 'Error en la base de datos: ' + err.message,
      details: err.stack 
    }, { status: 500 });
  }
}

// PUT (update) a client
export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const client = await pool.connect();
    try {
      const body = await request.json();
      const { nombre, apellido, calle, numero, telefono, email, codigo_postal } = body;

      console.log('Datos recibidos en API PUT:', body);
      console.log('Teléfono extraído:', telefono);

      if (!nombre?.trim() || !apellido?.trim() || !calle?.trim() || numero === null) {
        return NextResponse.json({ error: 'Los campos nombre, apellido, calle y número son requeridos para actualizar' }, { status: 400 });
      }

      const result = await client.query(
        `UPDATE cliente SET 
           nombre = $1, 
           apellido = $2, 
           calle = $3, 
           numero = $4, 
           telefono = $5,
           mail = $6,
           codigo_postal = $7
         WHERE id_clinete = $8
         RETURNING *`,
        [
          nombre.trim(),
          apellido.trim(),
          calle.trim(),
          parseInt(numero, 10),
          telefono?.trim() || null,
          email?.trim() || null,
          codigo_postal ? parseInt(codigo_postal, 10) : null,
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

// DELETE a client
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