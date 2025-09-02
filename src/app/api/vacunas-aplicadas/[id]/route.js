"use server";
import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;
const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({ connectionString });

export async function GET(request, { params }) {
    let client;
    try {
        client = await pool.connect();
        const { id } = await params;
        const result = await client.query('SELECT * FROM vacuna_aplicada WHERE id_vacuna_aplicada = $1', [id]);
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
        }
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}

export async function PUT(request, { params }) {
    let client;
    try {
        client = await pool.connect();
        const { id } = await params;
        const body = await request.json();
        const { nombre_vacuna, fecha_aplicacion, duracion_meses, observaciones } = body;
        const result = await client.query(
            `UPDATE vacuna_aplicada SET nombre_vacuna = $1, fecha_aplicacion = $2, duracion_meses = $3, observaciones = $4 WHERE id_vacuna_aplicada = $5 RETURNING *`,
            [nombre_vacuna, fecha_aplicacion, duracion_meses, observaciones, id]
        );
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
        }
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}

export async function DELETE(request, { params }) {
    let client;
    try {
        client = await pool.connect();
        const { id } = await params;
        const result = await client.query('DELETE FROM vacuna_aplicada WHERE id_vacuna_aplicada = $1', [id]);
        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Eliminada', id_vacuna_aplicada: id });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
} 