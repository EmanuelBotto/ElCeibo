import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// PUT: Actualizar producto por ID
export async function PUT(request, { params }) {
  const { id } = await params;
  
  try {
    const producto = await request.json();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar si ya existe un producto con el mismo nombre y tipo (excluyendo el actual)
      if (producto.nombre && producto.id_tipo) {
        const existingProduct = await client.query(
          `SELECT id_producto, nombre, id_tipo FROM producto 
           WHERE LOWER(nombre) = LOWER($1) AND id_tipo = $2 AND id_producto != $3`,
          [producto.nombre.trim(), producto.id_tipo, id]
        );

        if (existingProduct.rows.length > 0) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { 
              error: 'Ya existe un producto con este nombre y tipo',
              duplicate: {
                id: existingProduct.rows[0].id_producto,
                nombre: existingProduct.rows[0].nombre,
                tipo: producto.id_tipo
              }
            },
            { status: 409 } // Conflict status
          );
        }
      }

      // Actualizar el producto
      const query = `
        UPDATE producto 
        SET 
          nombre = COALESCE($1, nombre),
          stock = COALESCE($2, stock),
          precio_costo = COALESCE($3, precio_costo),
          id_tipo = COALESCE($4, id_tipo),
          modificado = $5,
          marca = COALESCE($6, marca),
          activo = COALESCE($7, activo)
        WHERE id_producto = $8
        RETURNING *
      `;
      
      const values = [
        producto.nombre,
        producto.stock,
        producto.precio_costo,
        producto.id_tipo,
        producto.modificado,
        producto.marca,
        producto.activo,
        id
      ];

      const result = await client.query(query, values);
      
      await client.query('COMMIT');

      return NextResponse.json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error detallado al actualizar producto:', err);
    return NextResponse.json(
      { error: 'Error al actualizar producto: ' + err.message },
      { status: 500 }
    );
  }
}

// DELETE: Borrado lógico de producto por ID
export async function DELETE(_, { params }) {
  const { id } = await params;

  try {
    const client = await pool.connect();
    try {
      // Verificar si el producto existe y está activo
      const checkQuery = 'SELECT id_producto, nombre FROM producto WHERE id_producto = $1 AND activo = true';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Producto no encontrado o ya está inactivo' },
          { status: 404 }
        );
      }

      // Realizar borrado lógico (marcar como inactivo)
      const query = 'UPDATE producto SET activo = false WHERE id_producto = $1';
      await client.query(query, [id]);
      
      return NextResponse.json({ 
        message: 'Producto eliminado',
        producto: {
          id: checkResult.rows[0].id_producto,
          nombre: checkResult.rows[0].nombre
        }
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}
