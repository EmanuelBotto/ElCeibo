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
        const { id } = await params; // id_mascota
        // Traer visitas con información del veterinario
        const visitasResult = await client.query(`
            SELECT v.*, u.nombre, u.apellido 
            FROM visita v 
            LEFT JOIN usuario u ON v.id_usuario = u.id_usuario 
            WHERE v.id_mascota = $1 
            ORDER BY v.fecha DESC
        `, [id]);
        const visitas = visitasResult.rows;
        // Traer vacunas aplicadas agrupadas por visita
        const vacunasResult = await client.query('SELECT * FROM vacuna_aplicada WHERE id_mascota = $1', [id]);
        // Si tuvieras tratamientos, podrías agregarlos aquí
        // const tratamientosResult = await client.query('SELECT * FROM tratamiento WHERE id_mascota = $1', [id]);
        // Mapear vacunas a cada visita
        const visitasConVacunas = visitas.map(visita => ({
            ...visita,
            vacunas: vacunasResult.rows.filter(v => v.id_visita === visita.id_visita)
        }));
        return NextResponse.json(visitasConVacunas);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
} 