"use server";
import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({ connectionString });

export async function GET(request, { params }) {
    try {
        const client = await pool.connect();
        const { id } = params;
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
    try {
        const client = await pool.connect();
        const { id } = params;
        const body = await request.json();
        //const result = await client.query('UPDATE items SET rubro = $1, detalle = $2, descripcion = $3, prospecto = $4, duracion = $5 WHERE id_item = $6', [body.rubro, body.detalle, body.descripcion, body.prospecto, body.duracion, id]);
        
        const {
            rubro,
            detalle,
            descripcion,
            prospecto,
            duracion
        } = body; 
        const existingItem = await client.query('SELECT * FROM items WHERE id_item = $1', [detalle.trim(), id]);
        if (existingItem.rows.length > 0) {
            return NextResponse.json({ error: 'Ya existe otro item con este detalle' }, { status: 400 });
        }

        const result = await client.query(`UPDATE items 
            SET rubro = $1, 
            detalle = $2, 
            descripcion = $3, 
            prospecto = $4, 
            duracion = $5 
            WHERE id_item = $6 
            returning *`, 
            [   
                rubro.trim(), 
                detalle.trim(), 
                descripcion.trim(), 
                prospecto.trim(), 
                duracion.trim(), 
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
        client.release();
    }
}

export   async function DELETE(request, { params }) {
    try {
        const client = await pool.connect();
        const { id } = params;
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