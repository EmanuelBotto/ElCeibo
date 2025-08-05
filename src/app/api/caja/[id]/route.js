import { NextResponse }  from "next/server";
import pkg from "pg";

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'

const pool = new Pool({ connectionString });

export async function PUT(request, { params}) {
    const { id } = params

    try {
        const factura = await request.json();
        
        const client = await pool.connect();

        try {
            const checkQuery = 'SELECT * FROM factura WHERE id_factura = $1';
            const checkResult = await client.query(checkQuery, [id]);

            if (checkResult.rows.length === 0) {
                console.log('Factura no encontrada en la base de datos');
                return NextResponse.json(
                    { error: 'Factura no encontrada' },
                    { status: 404 }
                );
            }

            const query = `
                UPDATE factura 
                SET 
                    dia = COALESCE($1, dia),
                    mes = COALESCE($2, mes),
                    anio = COALESCE($3, anio),
                    hora = COALESCE($4, hora),
                    tipo_factura = COALESCE($5, tipo_factura),
                    forma_de_pago = COALESCE($6, forma_de_pago),
                    total = COALESCE($7, total),
                    id_usuario = COALESCE($8, id_usuario)
                WHERE id_factura = $9
                RETURNING *
            `;

            const values = [
                factura.dia,
                factura.mes,
                factura.anio,
                factura.hora,
                factura.tipo_factura,
                factura.forma_de_pago,
                factura.total,
                factura.id_usuario,
                factura.id_factura
            ];

            const result = await client.query(query, values)

            if (result.rows.length === 0) {
                console.log('No se pudo actualizar la factura');
                return NextResponse.json(
                    { error: 'No se pudo actualizar la factura' },
                    { status: 500 }
                );
            }

            return NextResponse.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error detallado en API /caja/[id]:', err);
        return NextResponse.json({ error: 'Error en la base de datos: ' + err.message }, { status: 500 });
    }
}

export async function DELETE(_, { params}) {
    const  { id } = params;
    try {
        const client = await pool.connect ()
        try {
            const query = 'DELETE FROM factura WHERE id_factura = $1'
            await client.query(query, [id]);
            return NextResponse.json({ message: 'Factura eliminada' });

        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error detallado al eliminar factura:', err);
        return NextResponse.json({ error: 'Error al eliminar factura: ' + err.message }, { status: 500 });
    }
}