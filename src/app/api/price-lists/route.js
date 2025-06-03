import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// GET: Obtener todas las listas de precios
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          l.id_lista,
          l.nombre,
          d.id_detalle,
          d.precio,
          d.porcentaje_mayorista,
          d.porcentaje_minorista,
          d.id_producto,
          p.nombre as nombre_producto
        FROM 
          lista_precio l
        LEFT JOIN 
          detalle_lista d ON l.id_lista = d.id_lista
        LEFT JOIN 
          producto p ON d.id_producto = p.id_producto
        ORDER BY 
          l.id_lista, p.nombre
      `);
      
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en GET /price-lists:', err);
    return NextResponse.json(
      { error: 'Error al obtener listas de precios: ' + err.message },
      { status: 500 }
    );
  }
}

// POST: Crear nueva lista de precios
export async function POST(request) {
  try {
    const { nombre, detalles } = await request.json();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Crear la secuencia si no existe
      await client.query(`
        CREATE SEQUENCE IF NOT EXISTS detalle_lista_id_detalle_seq;
      `);
      
      // Insertar la lista de precios
      const listaResult = await client.query(
        'INSERT INTO lista_precio (nombre) VALUES ($1) RETURNING id_lista',
        [nombre]
      );
      
      const id_lista = listaResult.rows[0].id_lista;
      
      // Insertar los detalles
      for (const detalle of detalles) {
        await client.query(
          `INSERT INTO detalle_lista 
           (id_detalle, id_lista, id_producto, precio, porcentaje_mayorista, porcentaje_minorista) 
           VALUES (nextval('detalle_lista_id_detalle_seq'), $1, $2, $3, $4, $5)`,
          [
            id_lista, 
            detalle.id_producto, 
            detalle.precio, 
            detalle.porcentaje_mayorista,
            detalle.porcentaje_minorista
          ]
        );

        // Actualizar el estado modificado del producto
        await client.query(
          `UPDATE producto 
           SET modificado = true 
           WHERE id_producto = $1`,
          [detalle.id_producto]
        );
      }
      
      await client.query('COMMIT');
      
      return NextResponse.json({ 
        message: 'Lista de precios creada exitosamente',
        id_lista 
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en POST /price-lists:', err);
    return NextResponse.json(
      { error: 'Error al crear lista de precios: ' + err.message },
      { status: 500 }
    );
  }
} 