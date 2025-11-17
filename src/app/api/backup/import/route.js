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
      INSERT INTO producto (nombre, marca, precio_costo, stock, id_tipo, modificado, activo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    updateQuery: `
      UPDATE producto SET
        marca = $2,
        precio_costo = $3,
        stock = $4,
        id_tipo = $5,
        modificado = $6,
        activo = $7
      WHERE LOWER(nombre) = LOWER($1) AND id_tipo = $5
    `,
    columns: ['nombre', 'marca', 'precio_costo', 'stock', 'id_tipo', 'modificado', 'activo'],
    required: ['nombre', 'precio_costo', 'stock', 'modificado', 'activo']
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

// Función para convertir nombre_tipo a id_tipo si es necesario
async function obtenerIdTipoPorNombre(client, nombreTipo) {
  if (!nombreTipo) return null;
  
  // Si ya es un número, retornarlo
  if (!isNaN(parseInt(nombreTipo))) {
    return parseInt(nombreTipo);
  }
  
  // Buscar por nombre
  const result = await client.query(
    'SELECT id_tipo FROM tipo WHERE LOWER(nombre) = LOWER($1)',
    [nombreTipo]
  );
  
  return result.rows.length > 0 ? result.rows[0].id_tipo : null;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const archivo = formData.get('archivo');
    const tabla = formData.get('tabla'); // Opcional: si no se proporciona, se detecta automáticamente

    if (!archivo) {
      return NextResponse.json({ 
        error: 'Archivo es requerido' 
      }, { status: 400 });
    }

    // Convertir archivo a buffer
    const buffer = await archivo.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const client = await pool.connect();
    
    try {
      let totalRegistrosInsertados = 0;
      let totalErrores = [];
      const resultadosPorTabla = {};

      // Si se especifica una tabla, procesar solo esa hoja
      if (tabla) {
        if (!TABLAS_INSERT_QUERIES[tabla]) {
          return NextResponse.json({ 
            error: 'Tabla no válida para importación' 
          }, { status: 400 });
        }

        // Buscar la hoja con el nombre de la tabla
        const sheetName = workbook.SheetNames.find(name => 
          name.toLowerCase() === tabla.toLowerCase()
        ) || workbook.SheetNames[0]; // Si no se encuentra, usar la primera

        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        if (data.length === 0) {
          return NextResponse.json({ 
            error: 'El archivo no contiene datos válidos' 
          }, { status: 400 });
        }

        const result = await procesarTabla(client, tabla, data);
        totalRegistrosInsertados = result.registrosInsertados;
        totalErrores = result.errores;
        resultadosPorTabla[tabla] = result;
      } else {
        // Procesar todas las hojas automáticamente
        for (const sheetName of workbook.SheetNames) {
          // Detectar tabla por nombre de hoja
          const tablaDetectada = sheetName.toLowerCase();
          
          if (!TABLAS_INSERT_QUERIES[tablaDetectada]) {
            console.log(`⚠️ Hoja "${sheetName}" no corresponde a una tabla importable, se omite`);
            continue;
          }

          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          
          if (data.length === 0) {
            console.log(`⚠️ Hoja "${sheetName}" está vacía, se omite`);
            continue;
          }

          console.log(`📊 Procesando hoja "${sheetName}" (${data.length} filas)`);
          const result = await procesarTabla(client, tablaDetectada, data);
          totalRegistrosInsertados += result.registrosInsertados;
          totalErrores.push(...result.errores);
          resultadosPorTabla[tablaDetectada] = result;
        }

        if (Object.keys(resultadosPorTabla).length === 0) {
          return NextResponse.json({ 
            error: 'No se encontraron hojas válidas para importar. Las hojas deben tener nombres como: productos, usuarios, pacientes, mascotas' 
          }, { status: 400 });
        }
      }

      return NextResponse.json({
        success: true,
        registrosInsertados: totalRegistrosInsertados,
        resultadosPorTabla,
        totalErrores: totalErrores.slice(0, 20), // Limitar a 20 errores
        mensaje: `Importación completada. ${totalRegistrosInsertados} registros procesados exitosamente en ${Object.keys(resultadosPorTabla).length} tabla(s).`
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

// Función auxiliar para procesar una tabla
async function procesarTabla(client, tabla, data) {
  const tableConfig = TABLAS_INSERT_QUERIES[tabla];
  let registrosInsertados = 0;
  let errores = [];

  // Procesar cada fila
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    try {
      // Ignorar columnas que no necesitamos (IDs, columnas adicionales del backup)
      const rowFiltered = {};
      tableConfig.columns.forEach(col => {
        // Buscar la columna (puede tener diferentes nombres)
        // Mapeo de nombres alternativos
        const nombreAlternativos = {
          'nombre': ['nombre_producto', 'nombre'],
          'nombre_producto': ['nombre', 'nombre_producto']
        };
        
        const alternativos = nombreAlternativos[col] || [col];
        let colKey = null;
        
        // Primero buscar por nombre exacto
        colKey = Object.keys(row).find(key => 
          key.toLowerCase() === col.toLowerCase()
        );
        
        // Si no se encuentra, buscar en alternativos
        if (!colKey && alternativos.length > 1) {
          for (const alt of alternativos) {
            colKey = Object.keys(row).find(key => 
              key.toLowerCase() === alt.toLowerCase()
            );
            if (colKey) break;
          }
        }
        
        if (colKey) {
          rowFiltered[col] = row[colKey];
        }
      });

      // Validar campos requeridos
      const missingFields = tableConfig.required.filter(field => 
        !rowFiltered[field] && rowFiltered[field] !== 0 && rowFiltered[field] !== false
      );
      
      if (missingFields.length > 0) {
        errores.push(`Fila ${i + 2}: Faltan campos requeridos: ${missingFields.join(', ')}`);
        continue;
      }

      // Preparar valores para la inserción
      const values = await Promise.all(tableConfig.columns.map(async (column) => {
        const value = rowFiltered[column];
        
        // Conversiones específicas por tipo de dato
        if (column === 'precio_costo' || column === 'stock' || column === 'edad' || column === 'peso') {
          return value !== undefined && value !== null ? parseFloat(value) : 0;
        }
        if (column === 'id_tipo') {
          // Si viene nombre_tipo en lugar de id_tipo, convertirlo
          if (row['nombre_tipo']) {
            return await obtenerIdTipoPorNombre(client, row['nombre_tipo']);
          }
          return value !== undefined && value !== null ? parseInt(value) : null;
        }
        if (column === 'id_cliente') {
          return value !== undefined && value !== null ? parseInt(value) : null;
        }
        if (column === 'activo') {
          if (value === undefined || value === null) return true; // Por defecto activo
          return value === 'true' || value === true || value === 1 || value === '1';
        }
        if (column === 'modificado') {
          if (value === undefined || value === null) return false; // Por defecto no modificado
          return value === 'true' || value === true || value === 1 || value === '1';
        }
        if (column === 'fecha_nacimiento') {
          if (!value) return null;
          // Intentar parsear la fecha
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
        }
        
        return value !== undefined && value !== null ? value : null;
      }));

      // Para productos, verificar duplicados primero
      if (tabla === 'productos') {
        const nombreProducto = values[0];
        const idTipo = values[4];
        
        // Verificar si ya existe
        const existing = await client.query(
          'SELECT id_producto FROM producto WHERE LOWER(nombre) = LOWER($1) AND id_tipo = $2',
          [nombreProducto, idTipo]
        );
        
        if (existing.rows.length > 0) {
          // Actualizar producto existente
          await client.query(tableConfig.updateQuery, values);
        } else {
          // Insertar nuevo producto
          await client.query(tableConfig.query, values);
        }
      } else {
        // Para otras tablas, usar la query normal
        await client.query(tableConfig.query, values);
      }
      
      registrosInsertados++;
      
    } catch (error) {
      console.error(`Error en fila ${i + 2} de tabla ${tabla}:`, error);
      errores.push(`Fila ${i + 2}: ${error.message}`);
    }
  }

  return {
    registrosInsertados,
    totalFilas: data.length,
    errores
  };
}
