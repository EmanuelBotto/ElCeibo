import { NextResponse }  from "next/server";
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

            // Determinar el tipo de factura
            const tipoFactura = ventaData.productos && ventaData.productos.length > 0 ? 'ingreso' : (ventaData.tipo || 'egreso');

            // Insertar la factura
            const facturaQuery = `

                INSERT INTO factura (
                    dia, mes, anio, hora, tipo_factura, forma_de_pago, 
                    monto_total, detalle, id_distribuidor, id_usuario, num_factura
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id_factura
            `;

            const montoTotal = ventaData.monto || ventaData.totalVenta;
            const idUsuario = parseInt(ventaData.id_usuario, 10);

            if (Number.isNaN(idUsuario)) {
                throw new Error('ID de usuario inválido o faltante');
            }

            const facturaValues = [
                dia,
                mes,
                anio,
                hora,
                tipoFactura,
                formaPago,
                Math.round(montoTotal * 100) / 100,
                ventaData.detalle || null,
                ventaData.distribuidor || ventaData.id_distribuidor || null,
                idUsuario,
                ventaData.numeroRecibo || null
            ];

            const facturaResult = await client.query(facturaQuery, facturaValues);
            const idFactura = facturaResult.rows[0].id_factura;

            // Si es una venta con productos, insertar los detalles y actualizar stock
            if (ventaData.productos && ventaData.productos.length > 0) {
                for (const producto of ventaData.productos) {
                    // Verificar que el producto existe y tiene stock suficiente
                    const stockQuery = 'SELECT stock FROM producto WHERE id_producto = $1';
                    const stockResult = await client.query(stockQuery, [producto.id_producto]);
                    
                    if (stockResult.rows.length === 0) {
                        throw new Error(`Producto con ID ${producto.id_producto} no encontrado`);
                    }
                    
                    const stockActual = stockResult.rows[0].stock;
                    if (stockActual < producto.cantidad) {
                        throw new Error(`Stock insuficiente para el producto ${producto.nombre_producto}. Stock disponible: ${stockActual}, solicitado: ${producto.cantidad}`);
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
                message: tipoFactura === 'ingreso' ? 'Venta registrada exitosamente' : 'Egreso registrado exitosamente',
                data: {
                    id_factura: idFactura,
                    tipo_factura: tipoFactura,
                    monto_total: ventaData.monto || ventaData.totalVenta
                }
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error al registrar venta/egreso:', err);
        return NextResponse.json({ error: 'Error al registrar la transacción: ' + err.message }, { status: 500 });
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