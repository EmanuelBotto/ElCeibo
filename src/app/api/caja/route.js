import { Pool } from "pg";
import { NextResponse } from "next/server";

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
})

export async function GET() {
    try {
        const result = await pool.query(`
            SELECT 
                id_factura,
                tipo_factura,
                dia,
                mes,
                anio,
                hora,
                forma_de_pago,
                monto_total,
                detalle,
                id_usuario
                FROM factura
                ORDER BY anio DESC, mes DESC, dia DESC, hora DESC
        `); 

        return NextResponse.json(result.rows);
    } catch (err) {
        console.error('Error al obtener facturas:', err);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

