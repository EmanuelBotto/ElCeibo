'use client';

import React from 'react'
import { useEgreso, useModalConfirmacion, useModalVenta, useVerRegistro, useVerRegistroIngreso, ModalConfirmacionFactura, ModalNotificacionFactura } from '@/lib/modales';
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

interface Factura {
    id: number;
    id_factura: number;
    id_usuario: number;
    nombre_usuario: string;
    dia: number;
    mes: number;
    anio: number;
    hora: string;
    tipo: string;
    tipo_factura: string;
    monto: number;
    descripcion: string;
    forma_de_pago: string;
    cantidad_productos: number;
    distribuidor?: string;
}

export default function Caja({ onTabChange }: { onTabChange: (tab: string) => void }) {
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'ingreso', 'egreso'
    const [filtroUsuario, setFiltroUsuario] = useState('todos');
    const [filtroFecha, setFiltroFecha] = useState(''); // Filtro por fecha específica
    const [usuarios, setUsuarios] = useState<any[]>([]);
    
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
    const { isModalOpen: isConfirmOpen, modalData, isLoading: isDeleting, showConfirmModal, closeModal, handleConfirm } = useModalConfirmacion();
    const { isModalOpen: isNotificationOpen, modalType, modalMessage, showErrorModal, showSuccessModal, closeModal: closeNotificationModal } = useModalVenta();
    const { isModalOpen: isVerRegistroOpen, title: verRegistroTitle, renderContent: verRegistroContent, handleOpenModal: handleVerRegistro, handleCloseModal: handleCloseVerRegistro } = useVerRegistro();
    const { isModalOpen: isVerRegistroIngresoOpen, title: verRegistroIngresoTitle, renderContent: verRegistroIngresoContent, handleOpenModal: handleVerRegistroIngreso, handleCloseModal: handleCloseVerRegistroIngreso } = useVerRegistroIngreso();

    const obtenerUsuarios = async () => {
        try {
            const res = await fetch('/api/usuarios', {
                headers: {
                    'x-user-type': 'admin'
                }
            });
            const data = await res.json();
            
            if (data.users && Array.isArray(data.users)) {
                setUsuarios(data.users);
            } else {
                console.error('La API de usuarios no devolvió un array:', data);
                setUsuarios([]);
            }
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            setUsuarios([]);
        }
    };

    useEffect(() => {
        obtenerFacturas();
        obtenerUsuarios();
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

    const handleVerRegistroClick = () => {
        if (!facturaSeleccionada) {
            alert('Por favor selecciona una factura para ver su registro');
            return;
        }
        
        // Detectar si es ingreso o egreso y usar el modal correspondiente
        if (facturaSeleccionada.tipo_factura === 'ingreso') {
            handleVerRegistroIngreso(facturaSeleccionada);
        } else {
            handleVerRegistro(facturaSeleccionada);
        }
    };

    const toggleFiltros = () => {
        setMostrarFiltros(!mostrarFiltros);
    };

    const limpiarFiltros = () => {
        setFiltroTipo('todos');
        setFiltroUsuario('todos');
        setFiltroFecha('');
    };

    const eliminarFactura = async () => {
        if (!facturaSeleccionada) {
            alert('Por favor selecciona una factura para eliminar');
            return;
        }

        const eliminarFacturaConfirmada = async () => {
            try {
                const response = await fetch('/api/caja', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id_factura: facturaSeleccionada.id_factura
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al eliminar la factura');
                }

                const result = await response.json();
                
                // Recargar la lista de facturas
                await obtenerFacturas();
                
                // Limpiar la selección
                setFacturaSeleccionada(null);
                
                // Mostrar notificación de éxito
                showSuccessModal('Factura eliminada exitosamente');
                
            } catch (error) {
                console.error('Error al eliminar factura:', error);
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                showErrorModal('Error al eliminar la factura: ' + errorMessage);
            }
        };

        // Mostrar modal de confirmación
        showConfirmModal({
            title: 'Confirmar Eliminación',
            message: `¿Estás seguro de que deseas eliminar esta factura?\n\n` +
                   `Fecha: ${facturaSeleccionada.dia}/${facturaSeleccionada.mes}/${facturaSeleccionada.anio}\n` +
                   `Tipo: ${facturaSeleccionada.tipo_factura}\n` +
                    `Monto: $${facturaSeleccionada.monto}\n\n` +
                   `Esta acción no se puede deshacer.`,
            onConfirm: eliminarFacturaConfirmada,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
        });
    };

    // Filtrar facturas según los filtros aplicados
    const facturasFiltradas = facturas.filter(factura => {
        if (!factura) return false;
        
        // Filtro por tipo - si no es ingreso, se considera egreso
        if (filtroTipo !== 'todos') {
            if (filtroTipo === 'ingreso' && factura.tipo_factura !== 'ingreso') {
                return false;
            }
            if (filtroTipo === 'egreso' && factura.tipo_factura === 'ingreso') {
                return false;
            }
        }
        
        // Filtro por usuario - comparar por ID de usuario
        if (filtroUsuario !== 'todos' && factura.id_usuario !== parseInt(filtroUsuario)) {
            return false;
        }
        
        // Filtro por fecha - comparar fecha específica
        if (filtroFecha) {
            // Parsear la fecha del filtro (formato YYYY-MM-DD)
            const [anioFiltro, mesFiltro, diaFiltro] = filtroFecha.split('-').map(Number);
            
            // Comparar directamente los componentes numéricos
            if (factura.anio !== anioFiltro || 
                factura.mes !== mesFiltro || 
                factura.dia !== diaFiltro) {
                return false;
            }
        }
        
        return true;
    });


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-8">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-10 w-full max-w-6xl flex flex-col gap-6">

                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="px-4 py-2"
                            onClick={toggleFiltros}
                            title={mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                        >
                            <svg 
                                className="w-5 h-5" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
                                />
                            </svg>
                        </Button>
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
                            disabled={!facturaSeleccionada}
                            onClick={handleVerRegistroClick}
                        >
                            Ver Registro
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={!facturaSeleccionada}
                            onClick={eliminarFactura}
                            className="px-6 py-2"
                        >
                            Eliminar
                        </Button>
                    </div>
                </div>

                {/* Panel de filtros */}
                {mostrarFiltros && (
                    <div className="mb-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Filtro por tipo */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="filtro-tipo" className="text-sm font-semibold text-purple-800">Tipo de transacción</Label>
                                <select
                                    id="filtro-tipo"
                                    value={filtroTipo}
                                    onChange={(e) => setFiltroTipo(e.target.value)}
                                    className="px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none bg-white text-gray-700 font-medium h-10"
                                >
                                    <option value="todos">Todos</option>
                                    <option value="ingreso">Solo Ingresos</option>
                                    <option value="egreso">Solo Egresos</option>
                                </select>
                            </div>

                            {/* Filtro por usuario */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="filtro-usuario" className="text-sm font-semibold text-purple-800">Usuario</Label>
                                <select
                                    id="filtro-usuario"
                                    value={filtroUsuario}
                                    onChange={(e) => setFiltroUsuario(e.target.value)}
                                    className="px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none bg-white text-gray-700 font-medium h-10"
                                >
                                    <option value="todos">Todos los usuarios</option>
                                    {usuarios.map((usuario) => (
                                        <option key={usuario.id_usuario} value={usuario.id_usuario}>
                                            {usuario.nombre} {usuario.apellido}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por fecha */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="filtro-fecha" className="text-sm font-semibold text-purple-800">Fecha</Label>
                                <Input
                                    id="filtro-fecha"
                                    type="date"
                                    value={filtroFecha}
                                    onChange={(e) => setFiltroFecha(e.target.value)}
                                    className="px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none bg-white text-gray-700 font-medium h-10"
                                />
                            </div>

                            {/* Botón para limpiar filtros */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-sm font-semibold text-transparent">Acciones</Label>
                                <Button
                                    variant="outline"
                                    onClick={limpiarFiltros}
                                    className="px-4 py-3 border-2 border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400 font-medium"
                                >
                                    Limpiar Filtros
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {cargando ? (
                    <p className="text-center text-lg font-semibold py-8">Cargando facturas...</p>
                ) : !Array.isArray(facturas) || facturas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-center text-lg font-semibold bg-red-100 text-red-700 px-6 py-4 rounded-lg border border-red-300">No hay facturas disponibles.</p>
                    </div>
                ) : facturasFiltradas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-center text-lg font-semibold bg-yellow-100 text-yellow-800 px-6 py-4 rounded-lg border border-yellow-300">No hay facturas que coincidan con los filtros aplicados.</p>
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
                                            ? "bg-blue-200 !border-2 !border-blue-500 font-semibold"
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
                                            {factura.tipo_factura === 'ingreso' ? '+' : '-'}${factura.monto}
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

            {/* Modal de confirmación para eliminar factura */}
            <Modal isOpen={isConfirmOpen} onClose={closeModal}>
                <ModalConfirmacionFactura
                    isOpen={isConfirmOpen}
                    onClose={closeModal}
                    onConfirm={handleConfirm}
                    isLoading={isDeleting}
                    modalData={modalData}
                />
            </Modal>

            {/* Modal de notificaciones */}
            <Modal isOpen={isNotificationOpen} onClose={closeNotificationModal}>
                <ModalNotificacionFactura
                    isOpen={isNotificationOpen}
                    onClose={closeNotificationModal}
                    type={modalType}
                    message={modalMessage}
                />
            </Modal>

            {/* Modal para ver registro de egresos */}
            <Modal isOpen={isVerRegistroOpen} onClose={handleCloseVerRegistro}>
                <div className="text-gray-900">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">{verRegistroTitle}</h2>
                    <div className="text-gray-900">
                        {verRegistroContent}
                    </div>
                </div>
            </Modal>

            {/* Modal para ver registro de ingresos */}
            <Modal isOpen={isVerRegistroIngresoOpen} onClose={handleCloseVerRegistroIngreso} contentClassName="max-w-4xl">
                <div className="text-gray-900">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">{verRegistroIngresoTitle}</h2>
                    <div className="text-gray-900">
                        {verRegistroIngresoContent}
                    </div>
                </div>
            </Modal>
        </div>
    )
}