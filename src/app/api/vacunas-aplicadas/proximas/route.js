"use server";
import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;
const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({ connectionString });

export async function GET(request) {
    let client;
    try {
        client = await pool.connect();
        const { searchParams } = new URL(request.url);
        const id_mascota = searchParams.get('id_mascota');
        if (!id_mascota) {
            return NextResponse.json({ error: 'Falta id_mascota' }, { status: 400 });
        }
        // Vacunas cuya próxima aplicación es en los próximos 30 días o ya vencidas
        const result = await client.query(`
            SELECT *, 
                (fecha_aplicacion + (duracion_meses || ' months')::interval) AS fecha_proxima
            FROM vacuna_aplicada
            WHERE id_mascota = $1
            ORDER BY fecha_proxima ASC
        `, [id_mascota]);
        // Filtrar en JS las que están próximas (próximos 30 días o vencidas)
        const hoy = new Date();
        const proximas = result.rows.filter(row => {
            const fechaProxima = new Date(row.fecha_proxima);
            const diff = (fechaProxima - hoy) / (1000 * 60 * 60 * 24);
            return diff <= 30; // próximas 30 días o vencidas
        });
        return NextResponse.json(proximas);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
} 