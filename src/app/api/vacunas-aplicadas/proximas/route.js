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
        // Obtener todas las vacunas con su fecha próxima
        const result = await client.query(`
            SELECT *, 
                (fecha_aplicacion + (duracion_meses || ' months')::interval) AS fecha_proxima
            FROM vacuna_aplicada
            WHERE id_mascota = $1
            ORDER BY fecha_aplicacion DESC, fecha_proxima ASC
        `, [id_mascota]);
        
        const hoy = new Date();
        const proximas = result.rows.map(row => {
            const fechaProxima = new Date(row.fecha_proxima);
            const fechaAplicacion = new Date(row.fecha_aplicacion);
            const diff = (fechaProxima - hoy) / (1000 * 60 * 60 * 24);
            const diasDesdeAplicacion = (hoy - fechaAplicacion) / (1000 * 60 * 60 * 24);
            
            // Agregar información sobre el estado
            row.estado = 'normal';
            if (diff < 0) {
                row.estado = 'vencida';
            } else if (diff <= 7) {
                row.estado = 'muy_proxima';
            } else if (diff <= 30) {
                row.estado = 'proxima';
            } else if (diasDesdeAplicacion <= 7) {
                row.estado = 'reciente';
            }
            
            return row;
        });
        return NextResponse.json(proximas);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
} 