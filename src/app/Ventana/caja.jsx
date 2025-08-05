'use client';

import React, { use } from 'react'
import { useEgreso } from '@/lib/modales';
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';

export default function Caja() {
    const [facturas, setFacturas] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { title, renderContent } = useEgreso();

    useEffect(() => {
        const obtenerFacturas = async () => {
            const res = await fetch('/api/caja');
            const data = await res.json();
            setFacturas(data);
        }
        obtenerFacturas();
    }, []);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

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
                    </tr>
                ))}
                </tbody>
                
        </table>
        <div>
            <button 
                onClick={handleOpenModal}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
                Nuevo Egreso
            </button>
        </div>
        </div>

        {/* Modal para el popup de egreso */}
        <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
            <div>
                <h2 className="text-lg font-semibold mb-4">{title}</h2>
                {renderContent}
            </div>
        </Modal>
        </div>
    )
}