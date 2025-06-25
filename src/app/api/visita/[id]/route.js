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
        const result = await client.query('SELECT * FROM visita WHERE id_visita = $1', [id]);
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
        const { fecha, diagnostico, frecuencia_cardiaca, frecuencia_respiratoria, id_mascota, id_usuario, peso } = body;
        const result = await client.query(
            `UPDATE visita SET fecha = $1, diagnostico = $2, frecuencia_cardiaca = $3, frecuencia_respiratoria = $4, id_mascota = $5, id_usuario = $6 WHERE id_visita = $7 RETURNING *`,
            [fecha, diagnostico, frecuencia_cardiaca, frecuencia_respiratoria, id_mascota, id_usuario, id]
        );
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
        const result = await client.query('DELETE FROM visita WHERE id_visita = $1', [id]);
        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Eliminada', id_visita: id });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
} 