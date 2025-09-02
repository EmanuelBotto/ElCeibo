import { Pool } from "pg";

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
})

export async function GET() {
    try {
        const result = await pool.query(`
            SELECT 
                tipo_factura,
                dia,
                mes,
                anio,
                hora,
                forma_de_pago,
                monto_total
                FROM factura
                ORDER BY dia DESC
        `); 

        return new Response(JSON.stringify(result.rows), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (err) {
    console.error('Error al obtener facturas:', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
}