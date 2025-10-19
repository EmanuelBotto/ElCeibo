"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';
import * as XLSX from 'xlsx';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// Mapeo de tablas a sus consultas SQL
const TABLAS_QUERIES = {
  productos: `
    SELECT 
      p.id_producto,
      p.nombre as nombre_producto,
      p.marca,
      p.precio_costo,
      p.stock,
      t.nombre as nombre_tipo,
      t.porcentaje_mayorista,
      t.porcentaje_final,
      p.modificado
    FROM producto p
    LEFT JOIN tipo t ON p.id_tipo = t.id_tipo
    ORDER BY p.id_producto
  `,
  caja: `
    SELECT 
      f.id_factura,
      f.tipo_factura,
      f.monto_total,
      f.forma_de_pago,
      f.dia,
      f.mes,
      f.anio,
      f.hora,
      CONCAT(u.nombre, ' ', u.apellido) as nombre_usuario,
      f.detalle as descripcion
    FROM factura f
    LEFT JOIN usuario u ON f.id_usuario = u.id_usuario
    ORDER BY f.id_factura DESC
  `,
  pacientes: `
    SELECT 
      c.id_clinete,
      c.nombre,
      c.apellido,
      c.telefono,
      c.email,
      c.direccion
    FROM cliente c
    ORDER BY c.id_clinete
  `,
  usuarios: `
    SELECT 
      u.id_usuario,
      u.nombre,
      u.apellido,
      u.email,
      u.usuario,
      u.tipo_usuario,
      u.activo
    FROM usuario u
    ORDER BY u.id_usuario
  `,
  mascotas: `
    SELECT 
      m.id_mascota,
      m.nombre,
      m.especie,
      m.raza,
      m.sexo,
      m.edad,
      m.peso,
      m.estado_reproductivo,
      m.fecha_nacimiento,
      c.nombre as nombre_cliente,
      c.apellido as apellido_cliente
    FROM mascota m
    LEFT JOIN cliente c ON m.id_cliente = c.id_clinete
    ORDER BY m.id_mascota
  `,
  facturas: `
    SELECT 
      f.id_factura,
      f.tipo_factura,
      f.monto_total,
      f.forma_de_pago,
      f.dia,
      f.mes,
      f.anio,
      f.hora,
      f.num_factura,
      CONCAT(u.nombre, ' ', u.apellido) as nombre_usuario,
      d.nombre_fantasia as nombre_distribuidor
    FROM factura f
    LEFT JOIN usuario u ON f.id_usuario = u.id_usuario
    LEFT JOIN distribuidor d ON f.id_distribuidor = d.id_distribuidor
    ORDER BY f.id_factura DESC
  `,
  detalle_factura: `
    SELECT 
      df.id_detalle,
      df.id_factura,
      df.id_producto,
      df.cantidad,
      df.precio_unidad,
      df.precio_tot,
      p.nombre as nombre_producto,
      p.marca
    FROM detalle_factura df
    LEFT JOIN producto p ON df.id_producto = p.id_producto
    ORDER BY df.id_factura, df.id_detalle
  `
};

export async function POST(request) {
  try {
    const { tablas } = await request.json();

    if (!tablas || !Array.isArray(tablas) || tablas.length === 0) {
      return NextResponse.json({ error: 'No se especificaron tablas para el backup' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Procesar cada tabla solicitada
      for (const tabla of tablas) {
        if (!TABLAS_QUERIES[tabla]) {
          continue;
        }

        try {
          const result = await client.query(TABLAS_QUERIES[tabla]);
          
          if (result.rows && result.rows.length > 0) {
            // Convertir datos para Excel
            const worksheet = XLSX.utils.json_to_sheet(result.rows);
            
            // Ajustar ancho de columnas
            const colWidths = [];
            if (result.rows.length > 0) {
              const headers = Object.keys(result.rows[0]);
              headers.forEach(header => {
                const maxLength = Math.max(
                  header.length,
                  ...result.rows.map(row => 
                    row[header] ? String(row[header]).length : 0
                  )
                );
                colWidths.push({ wch: Math.min(maxLength + 2, 50) });
              });
            }
            worksheet['!cols'] = colWidths;
            
            // Agregar hoja al workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, tabla);
          } else {
            // Crear hoja vacía con mensaje
            const emptyData = [{ mensaje: 'No hay datos disponibles' }];
            const worksheet = XLSX.utils.json_to_sheet(emptyData);
            XLSX.utils.book_append_sheet(workbook, worksheet, tabla);
          }
        } catch (error) {
          console.error(`Error al procesar tabla ${tabla}:`, error);
          // Crear hoja con error
          const errorData = [{ 
            error: `Error al obtener datos: ${error.message}`,
            tabla: tabla,
            timestamp: new Date().toISOString()
          }];
          const worksheet = XLSX.utils.json_to_sheet(errorData);
          XLSX.utils.book_append_sheet(workbook, worksheet, `${tabla}_error`);
        }
      }

      // Generar archivo Excel
      const excelBuffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        compression: true 
      });

      // Crear respuesta con archivo
      const response = new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="backup_${new Date().toISOString().split('T')[0]}.xlsx"`,
          'Content-Length': excelBuffer.length.toString(),
        },
      });

      return response;

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error en API /backup:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor al generar backup: ' + error.message 
    }, { status: 500 });
  }
}
