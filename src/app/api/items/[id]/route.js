"use server";
import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({ connectionString });

export async function GET(request, { params }) {
    try {
        const client = await pool.connect();
        const { id } = await params;
        const result = await client.query('SELECT * FROM items WHERE id_item = $1', [id]);
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
        }
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener item:', error);
        return NextResponse.json({ error: 'Error al obtener el item: ' + error.message }, { status: 500 });
    } finally {
        client.release();   
    }
}

export async function PUT(request, { params }) {
    let client;
    try {
        client = await pool.connect();
        const { id } = await params;
        const body = await request.json();

        const {
            rubro = '',
            detalle = '',
            prospecto = '',
            duracion = ''
        } = body;

        // Chequear si ya existe otro item con el mismo detalle
        const existingItem = await client.query(
            'SELECT * FROM items WHERE detalle = $1 AND id_item != $2',
            [detalle.trim(), id]
        );
        if (existingItem.rows.length > 0) {
            return NextResponse.json({ error: 'Ya existe otro item con este detalle' }, { status: 400 });
        }

        const result = await client.query(`UPDATE items 
            SET rubro = $1, 
                detalle = $2, 
                prospecto = $3, 
                duracion = $4 
            WHERE id_item = $5 
            returning *`, 
            [
                rubro.trim(),
                detalle.trim(),
                prospecto.trim(),
                duracion.toString().trim(),
                id
            ]);
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
        }
        return NextResponse.json({
            message: 'Item actualizado exitosamente',
            item: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar item:', error);
        return NextResponse.json({ error: 'Error al actualizar el item: ' + error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}

export   async function DELETE(request, { params }) {
    try {
        const client = await pool.connect();
        const { id } = await params;
        const result = await client.query('DELETE FROM items WHERE id_item = $1', [id]);
        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
        }
        return NextResponse.json({
            message: 'Item eliminado exitosamente',
            id_item: id
        });
    } catch (error) {
        console.error('Error al eliminar item:', error);
        return NextResponse.json({ error: 'Error al eliminar el item: ' + error.message }, { status: 500 });
    } finally {
        client.release();
    }
}