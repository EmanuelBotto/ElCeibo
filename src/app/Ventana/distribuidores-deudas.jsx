'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Users, AlertTriangle, Package } from 'lucide-react';
import { useNuevoDistribuidor, ModalVenta } from '@/lib/modales';
import Modal from '@/components/ui/modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DistribuidoresDeudas({ onTabChange }) {
    const [distribuidores, setDistribuidores] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [distribuidorSeleccionado, setDistribuidorSeleccionado] = useState(null);
    const [isModalModificarOpen, setIsModalModificarOpen] = useState(false);
    const [distribuidorModificando, setDistribuidorModificando] = useState({
        cuit: '',
        nombre: '',
        telefono: '',
        email: '',
        nombre_fantasia: '',
        calle: '',
        numero: '',
        codigo_postal: '',
        cbu: '',
        alias: '',
        deuda: 0
    });

    const obtenerDistribuidores = async () => {
        try {
            setCargando(true);
            const res = await fetch('/api/distribuidores');
            const data = await res.json();
            
            if (Array.isArray(data)) {
                setDistribuidores(data);
            } else {
                console.error('La API no devolvió un array:', data);
                setDistribuidores([]);
            }
        } catch (error) {
            console.error('Error al obtener distribuidores:', error);
            setDistribuidores([]);
        } finally {
            setCargando(false);
        }
    };

    const { isModalOpen, handleOpenModal, handleCloseModal, renderContent, isNotificationOpen, modalType, modalMessage, closeModal } = useNuevoDistribuidor({ 
        onDistribuidorSuccess: obtenerDistribuidores 
    });

    useEffect(() => {
        obtenerDistribuidores();
    }, []);

    const handleModificarDistribuidor = () => {
        if (distribuidorSeleccionado) {
            // Cargar los datos del distribuidor seleccionado en el formulario
            setDistribuidorModificando({
                cuit: distribuidorSeleccionado.cuit || '',
                nombre: distribuidorSeleccionado.nombre || '',
                telefono: distribuidorSeleccionado.telefono || '',
                email: distribuidorSeleccionado.email || '',
                nombre_fantasia: distribuidorSeleccionado.nombre_fantasia || '',
                calle: distribuidorSeleccionado.calle || '',
                numero: distribuidorSeleccionado.numero?.toString() || '',
                codigo_postal: distribuidorSeleccionado.codigo_postal?.toString() || '',
                cbu: distribuidorSeleccionado.cbu?.toString() || '',
                alias: distribuidorSeleccionado.alias || '',
                deuda: distribuidorSeleccionado.deuda || 0
            });
            setIsModalModificarOpen(true);
        }
    };

    const handleCloseModalModificar = () => {
        setIsModalModificarOpen(false);
    };

    const handleActualizarDistribuidor = async (distribuidorActualizado) => {
        try {
            const response = await fetch('/api/distribuidores', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_distribuidor: distribuidorSeleccionado.id_distribuidor,
                    ...distribuidorActualizado
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al actualizar el distribuidor');
            }

            // Recargar la lista de distribuidores
            await obtenerDistribuidores();
            
            // Cerrar el modal
            setIsModalModificarOpen(false);
            
            // Mostrar mensaje de éxito
            alert("Distribuidor actualizado exitosamente");
            
        } catch (error) {
            console.error("Error al actualizar el distribuidor:", error);
            alert("Error al actualizar el distribuidor: " + error.message);
        }
    };

    const renderFormularioModificacion = () => (
        <form onSubmit={(e) => {
            e.preventDefault();
            handleActualizarDistribuidor(distribuidorModificando);
        }} className="space-y-6">
            <h2 className="text-center text-xl font-semibold mb-6">Modificar Distribuidor</h2>
            
            <div className="grid grid-cols-2 gap-6">
                {/* CUIT */}
                <div>
                    <Label htmlFor="cuit_mod" className="text-base font-medium">
                        CUIT <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="cuit_mod"
                        value={distribuidorModificando.cuit}
                        onChange={(e) => setDistribuidorModificando({...distribuidorModificando, cuit: e.target.value})}
                        className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
                        required
                    />
                </div>

                {/* Nombre de Fantasía */}
                <div>
                    <Label htmlFor="nombre_fantasia_mod" className="text-base font-medium">
                        Nombre de Fantasía <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="nombre_fantasia_mod"
                        value={distribuidorModificando.nombre_fantasia}
                        onChange={(e) => setDistribuidorModificando({...distribuidorModificando, nombre_fantasia: e.target.value})}
                        className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
                        required
                    />
                </div>

                {/* Nombre */}
                <div>
                    <Label htmlFor="nombre_mod" className="text-base font-medium">
                        Nombre de Contacto <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="nombre_mod"
                        value={distribuidorModificando.nombre}
                        onChange={(e) => setDistribuidorModificando({...distribuidorModificando, nombre: e.target.value})}
                        className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
                        required
                    />
                </div>

                {/* Teléfono */}
                <div>
                    <Label htmlFor="telefono_mod" className="text-base font-medium">Teléfono</Label>
                    <Input
                        id="telefono_mod"
                        value={distribuidorModificando.telefono}
                        onChange={(e) => setDistribuidorModificando({...distribuidorModificando, telefono: e.target.value})}
                        className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
                    />
                </div>

                {/* Email */}
                <div>
                    <Label htmlFor="email_mod" className="text-base font-medium">
                        Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="email_mod"
                        type="email"
                        value={distribuidorModificando.email}
                        onChange={(e) => setDistribuidorModificando({...distribuidorModificando, email: e.target.value})}
                        className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
                        required
                    />
                </div>

                {/* Calle */}
                <div>
                    <Label htmlFor="calle_mod" className="text-base font-medium">Calle</Label>
                    <Input
                        id="calle_mod"
                        value={distribuidorModificando.calle}
                        onChange={(e) => setDistribuidorModificando({...distribuidorModificando, calle: e.target.value})}
                        className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
                    />
                </div>

                {/* Número */}
                <div>
                    <Label htmlFor="numero_mod" className="text-base font-medium">Número</Label>
                    <Input
                        id="numero_mod"
                        type="number"
                        value={distribuidorModificando.numero}
                        onChange={(e) => setDistribuidorModificando({...distribuidorModificando, numero: e.target.value})}
                        className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
                    />
                </div>

                {/* Código Postal */}
                <div>
                    <Label htmlFor="codigo_postal_mod" className="text-base font-medium">Código Postal</Label>
                    <Input
                        id="codigo_postal_mod"
                        type="number"
                        value={distribuidorModificando.codigo_postal}
                        onChange={(e) => setDistribuidorModificando({...distribuidorModificando, codigo_postal: e.target.value})}
                        className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
                    />
                </div>

                {/* CBU */}
                <div>
                    <Label htmlFor="cbu_mod" className="text-base font-medium">CBU</Label>
                    <Input
                        id="cbu_mod"
                        value={distribuidorModificando.cbu}
                        onChange={(e) => setDistribuidorModificando({...distribuidorModificando, cbu: e.target.value})}
                        className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
                    />
                </div>

                {/* Alias */}
                <div>
                    <Label htmlFor="alias_mod" className="text-base font-medium">Alias</Label>
                    <Input
                        id="alias_mod"
                        value={distribuidorModificando.alias}
                        onChange={(e) => setDistribuidorModificando({...distribuidorModificando, alias: e.target.value})}
                        className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
                    />
                </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 mt-8">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCloseModalModificar}
                    className="px-6 py-3 text-base"
                >
                    Cancelar
                </Button>
                <Button 
                    type="submit" 
                    disabled={!distribuidorModificando.cuit || !distribuidorModificando.nombre || !distribuidorModificando.email || !distribuidorModificando.nombre_fantasia}
                    className="px-6 py-3 text-base"
                >
                    Guardar Cambios
                </Button>
            </div>
        </form>
    );

    // Mostrar todos los distribuidores sin filtro
    const distribuidoresFiltrados = distribuidores;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-8">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-10 w-full max-w-6xl flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:justify-center md:items-center mb-8 gap-4">
                    <div className="flex gap-2">
                        <Button 
                            className="px-6 py-2"
                            onClick={handleOpenModal}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Nuevo Distribuidor
                        </Button>
                        <Button
                            variant="outline"
                            className="px-6 py-2"
                            disabled={!distribuidorSeleccionado}
                            onClick={handleModificarDistribuidor}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Modificar Distribuidor
                        </Button>
                        <Button
                            variant="outline"
                            className="px-6 py-2"
                        >
                            <Package className="w-4 h-4 mr-2" />
                            Registrar Compra
                        </Button>
                        <Button
                            variant="outline"
                            className="px-6 py-2"
                        >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Ver Deudas
                        </Button>
                    </div>
                </div>


                {cargando ? (
                    <p className="text-center text-lg font-semibold py-8">Cargando distribuidores...</p>
                ) : !Array.isArray(distribuidores) || distribuidores.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-center text-lg font-semibold bg-red-100 text-red-700 px-6 py-4 rounded-lg border border-red-300">
                            No hay distribuidores registrados.
                        </p>
                    </div>
                ) : distribuidoresFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-center text-lg font-semibold bg-yellow-100 text-yellow-800 px-6 py-4 rounded-lg border border-yellow-300">
                            No hay distribuidores registrados.
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-bold text-white text-center w-1/5">Nombre de Fantasía</TableHead>
                                <TableHead className="font-bold text-white text-center w-1/5">Contacto</TableHead>
                                <TableHead className="font-bold text-white text-center w-1/5">Teléfono</TableHead>
                                <TableHead className="font-bold text-white text-center w-1/5">Deuda Total</TableHead>
                                <TableHead className="font-bold text-white text-center w-1/5">Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {distribuidoresFiltrados.map((distribuidor, idx) => (
                                <TableRow
                                    key={distribuidor.id_distribuidor}
                                    className={
                                        distribuidorSeleccionado?.id_distribuidor === distribuidor.id_distribuidor
                                            ? "bg-gray-200 !border-2 !border-gray-500"
                                            : "hover:bg-gray-100 transition-colors"
                                    }
                                    onClick={() => setDistribuidorSeleccionado(distribuidor)}
                                    style={{ cursor: "pointer" }}
                                    aria-rowindex={idx}
                                    aria-rowcount={distribuidoresFiltrados.length}
                                >
                                    <TableCell className="text-center font-medium w-1/4">
                                        {distribuidor.nombre_fantasia || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-center w-1/4">
                                        {distribuidor.nombre || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-center w-1/4">
                                        {distribuidor.telefono || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold w-1/4">
                                        {(() => {
                                            const deuda = parseFloat(distribuidor.deuda) || 0;
                                            if (deuda > 0) {
                                                // Deuda positiva (nos deben dinero) - mostrar en rojo con signo -
                                                return (
                                                    <span className="text-red-600">
                                                        -${deuda.toFixed(2)}
                                                    </span>
                                                );
                                            } else if (deuda < 0) {
                                                // Saldo a favor (deuda negativa) - mostrar en verde con signo +
                                                return (
                                                    <span className="text-green-600">
                                                        +${Math.abs(deuda).toFixed(2)}
                                                    </span>
                                                );
                                            } else {
                                                // Deuda cero - mostrar en negro
                                                return (
                                                    <span className="text-black">
                                                        $0.00
                                                    </span>
                                                );
                                            }
                                        })()}
                                    </TableCell>
                                    <TableCell className="text-center w-auto">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                            (() => {
                                                const deuda = parseFloat(distribuidor.deuda) || 0;
                                                if (deuda > 0) {
                                                    return 'bg-red-100 text-red-800';
                                                } else if (deuda < 0) {
                                                    return 'bg-green-100 text-green-800';
                                                } else {
                                                    return 'bg-gray-100 text-gray-800';
                                                }
                                            })()
                                        }`}>
                                            {(() => {
                                                const deuda = parseFloat(distribuidor.deuda) || 0;
                                                if (deuda > 0) {
                                                    return 'Con Deuda';
                                                } else if (deuda < 0) {
                                                    return 'A Favor';
                                                } else {
                                                    return 'Al Día';
                                                }
                                            })()}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Modal para nuevo distribuidor */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} contentClassName="max-w-[960px]">
                <div className="text-gray-900">
                    {renderContent()}
                </div>
            </Modal>

            {/* Modal de notificaciones */}
            <ModalVenta
                isOpen={isNotificationOpen}
                type={modalType}
                message={modalMessage}
                onClose={closeModal}
            />

            {/* Modal de modificación */}
            <Modal isOpen={isModalModificarOpen} onClose={handleCloseModalModificar} contentClassName="max-w-[960px]">
                <div className="text-gray-900">
                    {renderFormularioModificacion()}
                </div>
            </Modal>
        </div>
    );
}
