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
      CONCAT(u.nombre, ' ', u.apellido) as nombre_usuario,
      f.detalle as descripcion
    FROM factura f
    LEFT JOIN usuario u ON f.id_usuario = u.id_usuario
    ORDER BY f.id_factura DESC
  `
};

export async function POST(request) {
  try {
    console.log('🔧 Iniciando proceso de backup...');
    const { tablas } = await request.json();
    console.log('📋 Tablas solicitadas:', tablas);

    if (!tablas || !Array.isArray(tablas) || tablas.length === 0) {
      return NextResponse.json({ error: 'No se especificaron tablas para el backup' }, { status: 400 });
    }

    const client = await pool.connect();
    console.log('🔌 Conexión a base de datos establecida');
    
    try {
      const workbook = XLSX.utils.book_new();
      console.log('📊 Workbook creado');
      
      // Procesar cada tabla solicitada
      for (const tabla of tablas) {
        console.log(`🔄 Procesando tabla: ${tabla}`);
        
        if (!TABLAS_QUERIES[tabla]) {
          console.warn(`⚠️ Tabla no reconocida: ${tabla}`);
          continue;
        }

        try {
          console.log(`📝 Ejecutando consulta para ${tabla}...`);
          const result = await client.query(TABLAS_QUERIES[tabla]);
          console.log(`✅ Consulta exitosa para ${tabla}. Filas obtenidas: ${result.rows.length}`);
          
          if (result.rows && result.rows.length > 0) {
            console.log(`📋 Procesando ${result.rows.length} filas para ${tabla}`);
            
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
            console.log(`✅ Hoja ${tabla} agregada al workbook`);
          } else {
            console.log(`📭 No hay datos para ${tabla}, creando hoja vacía`);
            // Crear hoja vacía con mensaje
            const emptyData = [{ mensaje: 'No hay datos disponibles' }];
            const worksheet = XLSX.utils.json_to_sheet(emptyData);
            XLSX.utils.book_append_sheet(workbook, worksheet, tabla);
          }
        } catch (error) {
          console.error(`❌ Error al procesar tabla ${tabla}:`, error);
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

      console.log('📊 Generando archivo Excel...');
      // Generar archivo Excel
      const excelBuffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        compression: true 
      });
      console.log(`✅ Archivo Excel generado. Tamaño: ${excelBuffer.length} bytes`);

      // Crear respuesta con archivo
      const response = new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="backup_${new Date().toISOString().split('T')[0]}.xlsx"`,
          'Content-Length': excelBuffer.length.toString(),
        },
      });

      console.log('🎉 Backup completado exitosamente');
      return response;

    } finally {
      client.release();
      console.log('🔌 Conexión a base de datos liberada');
    }

  } catch (error) {
    console.error('💥 Error en API /backup:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor al generar backup: ' + error.message 
    }, { status: 500 });
  }
}
