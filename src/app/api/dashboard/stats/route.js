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
      // Obtener estadísticas en paralelo
      const [
        totalClientes,
        totalProductos,
        totalMascotas,
        ingresosMes
      ] = await Promise.all([
        // Total de clientes
        client.query('SELECT COUNT(*) as total FROM cliente'),
        
        // Total de productos activos (con stock > 0)
        client.query('SELECT COUNT(*) as total FROM producto WHERE stock > 0'),
        
        // Total de mascotas
        client.query('SELECT COUNT(*) as total FROM mascota'),
        
        // Ingresos del mes actual
        client.query(`
          SELECT COALESCE(SUM(monto_total), 0) as total
          FROM factura 
          WHERE mes = $1 AND anio = $2
        `, [new Date().getMonth() + 1, new Date().getFullYear()])
      ]);

      // Obtener estadísticas del mes anterior para calcular cambios
      const [
        clientesMesAnterior,
        productosMesAnterior,
        mascotasMesAnterior,
        ingresosMesAnterior
      ] = await Promise.all([
        // Clientes del mes anterior (aproximado)
        client.query(`
          SELECT COUNT(*) as total 
          FROM cliente 
          WHERE id_clinete <= (SELECT MAX(id_clinete) FROM cliente) - $1
        `, [Math.floor(totalClientes.rows[0].total * 0.1)]), // Aproximación
        
        // Productos del mes anterior
        client.query(`
          SELECT COUNT(*) as total 
          FROM producto 
          WHERE stock > 0 AND id_producto <= (SELECT MAX(id_producto) FROM producto) - $1
        `, [Math.floor(totalProductos.rows[0].total * 0.05)]), // Aproximación
        
        // Mascotas del mes anterior
        client.query(`
          SELECT COUNT(*) as total 
          FROM mascota 
          WHERE id_mascota <= (SELECT MAX(id_mascota) FROM mascota) - $1
        `, [Math.floor(totalMascotas.rows[0].total * 0.15)]), // Aproximación
        
        // Ingresos del mes anterior
        client.query(`
          SELECT COALESCE(SUM(monto_total), 0) as total
          FROM factura 
          WHERE mes = $1 AND anio = $2
        `, [new Date().getMonth(), new Date().getFullYear()])
      ]);

      // Calcular porcentajes de cambio
      const calcularCambio = (actual, anterior) => {
        if (anterior === 0) return actual > 0 ? 100 : 0;
        return Math.round(((actual - anterior) / anterior) * 100);
      };

      const stats = {
        totalClientes: {
          valor: totalClientes.rows[0].total,
          cambio: calcularCambio(totalClientes.rows[0].total, clientesMesAnterior.rows[0].total)
        },
        totalProductos: {
          valor: totalProductos.rows[0].total,
          cambio: calcularCambio(totalProductos.rows[0].total, productosMesAnterior.rows[0].total)
        },
        totalMascotas: {
          valor: totalMascotas.rows[0].total,
          cambio: calcularCambio(totalMascotas.rows[0].total, mascotasMesAnterior.rows[0].total)
        },
        ingresosMes: {
          valor: ingresosMes.rows[0].total,
          cambio: calcularCambio(ingresosMes.rows[0].total, ingresosMesAnterior.rows[0].total)
        }
      };

      return NextResponse.json(stats);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en API /dashboard/stats:', err);
    return NextResponse.json({ error: 'Error en la base de datos: ' + err.message }, { status: 500 });
  }
}
