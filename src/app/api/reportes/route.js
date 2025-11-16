import { Pool } from "pg";
import * as XLSX from 'xlsx';

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

export async function GET() {
    return new Response(JSON.stringify({ message: 'API de reportes funcionando correctamente' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function POST(request) {
    try {
        const { tipoReporte, fechaInicio, fechaFin } = await request.json();

        if (!tipoReporte) {
            return new Response(JSON.stringify({ error: 'Tipo de reporte es requerido' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let query = '';
        let fileName = '';
        let queryParams = [];

        /** ===========================
         *     FILTRO POR FECHAS
         *  =========================== */

        let fechaCondition = '';
        if (fechaInicio && fechaFin) {
            const fechaInicioFormatted = fechaInicio.includes('-')
                ? fechaInicio
                : `${fechaInicio.substring(0, 4)}-${fechaInicio.substring(4, 6)}-${fechaInicio.substring(6, 8)}`;

            const fechaFinFormatted = fechaFin.includes('-')
                ? fechaFin
                : `${fechaFin.substring(0, 4)}-${fechaFin.substring(4, 6)}-${fechaFin.substring(6, 8)}`;

            fechaCondition = `AND (
                (f.anio > EXTRACT(YEAR FROM $1::date)) OR 
                (f.anio = EXTRACT(YEAR FROM $1::date) AND f.mes > EXTRACT(MONTH FROM $1::date)) OR
                (f.anio = EXTRACT(YEAR FROM $1::date) AND f.mes = EXTRACT(MONTH FROM $1::date) AND f.dia >= EXTRACT(DAY FROM $1::date))
            ) AND (
                (f.anio < EXTRACT(YEAR FROM $2::date)) OR 
                (f.anio = EXTRACT(YEAR FROM $2::date) AND f.mes < EXTRACT(MONTH FROM $2::date)) OR
                (f.anio = EXTRACT(YEAR FROM $2::date) AND f.mes = EXTRACT(MONTH FROM $2::date) AND f.dia <= EXTRACT(DAY FROM $2::date))
            )`;

            queryParams = [fechaInicioFormatted, fechaFinFormatted];
        }

        /** ===========================
         *         REPORTES
         *  =========================== */

        switch (tipoReporte) {

            /** ===========================
             *       REPORTE VENTAS
             *    (UNA FILA POR PRODUCTO)
             *  =========================== */
            case 'ventas':
                query = `
                    SELECT
                        CONCAT(f.dia, '/', f.mes, '/', f.anio) AS fecha,
                        f.hora,
                        f.forma_de_pago,
                        p.nombre AS producto,
                        df.cantidad,
                        df.precio_unidad AS pu,
                        df.precio_tot AS pt,
                        f.monto_total,
                        CONCAT(u.nombre, ' ', u.apellido) AS usuario
                    FROM factura f
                    LEFT JOIN usuario u ON f.id_usuario = u.id_usuario
                    LEFT JOIN detalle_factura df ON df.id_factura = f.id_factura
                    LEFT JOIN producto p ON p.id_producto = df.id_producto
                    WHERE f.tipo_factura = 'ingreso'
                    ${fechaCondition}
                    ORDER BY df.id_detalle;
                `;
                fileName = `Reporte_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;

            /** ===========================
             *       REPORTE COMPRAS
             *    (UNA FILA POR PRODUCTO)
             *  =========================== */
            case 'compras':
                query = `
                    SELECT
                        CONCAT(f.dia, '/', f.mes, '/', f.anio) AS fecha,
                        f.hora,
                        f.forma_de_pago,
                        p.nombre AS producto,
                        df.cantidad,
                        df.precio_unidad AS pu,
                        df.precio_tot AS pt,
                        f.monto_total,
                        CONCAT(u.nombre, ' ', u.apellido) AS usuario
                    FROM factura f
                    LEFT JOIN usuario u ON f.id_usuario = u.id_usuario
                    LEFT JOIN detalle_factura df ON df.id_factura = f.id_factura
                    LEFT JOIN producto p ON p.id_producto = df.id_producto
                    WHERE f.tipo_factura IN ('varios','distribuidor')
                    ${fechaCondition}
                    ORDER BY df.id_detalle;
                `;
                fileName = `Reporte_Compras_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;

            /** ===========================
             *       PRODUCTOS
             *  =========================== */
            case 'productos':
                query = `SELECT nombre, descripcion, precio, stock, categoria, proveedor FROM producto ORDER BY nombre`;
                fileName = `Reporte_Productos_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;

            /** ===========================
             *       CLIENTES
             *  =========================== */
            case 'clientes':
                query = `
                    SELECT 
                        nombre, 
                        apellido, 
                        email, 
                        telefono, 
                        direccion,
                        fecha_registro
                    FROM cliente
                    ORDER BY apellido
                `;
                fileName = `Reporte_Clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;

            /** ===========================
             *       MASCOTAS
             *  =========================== */
            case 'mascotas':
                query = `
                    SELECT 
                    m.nombre,
                    m.especie,
                    m.raza,
                    m.sexo,
                    m.edad,
                    m.peso,
                    CONCAT(c.nombre, ' ', c.apellido) AS cliente,
                    CONCAT(m.dia, '/', m.mes, '/', m.anio) AS fecha_registro
                FROM mascota m
                LEFT JOIN cliente c ON m.id_cliente = c.id_clinete
                ORDER BY m.nombre
                LIMIT 200;

                `;
                fileName = `Reporte_Mascotas_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;

            default:
                return new Response(JSON.stringify({ error: 'Tipo de reporte no válido' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }

        /** ===========================
         *    EJECUTAR CONSULTA
         *  =========================== */

        const result = await pool.query(query, queryParams);

        if (result.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'No hay datos para generar el reporte' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        /** ===========================
         *    LIMPIAR IDS INTERNOS
         *  =========================== */

        result.rows.forEach(row => {
            delete row.id_factura;
            delete row.id_producto;
            delete row.id_detalle;
            delete row.id_cliente;
            delete row.id_usuario;
        });

        /** ===========================
         *    CREAR ARCHIVO EXCEL
         *  =========================== */

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(result.rows);

        worksheet['!cols'] = Object.keys(result.rows[0]).map(col => ({ wch: 20 }));

        Object.keys(result.rows[0]).forEach((key, index) => {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
            if (!worksheet[cellAddress]) return;
            worksheet[cellAddress].s = { font: { bold: true } };
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new Response(excelBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': excelBuffer.length.toString()
            }
        });

    } catch (err) {
        console.error('Error detallado al generar reporte:', err);
        return new Response(JSON.stringify({
            error: 'Error interno del servidor',
            details: err.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
