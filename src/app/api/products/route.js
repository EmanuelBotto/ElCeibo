import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

// Crear pool global para reutilizar conexiones entre requests
const pool = new Pool({ connectionString });

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      console.log('Ejecutando consulta GET productos');
      
      const result = await client.query(`
        SELECT 
          p.id_producto,
          p.stock,
          p.nombre AS nombre_producto,
          p.precio_costo,
          p.modificado,
          t.nombre AS nombre_tipo,
          COALESCE(dl.porcentaje_final, t.porcentaje_final) as porcentaje_final,
          COALESCE(dl.porcentaje_mayorista, t.porcentaje_mayorista) as porcentaje_mayorista
        FROM 
          producto p
        INNER JOIN 
          tipo ON producto.id_tipo = tipo.id_tipo
        ORDER BY producto.id_producto
      `);
      

      
      //console.log('Productos encontrados:', result.rows.length);
      //console.log('IDs de productos:', result.rows.map(p => p.id_producto));
      
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error detallado en API /products:', err);
    return NextResponse.json({ error: 'Error en la base de datos: ' + err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const client = await pool.connect();
    try {
      const { nombre, marca, precio_costo, stock, id_tipo } = await request.json();

      // Validaciones
      if (!nombre?.trim()) {
        return NextResponse.json(
          { error: 'El nombre del producto es requerido' },
          { status: 400 }
        );
      }

      if (!precio_costo || precio_costo <= 0) {
        return NextResponse.json(
          { error: 'El precio debe ser mayor a 0' },
          { status: 400 }
        );
      }

      if (stock < 0) {
        return NextResponse.json(
          { error: 'El stock no puede ser negativo' },
          { status: 400 }
        );
      }

      // Insertar el producto
      const result = await client.query(
        `INSERT INTO producto (nombre, marca, precio_costo, stock, id_tipo, modificado)
         VALUES ($1, $2, $3, $4, $5, false)
         RETURNING id_producto`,
        [nombre.trim(), marca?.trim() || '', precio_costo, stock, id_tipo]
      );

      return NextResponse.json({
        message: 'Producto creado exitosamente',
        id_producto: result.rows[0].id_producto
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al crear producto:', err);
    return NextResponse.json(
      { error: 'Error al crear el producto: ' + err.message },
      { status: 500 }
    );
  }
}
