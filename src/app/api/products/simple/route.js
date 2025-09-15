import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

export async function GET(request) {
  try {
    const client = await pool.connect();
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 50;
      const search = searchParams.get('search') || '';
      
      const offset = (page - 1) * limit;
      
      // Consulta simplificada y rápida
      let whereClause = '';
      let queryParams = [];
      
      if (search) {
        whereClause = 'WHERE p.nombre ILIKE $1';
        queryParams.push(`%${search}%`);
      }
      
      const result = await client.query(`
        SELECT 
          p.id_producto,
          p.nombre,
          p.stock,
          p.precio_costo,
          t.nombre AS tipo
        FROM producto p
        INNER JOIN tipo t ON p.id_tipo = t.id_tipo
        ${whereClause}
        ORDER BY p.nombre
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `, [...queryParams, limit, offset]);
      
      // Contar total para paginación
      const countResult = await client.query(`
        SELECT COUNT(*) as total
        FROM producto p
        INNER JOIN tipo t ON p.id_tipo = t.id_tipo
        ${whereClause}
      `, queryParams);
      
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);
      
      return NextResponse.json({
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en API /products/simple:', err);
    return NextResponse.json({ error: 'Error en la base de datos: ' + err.message }, { status: 500 });
  }
}
