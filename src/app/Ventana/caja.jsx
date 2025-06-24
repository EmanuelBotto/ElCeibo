'use client';

import { useState, useEffect } from 'react';

export default function Caja() {
    const [facturas, setFacturas] = useState([]);

    useEffect(() => {
        const obtenerFacturas = async () => {
            const res = await fetch('/api/caja');
            const data = await res.json();
            setFacturas(data);
        }
        obtenerFacturas();
    }, []);

    return (
        <div className="p-6 max-w-4xl mx-auto"> 
        <div className="flex justify-between items-center mb-6">
        <table className='table-fixed w-full border'>
            <thead>
            <tr className='bg-gray-200'>
                <th className='border px-4 py-2'>Fecha</th>
                <th className='border px-4 py-2'>Hora</th>
                <th className='border px-4 py-2'>Tipo</th>
                <th className='border px-4 py-2'>Forma de Pago</th>
                <th className='border px-4 py-2'>Total</th>
                <th className='border px-4 py-2'>Usuario</th>
            </tr>
            </thead>
            <tbody>
                {facturas.map((factura) => (
                    <tr key={factura.id_factura}>
                    <td className='border px-4 py-2'>
                        {`${factura.dia}/${factura.mes}/${factura.anio}`}
                        </td>
                    <td className='border px-4 py-2'>
                        {`${factura.hora}`}
                        </td>
                    <td className='border px-4 py-2'>
                        {factura.tipo_factura ? 'Venta' : 'Compra'}
                        </td>
                    <td className='border px-4 py-2'>
                        {`${factura.forma_de_pago}`}
                        </td>
                    <td className='border px-4 py-2'>
                        {`$${factura.monto_total}`}
                        </td>
                    <td className='border px-4 py-2'>
                        {factura.apellido_usuario}
                        </td>
                    </tr>
                ))}
                </tbody>
        </table>
        </div>
        </div>
    )
}