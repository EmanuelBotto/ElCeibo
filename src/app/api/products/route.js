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
      
      const result = await client.query(`
        SELECT 
          producto.id_producto,
          producto.stock,
          producto.nombre AS nombre_producto,
          producto.precio_costo,
          producto.id_tipo,
          producto.modificado,
          tipo.nombre AS nombre_tipo
        FROM 
          producto
        INNER JOIN 
          tipo ON producto.id_tipo = tipo.id_tipo
        ORDER BY producto.id_producto
      `);
      
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error detallado en API /products:', err);
    return NextResponse.json({ error: 'Error en la base de datos: ' + err.message }, { status: 500 });
  }
}
