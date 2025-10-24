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
                f.num_factura,
                f.borrado,
                CONCAT(u.nombre, ' ', u.apellido) as nombre_usuario
            FROM factura f
            LEFT JOIN usuario u ON f.id_usuario = u.id_usuario
            WHERE f.borrado = false
            ORDER BY f.anio DESC, f.mes DESC, f.dia DESC, f.hora DESC
        `); 

        // Obtener cantidad de productos para cada factura por separado
        const facturasConProductos = await Promise.all(
            result.rows.map(async (factura) => {
                try {
                    const countResult = await pool.query(
                        'SELECT COUNT(*) as cantidad FROM detalle_factura WHERE id_factura = $1',
                        [factura.id_factura]
                    );
                    return {
                        ...factura,
                        cantidad_productos: parseInt(countResult.rows[0].cantidad) || 0
                    };
                } catch {
                    return {
                        ...factura,
                        cantidad_productos: 0
                    };
                }
            })
        );

        return NextResponse.json(facturasConProductos);
    } catch {
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { id_factura } = await request.json();
        
        if (!id_factura) {
            return NextResponse.json({ error: 'ID de factura requerido' }, { status: 400 });
        }

        // Marcar la factura como eliminada lógicamente (activo = false)
        const result = await pool.query(
            'UPDATE factura SET borrado = true WHERE id_factura = $1',
            [id_factura]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
        }

        return NextResponse.json({ 
            message: 'Factura eliminada exitosamente',
            id_factura: id_factura 
        });
    } catch (err) {
        console.error('Error al eliminar factura:', err);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

