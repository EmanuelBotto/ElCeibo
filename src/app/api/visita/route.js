"use server";
import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;
const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({ connectionString });

export async function POST(request) {
    let client;
    try {
        client = await pool.connect();
        const body = await request.json();
        const { fecha, diagnostico, frecuencia_cardiaca, frecuencia_respiratoria, peso, id_mascota, id_usuario } = body;
        const result = await client.query(
            `INSERT INTO visita (fecha, diagnostico, frecuencia_cardiaca, frecuencia_respiratoria, peso, id_mascota, id_usuario)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [fecha, diagnostico, frecuencia_cardiaca, frecuencia_respiratoria, peso, id_mascota, id_usuario]
        );
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error en POST /api/visita:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}

export async function GET(request) {
    let client;
    try {
        client = await pool.connect();
        const { searchParams } = new URL(request.url);
        const id_mascota = searchParams.get('id_mascota');
        let result;
        if (id_mascota) {
            result = await client.query('SELECT * FROM visita WHERE id_mascota = $1 ORDER BY fecha DESC', [id_mascota]);
        } else {
            result = await client.query('SELECT * FROM visita ORDER BY fecha DESC');
        }
        return NextResponse.json(result.rows);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
} 