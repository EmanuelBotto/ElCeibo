"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      // Obtener actividades recientes de forma simplificada
      const activities = [];

      // 1. Ventas recientes (últimas 3) - solo facturas de tipo ingreso
      const ventasRecientes = await client.query(`
        SELECT 
          id_factura,
          monto_total,
          forma_de_pago
        FROM factura 
        WHERE tipo_factura = 'ingreso'
        ORDER BY id_factura DESC 
        LIMIT 3
      `);

      ventasRecientes.rows.forEach(venta => {
        const monto = parseFloat(venta.monto_total) || 0;
        activities.push({
          id: `venta_${venta.id_factura}`,
          type: "venta",
          message: `Venta realizada: $${monto.toFixed(2)} (${venta.forma_de_pago})`,
          time: "Reciente",
          icon: "DollarSign"
        });
      });

      // 2. Productos recientes (últimos 2)
      const productosRecientes = await client.query(`
        SELECT 
          id_producto,
          nombre
        FROM producto 
        ORDER BY id_producto DESC 
        LIMIT 2
      `);

      productosRecientes.rows.forEach(producto => {
        activities.push({
          id: `producto_${producto.id_producto}`,
          type: "producto",
          message: `Producto agregado: ${producto.nombre}`,
          time: "Reciente",
          icon: "Package"
        });
      });

      // 3. Mascotas recientes (últimas 2)
      const mascotasRecientes = await client.query(`
        SELECT 
          m.id_mascota,
          m.nombre,
          c.nombre as nombre_cliente,
          c.apellido as apellido_cliente
        FROM mascota m
        JOIN cliente c ON m.id_cliente = c.id_clinete
        ORDER BY m.id_mascota DESC 
        LIMIT 2
      `);

      mascotasRecientes.rows.forEach(mascota => {
        activities.push({
          id: `mascota_${mascota.id_mascota}`,
          type: "ficha",
          message: `Ficha creada: Mascota '${mascota.nombre}' de ${mascota.nombre_cliente} ${mascota.apellido_cliente}`,
          time: "Reciente",
          icon: "FileText"
        });
      });

      // Ordenar por ID (más reciente primero) y limitar a 6 actividades
      const actividadesOrdenadas = activities
        .sort((a, b) => {
          const idA = parseInt(a.id.split('_')[1]);
          const idB = parseInt(b.id.split('_')[1]);
          return idB - idA;
        })
        .slice(0, 6);

      return NextResponse.json(actividadesOrdenadas);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en API /dashboard/activities:', err);
    return NextResponse.json({ error: 'Error en la base de datos: ' + err.message }, { status: 500 });
  }
}
