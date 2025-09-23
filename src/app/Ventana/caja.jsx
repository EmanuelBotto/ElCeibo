'use client';

import React from 'react'
import { useEgreso } from '@/lib/modales';
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
export default function Caja({ onTabChange }) {
    const [facturas, setFacturas] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
    

    const obtenerFacturas = async () => {
        try {
            setCargando(true);
            const res = await fetch('/api/caja');
            const data = await res.json();
            
            // Verificar si la respuesta es un array
            if (Array.isArray(data)) {
                setFacturas(data);
            } else {
                console.error('La API no devolvió un array:', data);
                setFacturas([]);
            }
        } catch (error) {
            console.error('Error al obtener facturas:', error);
            setFacturas([]);
        } finally {
            setCargando(false);
        }
    };

    const { title, renderContent } = useEgreso({ onEgresoSuccess: obtenerFacturas });

    useEffect(() => {
        obtenerFacturas();
    }, []);

    // Recargar facturas cuando se regrese a la caja
    useEffect(() => {
        const handleFocus = () => {
            obtenerFacturas();
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    // Filtrar facturas según la búsqueda
    const facturasFiltradas = facturas.filter(factura => {
        if (!factura) return false;
        return (
            factura.usuario?.toLowerCase().includes(busqueda.toLowerCase()) ||
            factura.forma_de_pago?.toLowerCase().includes(busqueda.toLowerCase()) ||
            factura.monto_total?.toString().includes(busqueda)
        );
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-8">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-10 w-full max-w-6xl flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold text-purple-800 tracking-tight mb-2">Gestión de Caja</h1>
                        <p className="text-gray-600 text-lg">Control de ingresos, egresos y transacciones</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleOpenModal} className="px-6 py-2">
                            Nuevo Egreso
                        </Button>
                        <Button
                            variant="outline"
                            className="px-6 py-2"
                            onClick={() => onTabChange('ingreso')}
                        >
                            Nuevo Ingreso
                        </Button>
                        <Button
                            variant="outline"
                            className="px-6 py-2"
                        >
                            Ver Registro
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={!facturaSeleccionada}
                            className="px-6 py-2"
                        >
                            Eliminar
                        </Button>
                    </div>
                </div>

                <div className="mb-6 flex flex-col md:flex-row md:items-end gap-6">
                    <div className="flex flex-col gap-2 w-full md:w-1/2">
                        <Label htmlFor="busqueda" className="text-base font-semibold">Buscar</Label>
                        <Input
                            id="busqueda"
                            placeholder="Buscar por usuario, forma de pago o monto..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="text-base px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-400 h-12"
                        />
                    </div>
                </div>

                {cargando ? (
                    <p className="text-center text-lg font-semibold py-8">Cargando facturas...</p>
                ) : !Array.isArray(facturas) || facturas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-center text-lg font-semibold bg-red-100 text-red-700 px-6 py-4 rounded-lg border border-red-300">No hay facturas disponibles.</p>
                    </div>
                ) : facturasFiltradas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-center text-lg font-semibold bg-yellow-100 text-yellow-800 px-6 py-4 rounded-lg border border-yellow-300">No hay facturas que coincidan con la búsqueda.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold text-white text-center">Fecha</TableHead>
                                <TableHead className="font-bold text-white text-center">Hora</TableHead>
                                <TableHead className="font-bold text-white text-center">Tipo</TableHead>
                                <TableHead className="font-bold text-white text-center">Forma de Pago</TableHead>
                                <TableHead className="font-bold text-white text-center">Total</TableHead>
                                <TableHead className="font-bold text-white text-center">Usuario</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {facturasFiltradas.map((factura, idx) => (
                                <TableRow
                                    key={factura.id_factura}
                                    className={
                                        facturaSeleccionada?.id_factura === factura.id_factura
                                            ? "bg-gray-200 !border-2 !border-gray-500"
                                            : "hover:bg-gray-100 transition-colors"
                                    }
                                    onClick={() => setFacturaSeleccionada(factura)}
                                    style={{ cursor: "pointer" }}
                                    aria-rowindex={idx}
                                    aria-rowcount={facturasFiltradas.length}
                                >
                                    <TableCell className="text-center">
                                        {`${factura.dia}/${factura.mes}/${factura.anio}`}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {factura.hora}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                            factura.tipo_factura === 'ingreso'
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {factura.tipo_factura === 'ingreso' ? 'Ingreso' : 'Egreso'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {factura.forma_de_pago}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">
                                        <span className={factura.tipo_factura === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                                            {factura.tipo_factura === 'ingreso' ? '+' : '-'}${factura.monto_total}
                                        </span>
                                        {factura.cantidad_productos > 0 && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {factura.cantidad_productos} producto{factura.cantidad_productos !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {factura.nombre_usuario || 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Modal para el popup de egreso */}
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