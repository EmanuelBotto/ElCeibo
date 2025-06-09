import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// PUT: Actualizar lista de precios
export async function PUT(request, { params }) {
  const { id } = params;
  
  try {
    const { nombre, detalles } = await request.json();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Actualizar nombre de la lista si se proporciona
      if (nombre) {
        await client.query(
          'UPDATE lista_precio SET nombre = $1 WHERE id_lista = $2',
          [nombre, id]
        );
      }
      
      // Actualizar detalles
      for (const detalle of detalles) {
        if (detalle.id_detalle) {
          // Actualizar detalle existente
          await client.query(
            `UPDATE detalle_lista 
             SET precio = $1, 
                 porcentaje_mayorista = $2,
                 porcentaje_minorista = $3
             WHERE id_detalle = $4 AND id_lista = $5`,
            [
              detalle.precio,
              detalle.porcentaje_mayorista,
              detalle.porcentaje_minorista,
              detalle.id_detalle,
              id
            ]
          );
        } else {
          // Insertar nuevo detalle
          await client.query(
            `INSERT INTO detalle_lista 
             (id_lista, id_producto, precio, porcentaje_mayorista, porcentaje_minorista) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
              id,
              detalle.id_producto,
              detalle.precio,
              detalle.porcentaje_mayorista,
              detalle.porcentaje_minorista
            ]
          );
        }

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
        message: 'Lista de precios actualizada exitosamente' 
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en PUT /price-lists/[id]:', err);
    return NextResponse.json(
      { error: 'Error al actualizar lista de precios: ' + err.message },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar lista de precios
export async function DELETE(_, { params }) {
  const { id } = params;
  
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Eliminar primero los detalles (por la restricción de clave foránea)
      await client.query(
        'DELETE FROM detalle_lista WHERE id_lista = $1',
        [id]
      );
      
      // Luego eliminar la lista
      await client.query(
        'DELETE FROM lista_precio WHERE id_lista = $1',
        [id]
      );
      
      await client.query('COMMIT');
      
      return NextResponse.json({ 
        message: 'Lista de precios eliminada exitosamente' 
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en DELETE /price-lists/[id]:', err);
    return NextResponse.json(
      { error: 'Error al eliminar lista de precios: ' + err.message },
      { status: 500 }
    );
  }
} 