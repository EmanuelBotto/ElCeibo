import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// GET: Obtener porcentajes personalizados de un producto
export async function GET(request, { params }) {
  const { id } = await params;
  
  try {
    const client = await pool.connect();
    
    try {
      // Obtener la lista por defecto
      const listaCheck = await client.query(
        `SELECT id_lista FROM lista_precio WHERE nombre = 'Lista por defecto' LIMIT 1`
      );
      
      if (listaCheck.rows.length === 0) {
        // No hay lista por defecto, retornar null
        return NextResponse.json({ 
          porcentaje_mayorista: null,
          porcentaje_minorista: null,
          tienePorcentajesPersonalizados: false
        });
      }
      
      const id_lista = listaCheck.rows[0].id_lista;
      
      // Buscar porcentajes personalizados para este producto
      const result = await client.query(
        `SELECT porcentaje_mayorista, porcentaje_minorista 
         FROM detalle_lista 
         WHERE id_producto = $1 AND id_lista = $2
         ORDER BY id_detalle DESC 
         LIMIT 1`,
        [id, id_lista]
      );
      
      if (result.rows.length > 0) {
        return NextResponse.json({
          porcentaje_mayorista: result.rows[0].porcentaje_mayorista,
          porcentaje_minorista: result.rows[0].porcentaje_minorista,
          tienePorcentajesPersonalizados: true
        });
      } else {
        return NextResponse.json({
          porcentaje_mayorista: null,
          porcentaje_minorista: null,
          tienePorcentajesPersonalizados: false
        });
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en GET /products/[id]/percentages:', err);
    return NextResponse.json(
      { error: 'Error al obtener porcentajes: ' + err.message },
      { status: 500 }
    );
  }
}

// PUT: Actualizar porcentajes personalizados
export async function PUT(request, { params }) {
  const { id } = await params;
  
  try {
    const { porcentaje_mayorista, porcentaje_minorista } = await request.json();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Asegurar que existe una lista de precios por defecto y obtener su ID
      let id_lista;
      const listaCheck = await client.query(
        `SELECT id_lista FROM lista_precio WHERE nombre = 'Lista por defecto' LIMIT 1`
      );
      
      if (listaCheck.rows.length > 0) {
        id_lista = listaCheck.rows[0].id_lista;
      } else {
        const listaResult = await client.query(
          `INSERT INTO lista_precio (nombre)
           VALUES ('Lista por defecto')
           RETURNING id_lista`
        );
        id_lista = listaResult.rows[0].id_lista;
      }
      
      // Verificar si ya existe un detalle_lista para este producto en esta lista
      const existingResult = await client.query(
        `SELECT id_detalle 
         FROM detalle_lista 
         WHERE id_producto = $1 AND id_lista = $2
         ORDER BY id_detalle DESC 
         LIMIT 1`,
        [id, id_lista]
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
        // Crear un nuevo detalle - calcular id_detalle de forma segura dentro de la transacción
        await client.query(
          `INSERT INTO detalle_lista 
           (id_detalle, id_lista, id_producto, porcentaje_mayorista, porcentaje_minorista) 
           VALUES (
             (SELECT COALESCE(MAX(id_detalle), 0) + 1 FROM detalle_lista),
             $1, $2, $3, $4
           )`,
          [id_lista, id, porcentaje_mayorista, porcentaje_minorista]
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

// DELETE: Eliminar porcentajes personalizados de un producto
export async function DELETE(request, { params }) {
  const { id } = await params;
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Obtener la lista por defecto
      const listaCheck = await client.query(
        `SELECT id_lista FROM lista_precio WHERE nombre = 'Lista por defecto' LIMIT 1`
      );
      
      if (listaCheck.rows.length > 0) {
        const id_lista = listaCheck.rows[0].id_lista;
        
        // Eliminar porcentajes personalizados
        await client.query(
          `DELETE FROM detalle_lista 
           WHERE id_producto = $1 AND id_lista = $2`,
          [id, id_lista]
        );
      }
      
      // Marcar el producto como no modificado
      await client.query(
        `UPDATE producto SET modificado = false WHERE id_producto = $1`,
        [id]
      );
      
      await client.query('COMMIT');
      
      return NextResponse.json({ 
        message: 'Porcentajes personalizados eliminados exitosamente' 
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en DELETE /products/[id]/percentages:', err);
    return NextResponse.json(
      { error: 'Error al eliminar porcentajes: ' + err.message },
      { status: 500 }
    );
  }
} 