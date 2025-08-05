'use client';

import React, { use } from 'react'
import { useEgreso } from '@/lib/modales';
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-8">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-10 w-full max-w-6xl h-[90vh] flex flex-col">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4 flex-shrink-0">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold text-purple-800 tracking-tight mb-2">Gestión de Caja</h1>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
                    {/* Tabla a la izquierda */}
                    <div className="flex-1 min-h-0 flex flex-col">
                        <div className="flex-1 overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-0 z-10">
                                    <TableRow className="bg-purple-600">
                                        <TableHead className="font-bold text-white">Fecha</TableHead>
                                        <TableHead className="font-bold text-white">Hora</TableHead>
                                        <TableHead className="font-bold text-white">Tipo</TableHead>
                                        <TableHead className="font-bold text-white">Forma de Pago</TableHead>
                                        <TableHead className="font-bold text-white">Total</TableHead>
                                        <TableHead className="font-bold text-white">Usuario</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {facturas.map((factura) => (
                                        <TableRow key={factura.id_factura} className="hover:bg-gray-100 transition-colors">
                                            <TableCell className="text-center">
                                                {`${factura.dia}/${factura.mes}/${factura.anio}`}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {`${factura.hora}`}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {factura.tipo_factura ? 'Venta' : 'Compra'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {`${factura.forma_de_pago}`}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                                {`$${factura.monto_total}`}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {factura.usuario || 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Botones a la derecha */}
                    <div className="flex flex-col gap-4 w-full lg:w-64 flex-shrink-0">
                        <Button 
                            onClick={handleOpenModal}
                            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-semibold text-lg"
                        >
                            NUEVO EGRESO
                        </Button>
                        
                        <Button 
                            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-semibold text-lg"
                        >
                            NUEVO INGRESO
                        </Button>
                        
                        <Button 
                            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-semibold text-lg"
                        >
                            VER REGISTRO
                        </Button>
                        
                        <Button 
                            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-semibold text-lg"
                        >
                            ELIMINAR
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal para el popup de egreso - FUERA del contenedor principal */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                <div className="text-gray-900">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">{title}</h2>
                    <div className="text-gray-900">
                        {renderContent}
                    </div>
                </div>
            </Modal>
        </div>
    )
}