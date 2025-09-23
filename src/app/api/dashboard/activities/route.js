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
      // Obtener actividades recientes de diferentes fuentes
      const activities = [];

      console.log('🔍 Iniciando consulta de actividades...');

      // Verificar si las tablas existen
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('cliente', 'producto', 'mascota', 'factura')
      `);
      console.log('📋 Tablas encontradas:', tableCheck.rows.map(r => r.table_name));

      // 1. Clientes recientes (últimos 5)
      let clientesRecientes;
      try {
        clientesRecientes = await client.query(`
          SELECT 
            id_cliente,
            nombre,
            apellido,
            'cliente' as tipo
          FROM cliente 
          ORDER BY id_cliente DESC 
          LIMIT 5
        `);
      } catch (error) {
        console.error('❌ Error en consulta de clientes:', error.message);
        clientesRecientes = { rows: [] };
      }

      console.log('👥 Clientes encontrados:', clientesRecientes.rows.length);
      clientesRecientes.rows.forEach(cliente => {
        activities.push({
          id: `cliente_${cliente.id_cliente}`,
          type: "cliente",
          message: `Nuevo cliente registrado: ${cliente.nombre} ${cliente.apellido}`,
          time: "Reciente",
          icon: "Users"
        });
      });

      // 2. Productos recientes (últimos 3)
      let productosRecientes;
      try {
        productosRecientes = await client.query(`
          SELECT 
            id_producto,
            nombre,
            'producto' as tipo
          FROM producto 
          ORDER BY id_producto DESC 
          LIMIT 3
        `);
      } catch (error) {
        console.error('❌ Error en consulta de productos:', error.message);
        productosRecientes = { rows: [] };
      }

      console.log('📦 Productos encontrados:', productosRecientes.rows.length);
      productosRecientes.rows.forEach(producto => {
        activities.push({
          id: `producto_${producto.id_producto}`,
          type: "producto",
          message: `Producto agregado: ${producto.nombre}`,
          time: "Reciente",
          icon: "Package"
        });
      });

      // 3. Mascotas recientes (últimas 3)
      const mascotasRecientes = await client.query(`
        SELECT 
          m.id_mascota,
          m.nombre,
          c.nombre as nombre_cliente,
          c.apellido as apellido_cliente,
          'mascota' as tipo
        FROM mascota m
        JOIN cliente c ON m.id_cliente = c.id_cliente
        ORDER BY m.id_mascota DESC 
        LIMIT 3
      `);

      console.log('🐕 Mascotas encontradas:', mascotasRecientes.rows.length);
      mascotasRecientes.rows.forEach(mascota => {
        activities.push({
          id: `mascota_${mascota.id_mascota}`,
          type: "ficha",
          message: `Ficha creada: Mascota '${mascota.nombre}' de ${mascota.nombre_cliente} ${mascota.apellido_cliente}`,
          time: "Reciente",
          icon: "FileText"
        });
      });

      // 4. Ventas recientes (últimas 3)
      const ventasRecientes = await client.query(`
        SELECT 
          id_factura,
          monto_total,
          'venta' as tipo
        FROM factura 
        ORDER BY id_factura DESC 
        LIMIT 3
      `);

      console.log('💰 Ventas encontradas:', ventasRecientes.rows.length);
      ventasRecientes.rows.forEach(venta => {
        activities.push({
          id: `venta_${venta.id_factura}`,
          type: "venta",
          message: `Venta realizada: $${venta.monto_total?.toFixed(2) || '0.00'}`,
          time: "Reciente",
          icon: "DollarSign"
        });
      });

      // Ordenar por ID (más reciente primero) y limitar a 8 actividades
      const actividadesOrdenadas = activities
        .sort((a, b) => {
          const idA = parseInt(a.id.split('_')[1]);
          const idB = parseInt(b.id.split('_')[1]);
          return idB - idA;
        })
        .slice(0, 8);

      console.log('📋 Total actividades encontradas:', activities.length);
      console.log('📋 Actividades ordenadas:', actividadesOrdenadas.length);
      console.log('📋 Actividades finales:', actividadesOrdenadas);

      return NextResponse.json(actividadesOrdenadas);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en API /dashboard/activities:', err);
    return NextResponse.json({ error: 'Error en la base de datos: ' + err.message }, { status: 500 });
  }
}
