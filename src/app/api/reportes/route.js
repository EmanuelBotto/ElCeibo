import { Pool } from "pg";
import * as XLSX from 'xlsx';

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

export async function POST(request) {
    try {
        // Probar conexión a la base de datos
        await pool.query('SELECT NOW()');
        
        const { tipoReporte, fechaInicio, fechaFin } = await request.json();
        
        if (!tipoReporte) {
            return new Response(JSON.stringify({ error: 'Tipo de reporte es requerido' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        let query = '';
        let fileName = '';
        
        switch (tipoReporte) {
            case 'ventas':
                query = `
                    SELECT 
                        tipo_factura,
                        dia,
                        mes,
                        anio,
                        hora,
                        forma_de_pago,
                        monto_total
                    FROM factura 
                    WHERE tipo_factura = 'venta'
                    ${fechaInicio && fechaFin ? `AND (anio || '-' || LPAD(mes::text, 2, '0') || '-' || LPAD(dia::text, 2, '0'))::date BETWEEN '${fechaInicio}' AND '${fechaFin}'` : ''}
                    ORDER BY anio DESC, mes DESC, dia DESC
                    LIMIT 100
                `;
                fileName = `Reporte_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
                
            case 'compras':
                query = `
                    SELECT 
                        tipo_factura,
                        dia,
                        mes,
                        anio,
                        hora,
                        forma_de_pago,
                        monto_total
                    FROM factura 
                    WHERE tipo_factura = 'compra'
                    ${fechaInicio && fechaFin ? `AND (anio || '-' || LPAD(mes::text, 2, '0') || '-' || LPAD(dia::text, 2, '0'))::date BETWEEN '${fechaInicio}' AND '${fechaFin}'` : ''}
                    ORDER BY anio DESC, mes DESC, dia DESC
                    LIMIT 100
                `;
                fileName = `Reporte_Compras_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
                
            case 'productos':
                // Traer toda la información de la tabla producto
                try {
                    await pool.query('SELECT 1 FROM producto LIMIT 1');
                    query = `SELECT * FROM producto ORDER BY 1 LIMIT 100`;
                } catch (tableErr) {
                    query = `
                        SELECT 
                            1 as id,
                            'Producto Ejemplo' as nombre,
                            'Descripción de ejemplo' as descripcion,
                            100.00 as precio,
                            50 as stock,
                            'Categoría Ejemplo' as categoria,
                            'Proveedor Ejemplo' as proveedor
                    `;
                }
                fileName = `Reporte_Productos_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
                
            case 'clientes':
                // Traer toda la información de la tabla cliente
                try {
                    await pool.query('SELECT 1 FROM cliente LIMIT 1');
                    query = `SELECT * FROM cliente ORDER BY 1 LIMIT 100`;
                } catch (tableErr) {
                    query = `
                        SELECT 
                            1 as id,
                            'Cliente' as nombre,
                            'Ejemplo' as apellido,
                            'cliente@ejemplo.com' as email,
                            '123456789' as telefono,
                            'Dirección Ejemplo' as direccion,
                            NOW() as fecha_registro
                    `;
                }
                fileName = `Reporte_Clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
                
            case 'mascotas':
                // Traer toda la información de la tabla mascota
                try {
                    await pool.query('SELECT 1 FROM mascota LIMIT 1');
                    query = `SELECT * FROM mascota ORDER BY 1 LIMIT 100`;
                } catch (tableErr) {
                    query = `
                        SELECT 
                            1 as id,
                            'Mascota' as nombre,
                            'Perro' as especie,
                            'Ejemplo' as raza,
                            5 as edad,
                            20.5 as peso,
                            1 as cliente_id,
                            NOW() as fecha_registro
                    `;
                }
                fileName = `Reporte_Mascotas_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
                
            default:
                return new Response(JSON.stringify({ error: 'Tipo de reporte no válido' }), { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'No hay datos para generar el reporte' }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Convertir a Excel
        const headers = Object.keys(result.rows[0]);
        
        // Crear el workbook y worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(result.rows);
        
        // Agregar el worksheet al workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
        
        // Generar el archivo Excel como buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        // Cambiar la extensión del archivo a .xlsx
        fileName = fileName.replace('.csv', '.xlsx');
        
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
        console.error('Stack trace:', err.stack);
        console.error('Código de error:', err.code);
        console.error('Mensaje de error:', err.message);
        
        // Verificar si es un error de conexión
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
            return new Response(JSON.stringify({ error: 'Error de conexión a la base de datos' }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Verificar si es un error de tabla no encontrada
        if (err.message && err.message.includes('relation') && err.message.includes('does not exist')) {
            return new Response(JSON.stringify({ 
                error: 'La tabla requerida no existe en la base de datos',
                table: err.message.match(/relation "([^"]+)"/)?.[1] || 'desconocida'
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Verificar si es un error de autenticación
        if (err.code === '28P01') {
            return new Response(JSON.stringify({ error: 'Error de autenticación en la base de datos' }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({ 
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? err.message : 'Error interno',
            code: err.code || 'UNKNOWN'
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
