"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

// Crear pool global para reutilizar conexiones entre requests
const pool = new Pool({ connectionString });

// Crear tabla si no existe
async function ensureTableExists() {
  const client = await pool.connect();
  try {
    // Verificar si la tabla existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'distribuidor'
      );
    `);

    // Si la tabla no existe, la creamos
    if (!tableExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE distribuidor (
          id_distribuidor SERIAL PRIMARY KEY,
          cuit VARCHAR(20) UNIQUE NOT NULL,
          nombre VARCHAR(100) NOT NULL,
          telefono VARCHAR(20),
          email VARCHAR(100) NOT NULL,
          nombre_fantasia VARCHAR(100),
          calle VARCHAR(100),
          numero INTEGER,
          codigo_postal INTEGER,
          cbu BIGINT,
          alias VARCHAR(50),
          deuda DECIMAL(10,2) DEFAULT 0
        )
      `);
    }
  } catch (err) {
    console.error('Error al verificar/crear la tabla distribuidor:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Asegurarnos de que la tabla exista al iniciar
ensureTableExists().catch(console.error);

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id_distribuidor,
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
        FROM 
          distribuidor
        ORDER BY 
          nombre
      `);
      
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error detallado en API /distribuidores:', err);
    return NextResponse.json({ error: 'Error en la base de datos: ' + err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const client = await pool.connect();
    try {
      const body = await request.json();

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
        deuda = '0'
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

      // Verificar si ya existe un distribuidor con el mismo CUIT
      const existingDistribuidor = await client.query(
        'SELECT id_distribuidor FROM distribuidor WHERE cuit = $1',
        [cuit.trim()]
      );

      if (existingDistribuidor.rows.length > 0) {
        return NextResponse.json(
          { error: 'Ya existe un distribuidor con este CUIT' },
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

      // Insertar el distribuidor
      const result = await client.query(
        `INSERT INTO distribuidor (
          cuit, nombre, telefono, email, nombre_fantasia,
          calle, numero, codigo_postal, cbu, alias, deuda
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id_distribuidor`,
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
          deudaFloat
        ]
      );

      return NextResponse.json({
        message: 'Distribuidor creado exitosamente',
        id_distribuidor: result.rows[0].id_distribuidor
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al crear distribuidor:', err);
    return NextResponse.json(
      { error: 'Error al crear el distribuidor: ' + err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const client = await pool.connect();
    try {
      const body = await request.json();
      const { id_distribuidor, ...updateData } = body;

      if (!id_distribuidor) {
        return NextResponse.json(
          { error: 'ID del distribuidor es requerido' },
          { status: 400 }
        );
      }

      // Verificar si el distribuidor existe
      const existingDistribuidor = await client.query(
        'SELECT id_distribuidor FROM distribuidor WHERE id_distribuidor = $1',
        [id_distribuidor]
      );

      if (existingDistribuidor.rows.length === 0) {
        return NextResponse.json(
          { error: 'Distribuidor no encontrado' },
          { status: 404 }
        );
      }

      // Construir la consulta de actualización dinámicamente
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && updateData[key] !== null) {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        return NextResponse.json(
          { error: 'No hay datos para actualizar' },
          { status: 400 }
        );
      }

      // Agregar el ID al final para la condición WHERE
      values.push(id_distribuidor);

      const query = `
        UPDATE distribuidor 
        SET ${fields.join(', ')} 
        WHERE id_distribuidor = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

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