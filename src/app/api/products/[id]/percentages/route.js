import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// PUT: Actualizar porcentajes personalizados
export async function PUT(request, { params }) {
  const { id } = params;
  
  try {
    const { porcentaje_mayorista, porcentaje_minorista } = await request.json();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Asegurar que existe una lista de precios por defecto
      const listaResult = await client.query(
        `INSERT INTO lista_precio (nombre)
         SELECT 'Lista por defecto'
         WHERE NOT EXISTS (SELECT 1 FROM lista_precio)
         RETURNING id_lista`
      );
      
      // Verificar si ya existe un detalle_lista para este producto
      const existingResult = await client.query(
        `SELECT id_detalle 
         FROM detalle_lista 
         WHERE id_producto = $1 
         ORDER BY id_detalle DESC 
         LIMIT 1`,
        [id]
      );

      if (existingResult.rows.length > 0) {
        // Actualizar el detalle existente
        await client.query(
          `UPDATE detalle_lista 
           SET porcentaje_mayorista = $1,
               porcentaje_minorista = $2
           WHERE id_detalle = $3`,
          [porcentaje_mayorista, porcentaje_minorista, existingResult.rows[0].id_detalle]
        );
      } else {
        // Crear un nuevo detalle
        await client.query(
          `INSERT INTO detalle_lista 
           (id_detalle, id_producto, porcentaje_mayorista, porcentaje_minorista) 
           VALUES (
             (SELECT COALESCE(MAX(id_detalle), 0) + 1 FROM detalle_lista),
             $1, $2, $3
           )`,
          [id, porcentaje_mayorista, porcentaje_minorista]
        );
      }
      
      await client.query('COMMIT');
      
      // Cuando modificas un producto
      if (porcentaje_mayorista || porcentaje_minorista) {
        // 1. Marcar el producto como modificado
        await client.query(
          `UPDATE producto SET modificado = true WHERE id_producto = $1`,
          [id]
        );
      }
      
      return NextResponse.json({ 
        message: 'Porcentajes actualizados exitosamente' 
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en PUT /products/[id]/percentages:', err);
    return NextResponse.json(
      { error: 'Error al actualizar porcentajes: ' + err.message },
      { status: 500 }
    );
  }
} 