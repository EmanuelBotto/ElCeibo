"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';
import * as XLSX from 'xlsx';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// Mapeo de tablas a sus estructuras de inserción
const TABLAS_INSERT_QUERIES = {
  productos: {
    query: `
      INSERT INTO producto (nombre, marca, precio_costo, stock, id_tipo)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id_producto) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        marca = EXCLUDED.marca,
        precio_costo = EXCLUDED.precio_costo,
        stock = EXCLUDED.stock,
        id_tipo = EXCLUDED.id_tipo,
        modificado = CURRENT_TIMESTAMP
    `,
    columns: ['nombre', 'marca', 'precio_costo', 'stock', 'id_tipo'],
    required: ['nombre', 'precio_costo', 'stock']
  },
  usuarios: {
    query: `
      INSERT INTO usuario (nombre, apellido, email, usuario, tipo_usuario, activo)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id_usuario) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        apellido = EXCLUDED.apellido,
        email = EXCLUDED.email,
        usuario = EXCLUDED.usuario,
        tipo_usuario = EXCLUDED.tipo_usuario,
        activo = EXCLUDED.activo
    `,
    columns: ['nombre', 'apellido', 'email', 'usuario', 'tipo_usuario', 'activo'],
    required: ['nombre', 'apellido', 'email', 'usuario']
  },
  pacientes: {
    query: `
      INSERT INTO cliente (nombre, apellido, telefono, email, direccion)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id_clinete) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        apellido = EXCLUDED.apellido,
        telefono = EXCLUDED.telefono,
        email = EXCLUDED.email,
        direccion = EXCLUDED.direccion
    `,
    columns: ['nombre', 'apellido', 'telefono', 'email', 'direccion'],
    required: ['nombre', 'apellido']
  },
  mascotas: {
    query: `
      INSERT INTO mascota (nombre, especie, raza, sexo, edad, peso, estado_reproductivo, fecha_nacimiento, id_cliente)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id_mascota) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        especie = EXCLUDED.especie,
        raza = EXCLUDED.raza,
        sexo = EXCLUDED.sexo,
        edad = EXCLUDED.edad,
        peso = EXCLUDED.peso,
        estado_reproductivo = EXCLUDED.estado_reproductivo,
        fecha_nacimiento = EXCLUDED.fecha_nacimiento,
        id_cliente = EXCLUDED.id_cliente
    `,
    columns: ['nombre', 'especie', 'raza', 'sexo', 'edad', 'peso', 'estado_reproductivo', 'fecha_nacimiento', 'id_cliente'],
    required: ['nombre', 'especie']
  }
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const archivo = formData.get('archivo');
    const tabla = formData.get('tabla');

    if (!archivo || !tabla) {
      return NextResponse.json({ 
        error: 'Archivo y tabla son requeridos' 
      }, { status: 400 });
    }

    if (!TABLAS_INSERT_QUERIES[tabla]) {
      return NextResponse.json({ 
        error: 'Tabla no válida para importación' 
      }, { status: 400 });
    }

    // Convertir archivo a buffer
    const buffer = await archivo.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`📊 Datos leídos: ${data.length} filas`);

    if (data.length === 0) {
      return NextResponse.json({ 
        error: 'El archivo no contiene datos válidos' 
      }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      const tableConfig = TABLAS_INSERT_QUERIES[tabla];
      let registrosInsertados = 0;
      let errores = [];

      // Procesar cada fila
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
          // Validar campos requeridos
          const missingFields = tableConfig.required.filter(field => 
            !row[field] || row[field] === ''
          );
          
          if (missingFields.length > 0) {
            errores.push(`Fila ${i + 2}: Faltan campos requeridos: ${missingFields.join(', ')}`);
            continue;
          }

          // Preparar valores para la inserción
          const values = tableConfig.columns.map(column => {
            const value = row[column];
            
            // Conversiones específicas por tipo de dato
            if (column === 'precio_costo' || column === 'stock' || column === 'edad' || column === 'peso') {
              return value ? parseFloat(value) : 0;
            }
            if (column === 'activo') {
              return value === 'true' || value === true || value === 1 || value === '1';
            }
            if (column === 'fecha_nacimiento') {
              return value ? new Date(value).toISOString().split('T')[0] : null;
            }
            
            return value || null;
          });

          // Ejecutar inserción
          await client.query(tableConfig.query, values);
          registrosInsertados++;
          
        } catch (error) {
          console.error(`Error en fila ${i + 2}:`, error);
          errores.push(`Fila ${i + 2}: ${error.message}`);
        }
      }

      return NextResponse.json({
        success: true,
        registrosInsertados,
        totalFilas: data.length,
        errores: errores.slice(0, 10), // Limitar a 10 errores para la respuesta
        mensaje: `Importación completada. ${registrosInsertados} de ${data.length} registros procesados exitosamente.`
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error en API /backup/import:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor al procesar archivo: ' + error.message 
    }, { status: 500 });
  }
}
