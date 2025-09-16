import { Pool } from "pg";
import { NextResponse } from "next/server";

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
})

export async function GET() {
    try {
        const result = await pool.query(`
            SELECT 
                f.id_factura,
                f.tipo_factura,
                f.dia,
                f.mes,
                f.anio,
                f.hora,
                f.forma_de_pago,
                f.monto_total,
                f.detalle,
                f.id_usuario,
                CONCAT(u.nombre, ' ', u.apellido) as nombre_usuario
            FROM factura f
            LEFT JOIN usuario u ON f.id_usuario = u.id_usuario
            ORDER BY f.anio DESC, f.mes DESC, f.dia DESC, f.hora DESC
        `); 

        return NextResponse.json(result.rows);
    } catch (err) {
        console.error('Error al obtener facturas:', err);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

