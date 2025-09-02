import { NextResponse }  from "next/server";
import pkg from "pg";

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'

const pool = new Pool({ connectionString });

export async function POST(request) {
    try {
        const egresoData = await request.json();
        
        // Obtener fecha y hora actual automáticamente
        const fechaActual = new Date();
        const dia = fechaActual.getDate();
        const mes = fechaActual.getMonth() + 1; // getMonth() devuelve 0-11
        const anio = fechaActual.getFullYear();
        const horas = String(fechaActual.getHours()).padStart(2, '0');
        const minutos = String(fechaActual.getMinutes()).padStart(2, '0');
        const hora = `${horas}:${minutos}`;

        const client = await pool.connect();
        
        try {
            // Convertir array de formas de pago a string
            const formaPago = Array.isArray(egresoData.formasPago) 
                ? egresoData.formasPago.join(' - ') 
                : egresoData.formasPago || '';

                console.log(formaPago);

            const query = `
                INSERT INTO factura (
                    dia, mes, anio, hora, tipo_factura, forma_de_pago, 
                    monto_total, detalle, id_distribuidor, id_usuario
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `;

            const values = [
                dia,
                mes,
                anio,
                hora,
                egresoData.tipo || 'otros',
                formaPago,
                egresoData.monto,
                egresoData.detalle || null,
                egresoData.id_distribuidor || null,
                egresoData.id_usuario || 1 // Usuario por defecto si no se especifica
            ];

            const result = await client.query(query, values);

            return NextResponse.json({
                success: true,
                message: 'Egreso registrado exitosamente',
                data: result.rows[0]
            });

        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error al registrar egreso:', err);
        return NextResponse.json({ error: 'Error al registrar el egreso: ' + err.message }, { status: 500 });
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