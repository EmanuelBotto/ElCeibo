"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

// Crear pool global para reutilizar conexiones entre requests
const pool = new Pool({ connectionString });

export async function GET(request, { params }) {
  try {
    const client = await pool.connect();
    try {
      const { id } = await params;
      const result = await client.query(
        'SELECT * FROM distribuidor WHERE id_distribuidor = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Distribuidor no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al obtener distribuidor:', err);
    return NextResponse.json(
      { error: 'Error al obtener el distribuidor: ' + err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const client = await pool.connect();
    try {
      const { id } = await params;
      const body = await request.json();
      //console.log('Datos recibidos para actualización:', body);

      const {
        cuit,
        nombre,
        telefono,
        email,
        nombre_fantasia,
        calle,
        numero,
        codigo_postal,
        cbu,
        alias,
        deuda
      } = body;

      // Validaciones básicas
      if (!cuit?.trim()) {
        return NextResponse.json(
          { error: 'El CUIT es requerido' },
          { status: 400 }
        );
      }

      if (!nombre?.trim()) {
        return NextResponse.json(
          { error: 'El nombre es requerido' },
          { status: 400 }
        );
      }

      if (!email?.trim()) {
        return NextResponse.json(
          { error: 'El email es requerido' },
          { status: 400 }
        );
      }

      // Verificar si existe otro distribuidor con el mismo CUIT (excepto el actual)
      const existingDistribuidor = await client.query(
        'SELECT id_distribuidor FROM distribuidor WHERE cuit = $1 AND id_distribuidor != $2',
        [cuit.trim(), id]
      );

      if (existingDistribuidor.rows.length > 0) {
        return NextResponse.json(
          { error: 'Ya existe otro distribuidor con este CUIT' },
          { status: 400 }
        );
      }

      // Convertir y validar tipos de datos
      let numeroInt = 0;
      try {
        numeroInt = numero ? parseInt(numero, 10) : 0;
      } catch (error) {
        return NextResponse.json(
          { error: 'El número debe ser un valor numérico válido' },
          { status: 400 }
        );
      }

      let codigoPostalInt = 0;
      try {
        codigoPostalInt = codigo_postal ? parseInt(codigo_postal, 10) : 0;
      } catch (error) {
        return NextResponse.json(
          { error: 'El código postal debe ser un valor numérico válido' },
          { status: 400 }
        );
      }

      let cbuBigInt = '0';
      try {
        cbuBigInt = cbu ? cbu.toString() : '0';
        // Verificar que sea un número válido
        if (cbu && isNaN(Number(cbu))) {
          throw new Error('CBU inválido');
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'El CBU debe ser un valor numérico válido' },
          { status: 400 }
        );
      }

      let deudaFloat = 0;
      try {
        deudaFloat = deuda ? parseFloat(deuda) : 0;
        if (isNaN(deudaFloat)) {
          throw new Error('Deuda inválida');
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'La deuda debe ser un valor numérico válido' },
          { status: 400 }
        );
      }

      // Actualizar el distribuidor
      const result = await client.query(
        `UPDATE distribuidor 
         SET cuit = $1,
             nombre = $2,
             telefono = $3,
             email = $4,
             nombre_fantasia = $5,
             calle = $6,
             numero = $7,
             codigo_postal = $8,
             cbu = $9,
             alias = $10,
             deuda = $11
         WHERE id_distribuidor = $12
         RETURNING *`,
        [
          cuit.trim(),
          nombre.trim(),
          telefono?.trim() || '',
          email.trim(),
          nombre_fantasia?.trim() || '',
          calle?.trim() || '',
          numeroInt,
          codigoPostalInt,
          cbuBigInt,
          alias?.trim() || '',
          deudaFloat,
          id
        ]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Distribuidor no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Distribuidor actualizado exitosamente',
        distribuidor: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al actualizar distribuidor:', err);
    return NextResponse.json(
      { error: 'Error al actualizar el distribuidor: ' + err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const client = await pool.connect();
    try {
      const { id } = await params;
      const result = await client.query(
        'DELETE FROM distribuidor WHERE id_distribuidor = $1 RETURNING id_distribuidor',
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Distribuidor no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Distribuidor eliminado exitosamente',
        id_distribuidor: result.rows[0].id_distribuidor
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al eliminar distribuidor:', err);
    return NextResponse.json(
      { error: 'Error al eliminar el distribuidor: ' + err.message },
      { status: 500 }
    );
  }
} 