import { NextResponse } from "next/server";
import pkg from "pg";

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'

const pool = new Pool({ connectionString });

const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

function getArgentinaDateTimeParts() {
    const fechaActual = new Date();
    const partes = new Intl.DateTimeFormat('es-AR', {
        timeZone: ARGENTINA_TIMEZONE,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).formatToParts(fechaActual);

    const getParte = (type) => partes.find((p) => p.type === type)?.value ?? '';

    return {
        dia: Number(getParte('day')),
        mes: Number(getParte('month')),
        anio: Number(getParte('year')),
        hora: `${getParte('hour')}:${getParte('minute')}`,
    };
}

export async function POST(request) {
    try {
        const ventaData = await request.json();
        
        // Usar siempre hora local de Argentina para evitar desfases por zona horaria del servidor
        const { dia, mes, anio, hora } = getArgentinaDateTimeParts();

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Convertir array de formas de pago a string
            const formaPago = Array.isArray(ventaData.formasPago) 
                ? ventaData.formasPago.join(' - ') 
                : ventaData.formasPago || '';

            // Insertar la factura como ingreso
            const facturaQuery = `
                INSERT INTO factura (
                    dia, mes, anio, hora, tipo_factura, forma_de_pago, 
                    monto_total, detalle, id_usuario
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id_factura
            `;

            const idUsuario = parseInt(ventaData.id_usuario, 10);
            if (Number.isNaN(idUsuario)) {
                throw new Error('ID de usuario inválido o faltante');
            }

            const facturaValues = [
                dia,
                mes,
                anio,
                hora,
                'ingreso', // Tipo de factura para ventas
                formaPago,
                Math.round(ventaData.totalVenta * 100) / 100,
                ventaData.detalle || null,
                idUsuario
            ];

            const facturaResult = await client.query(facturaQuery, facturaValues);
            const idFactura = facturaResult.rows[0].id_factura;

            // Insertar los detalles de la factura y actualizar stock
            if (ventaData.productos && ventaData.productos.length > 0) {
                for (const producto of ventaData.productos) {
                    // Verificar que el producto existe y tiene stock suficiente
                    const stockQuery = 'SELECT stock, nombre FROM producto WHERE id_producto = $1';
                    const stockResult = await client.query(stockQuery, [producto.id_producto]);
                    
                    if (stockResult.rows.length === 0) {
                        throw new Error(`Producto con ID ${producto.id_producto} no encontrado`);
                    }
                    
                    const stockActual = stockResult.rows[0].stock;
                    const nombreProducto = stockResult.rows[0].nombre;
                    
                    if (stockActual < producto.cantidad) {
                        throw new Error(`Stock insuficiente para el producto ${nombreProducto}. Stock disponible: ${stockActual}, solicitado: ${producto.cantidad}`);
                    }

                    // Insertar detalle de factura
                    const detalleQuery = `
                        INSERT INTO detalle_factura (
                            id_factura, id_producto, cantidad, precio_unidad, precio_tot
                        ) VALUES ($1, $2, $3, $4, $5)
                    `;
                    
                    const precioTot = Math.round((producto.cantidad * producto.precioUnitario) * 100) / 100;
                    await client.query(detalleQuery, [
                        idFactura,
                        producto.id_producto,
                        producto.cantidad,
                        Math.round(producto.precioUnitario * 100) / 100,
                        precioTot
                    ]);

                    // Actualizar stock del producto
                    const updateStockQuery = `
                        UPDATE producto 
                        SET stock = stock - $1 
                        WHERE id_producto = $2
                    `;
                    await client.query(updateStockQuery, [producto.cantidad, producto.id_producto]);
                }
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Venta registrada exitosamente',
                data: {
                    id_factura: idFactura,
                    tipo_factura: 'ingreso',
                    monto_total: ventaData.totalVenta,
                    productos_vendidos: ventaData.productos.length
                }
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error al registrar venta:', err);
        return NextResponse.json({ error: 'Error al registrar la venta: ' + err.message }, { status: 500 });
    }
}
