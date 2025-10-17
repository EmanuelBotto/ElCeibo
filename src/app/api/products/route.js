import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

// Crear pool global para reutilizar conexiones entre requests
const pool = new Pool({ connectionString });

export async function GET(request) {
  try {
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const searchType = searchParams.get('searchType') || 'nombre';
    
    const client = await pool.connect();
    
    try {
      // Construir consulta con filtros opcionales
      let whereClause = '';
      let queryParams = [];
      
      if (search) {
        if (searchType === 'nombre') {
          whereClause = 'WHERE p.nombre ILIKE $1';
          queryParams.push(`%${search}%`);
        } else if (searchType === 'codigo') {
          whereClause = 'WHERE p.id_producto::text ILIKE $1';
          queryParams.push(`%${search}%`);
        } else if (searchType === 'marca') {
          whereClause = 'WHERE p.marca ILIKE $1';
          queryParams.push(`%${search}%`);
        } else if (searchType === 'tipo') {
          whereClause = 'WHERE t.nombre ILIKE $1';
          queryParams.push(`%${search}%`);
        }
      }
      
      // Primero obtener el total de productos para la paginación
      let countQuery = `
        SELECT COUNT(*) as total
        FROM producto p
        INNER JOIN tipo t ON p.id_tipo = t.id_tipo
        ${whereClause}
      `;
      
      const countResult = await client.query(countQuery, queryParams);
      const totalItems = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / limit);
      
      // Ahora obtener los productos de la página actual
      const query = `
        SELECT 
          p.id_producto,
          p.stock,
          p.nombre AS nombre_producto,
          p.marca,
          p.id_tipo,
          p.precio_costo,
          p.modificado,
          t.nombre AS nombre_tipo,
          t.porcentaje_final,
          t.porcentaje_mayorista
        FROM 
          producto p
        INNER JOIN tipo t ON p.id_tipo = t.id_tipo
        ${whereClause}
        ORDER BY p.id_producto
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;
      
      queryParams.push(limit, (page - 1) * limit);
      
      const result = await client.query(query, queryParams);
      
      return NextResponse.json({ 
        productos: result.rows,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalItems,
          itemsPerPage: limit
        }
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en API /products:', err);
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

      // Verificar si ya existe un producto con el mismo nombre y tipo
      const existingProduct = await client.query(
        `SELECT id_producto, nombre, id_tipo FROM producto 
         WHERE LOWER(nombre) = LOWER($1) AND id_tipo = $2`,
        [nombre.trim(), id_tipo]
      );

      if (existingProduct.rows.length > 0) {
        return NextResponse.json(
          { 
            error: 'Ya existe un producto con este nombre y tipo',
            duplicate: {
              id: existingProduct.rows[0].id_producto,
              nombre: existingProduct.rows[0].nombre,
              tipo: id_tipo
            }
          },
          { status: 409 } // Conflict status
        );
      }

      // Insertar el producto
      const result = await client.query(
        `INSERT INTO producto (nombre, marca, precio_costo, stock, id_tipo, modificado)
         VALUES ($1, $2, $3, $4, $5, false)
         RETURNING id_producto`,
        [nombre.trim(), marca?.trim() || '', precio_costo, stock, id_tipo]
      );

      const nuevoProducto = result.rows[0];

      return NextResponse.json({
        success: true,
        message: 'Producto creado exitosamente',
        producto: {
          id_producto: nuevoProducto.id_producto,
          nombre: nombre.trim(),
          marca: marca?.trim() || '',
          precio_costo: precio_costo,
          stock: stock,
          id_tipo: id_tipo
        }
      }, { status: 201 });
    
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al crear producto:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + err.message },
      { status: 500 }
    );
  }
}
