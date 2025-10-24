import { NextResponse } from "next/server";
import pkg from "pg";

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'

const pool = new Pool({ connectionString });

export async function GET(_, { params }) {
    const { id } = await params;
    
    try {
        const client = await pool.connect();
        
        try {
            // Obtener información de la factura
            const facturaQuery = `
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
                    f.num_factura,
                    f.id_distribuidor,
                    CONCAT(u.nombre, ' ', u.apellido) as nombre_usuario
                FROM factura f
                LEFT JOIN usuario u ON f.id_usuario = u.id_usuario
                WHERE f.id_factura = $1
            `;
            
            const facturaResult = await client.query(facturaQuery, [id]);
            
            if (facturaResult.rows.length === 0) {
                return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
            }
            
            const factura = facturaResult.rows[0];
            
            // Obtener detalles de productos vendidos
            const detallesQuery = `
                SELECT 
                    df.cantidad,
                    df.precio_unidad,
                    df.precio_tot,
                    p.nombre as nombre_producto,
                    p.marca
                FROM detalle_factura df
                INNER JOIN producto p ON df.id_producto = p.id_producto
                WHERE df.id_factura = $1
                ORDER BY df.id_detalle
            `;
            
            const detallesResult = await client.query(detallesQuery, [id]);
            
            return NextResponse.json({
                factura: factura,
                productos: detallesResult.rows
            });
            
        } finally {
            client.release();
        }
    } catch (err) {
        return NextResponse.json({ error: 'Error al obtener el detalle: ' + err.message }, { status: 500 });
    }
}
