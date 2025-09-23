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
      // Obtener todas las estadísticas en una sola consulta optimizada
      const mesActual = new Date().getMonth() + 1;
      const anioActual = new Date().getFullYear();
      
      // Calcular mes anterior
      const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
      const anioAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

      const result = await client.query(`
        WITH stats AS (
          SELECT 
            (SELECT COUNT(*) FROM cliente) as total_clientes,
            (SELECT COUNT(*) FROM producto WHERE stock > 0) as total_productos,
            (SELECT COUNT(*) FROM mascota) as total_mascotas,
            (SELECT COALESCE(SUM(CAST(monto_total AS DECIMAL)), 0) 
             FROM factura 
             WHERE tipo_factura = 'ingreso' 
             AND mes = $1 
             AND anio = $2) as ingresos_mes,
            (SELECT COALESCE(SUM(CAST(monto_total AS DECIMAL)), 0) 
             FROM factura 
             WHERE tipo_factura = 'ingreso' 
             AND mes = $3 
             AND anio = $4) as ingresos_mes_anterior,
            (SELECT COALESCE(SUM(CAST(monto_total AS DECIMAL)), 0) 
             FROM factura 
             WHERE tipo_factura = 'ingreso') as ingresos_totales
        )
        SELECT * FROM stats
      `, [mesActual, anioActual, mesAnterior, anioAnterior]);
      
      const data = result.rows[0];
      const ingresosActual = parseFloat(data.ingresos_mes);
      const ingresosAnterior = parseFloat(data.ingresos_mes_anterior);
      
      // Calcular porcentaje de cambio real
      let cambioIngresos = 0;
      if (ingresosAnterior > 0) {
        cambioIngresos = Math.round(((ingresosActual - ingresosAnterior) / ingresosAnterior) * 100);
      } else if (ingresosActual > 0) {
        // Si no hay ingresos del mes anterior pero sí del actual, es 100% de crecimiento
        cambioIngresos = 100;
      }
      
      const stats = {
        totalClientes: {
          valor: parseInt(data.total_clientes),
          cambio: 0
        },
        totalProductos: {
          valor: parseInt(data.total_productos),
          cambio: 0
        },
        totalMascotas: {
          valor: parseInt(data.total_mascotas),
          cambio: 0
        },
        ingresosMes: {
          valor: ingresosActual,
          cambio: cambioIngresos
        },
        ingresosTotales: {
          valor: parseFloat(data.ingresos_totales),
          cambio: 0
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
