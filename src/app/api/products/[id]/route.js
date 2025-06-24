import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

// PUT: Actualizar producto por ID
export async function PUT(request, { params }) {
  const { id } = params;
  
  try {
    const producto = await request.json();
    console.log('ID recibido:', id);
    console.log('Datos recibidos:', producto);
    
    const client = await pool.connect();
    
    try {
      // Primero verificamos si el producto existe
      const checkQuery = 'SELECT * FROM producto WHERE id_producto = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        console.log('Producto no encontrado en la base de datos');
        return NextResponse.json(
          { error: 'Producto no encontrado' },
          { status: 404 }
        );
      }

      // Si el producto existe, procedemos a actualizarlo
      const query = `
        UPDATE producto 
        SET 
          nombre = COALESCE($1, nombre),
          stock = COALESCE($2, stock),
          precio_costo = COALESCE($3, precio_costo),
          id_tipo = COALESCE($4, id_tipo),
          modificado = true
        WHERE id_producto = $5
        RETURNING *
      `;
      
      const values = [
        producto.nombre,
        producto.stock,
        producto.precio_costo,
        producto.id_tipo,
        id
      ];

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        console.log('La actualización no afectó ninguna fila');
        return NextResponse.json(
          { error: 'No se pudo actualizar el producto' },
          { status: 500 }
        );
      }

      return NextResponse.json(result.rows[0]);
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

// DELETE: Eliminar producto por ID
export async function DELETE(_, { params }) {
  const { id } = params;

  try {
    const client = await pool.connect();
    try {
      const query = 'DELETE FROM producto WHERE id_producto = $1';
      await client.query(query, [id]);
      return NextResponse.json({ message: 'Producto eliminado' });
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
