import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

// Crear pool global para reutilizar conexiones entre requests
const pool = new Pool({ connectionString });

export async function GET(request) {
  try {
    const client = await pool.connect();
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 20;
      const search = searchParams.get('search') || '';
      const searchType = searchParams.get('searchType') || 'nombre';
      const tipo = searchParams.get('tipo') || '';
      const stockFilter = searchParams.get('stock') || '';
      
      const offset = (page - 1) * limit;
      
      // Construir condiciones WHERE dinámicamente
      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;
      
      if (search) {
        paramCount++;
        if (searchType === 'codigo') {
          // Buscar por ID del producto
          whereConditions.push(`p.id_producto::text ILIKE $${paramCount}`);
          queryParams.push(`%${search}%`);
        } else {
          // Buscar por nombre del producto (por defecto)
          whereConditions.push(`p.nombre ILIKE $${paramCount}`);
          queryParams.push(`%${search}%`);
        }
      }
      
      if (tipo) {
        paramCount++;
        whereConditions.push(`p.id_tipo = $${paramCount}`);
        queryParams.push(tipo);
      }
      
      if (stockFilter === 'bajo') {
        whereConditions.push(`p.stock < 10`);
      } else if (stockFilter === 'agotado') {
        whereConditions.push(`p.stock = 0`);
      } else if (stockFilter === 'disponible') {
        whereConditions.push(`p.stock > 0`);
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // Consulta optimizada con paginación
      const result = await client.query(`
        SELECT 
          p.id_producto,
          p.stock,
          p.nombre AS nombre_producto,
          p.marca,
          p.id_tipo,
          p.precio_costo,
          p.modificado,
          t.nombre AS nombre_tipo,
          -- Porcentajes efectivos (por producto) y por defecto (por tipo)
          COALESCE(dl.porcentaje_final, t.porcentaje_final) as porcentaje_final,
          COALESCE(dl.porcentaje_mayorista, t.porcentaje_mayorista) as porcentaje_mayorista,
          t.porcentaje_final as porcentaje_final_tipo,
          t.porcentaje_mayorista as porcentaje_mayorista_tipo
        FROM 
          producto p
        INNER JOIN tipo t ON p.id_tipo = t.id_tipo
        LEFT JOIN (
          SELECT 
            id_producto,
            porcentaje_mayorista,
            porcentaje_minorista as porcentaje_final
          FROM detalle_lista dl1
          WHERE dl1.id_detalle = (
            SELECT id_detalle 
            FROM detalle_lista dl2 
            WHERE dl2.id_producto = dl1.id_producto 
            ORDER BY dl2.id_detalle DESC 
            LIMIT 1
          )
        ) dl ON p.id_producto = dl.id_producto AND p.modificado = true
        ${whereClause}
        ORDER BY p.id_producto
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `, [...queryParams, limit, offset]);
      
      // Obtener total de registros para paginación
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
        success: true,
        id: result.rows[0].id_producto,
        message: 'Producto creado exitosamente'
      }, { status: 201 });
    
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al crear producto:', err);
    
    return NextResponse.json({ error: 'Error interno del servidor: ' + err.message }, { status: 500 });
  }
}
