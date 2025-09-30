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
        console.log('🔧 API de reportes recibida');
        
        const { tipoReporte, fechaInicio, fechaFin } = await request.json();
        
        console.log('🔧 Generando reporte:', { tipoReporte, fechaInicio, fechaFin });
        
        if (!tipoReporte) {
            return new Response(JSON.stringify({ error: 'Tipo de reporte es requerido' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        let query = '';
        let fileName = '';
        let queryParams = [];
        
        // Construir condición de fechas de forma segura
        let fechaCondition = '';
        if (fechaInicio && fechaFin) {
            // Asegurar que las fechas estén en formato YYYY-MM-DD
            const fechaInicioFormatted = fechaInicio.includes('-') ? fechaInicio : 
                `${fechaInicio.substring(0,4)}-${fechaInicio.substring(4,6)}-${fechaInicio.substring(6,8)}`;
            const fechaFinFormatted = fechaFin.includes('-') ? fechaFin : 
                `${fechaFin.substring(0,4)}-${fechaFin.substring(4,6)}-${fechaFin.substring(6,8)}`;
            
            // Usar una condición más simple y robusta
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
            console.log('📅 Filtro de fechas aplicado:', { 
                fechaInicio, 
                fechaFin, 
                fechaInicioFormatted, 
                fechaFinFormatted 
            });
        }
        
        switch (tipoReporte) {
            case 'ventas':
                query = `
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
                        CONCAT(u.nombre, ' ', u.apellido) as nombre_usuario,
                        f.num_factura
                    FROM factura f
                    LEFT JOIN usuario u ON f.id_usuario = u.id_usuario
                    WHERE f.tipo_factura = 'ingreso'
                    ${fechaCondition}
                    ORDER BY f.anio DESC, f.mes DESC, f.dia DESC, f.hora DESC
                `;
                fileName = `Reporte_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
                
            case 'compras':
                query = `
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
                        CONCAT(u.nombre, ' ', u.apellido) as nombre_usuario,
                        f.num_factura
                    FROM factura f
                    LEFT JOIN usuario u ON f.id_usuario = u.id_usuario
                    WHERE f.tipo_factura IN ('varios', 'distribuidor')
                    ${fechaCondition}
                    ORDER BY f.anio DESC, f.mes DESC, f.dia DESC, f.hora DESC
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
        
        // Primero, verificar qué datos hay en la tabla factura
        console.log('🔍 Verificando datos en tabla factura...');
        const testQuery = `SELECT id_factura, tipo_factura, dia, mes, anio, monto_total FROM factura ORDER BY anio DESC, mes DESC, dia DESC LIMIT 5`;
        const testResult = await pool.query(testQuery);
        console.log('📊 Datos de prueba en factura:', testResult.rows);
        
        console.log('📝 Ejecutando consulta:', query);
        console.log('📋 Parámetros:', queryParams);
        
        const result = await pool.query(query, queryParams);
        
        console.log('✅ Consulta ejecutada. Filas obtenidas:', result.rows.length);
        
        if (result.rows.length === 0) {
            console.log('⚠️ No hay datos para el reporte');
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
