import React, { useState } from "react";

export function useEgreso() {
    const [monto, setMonto] = useState("");
    const [detalle, setDetalle] = useState("");
    const [forma, setForma] = useState("contado");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("otros");
    
    // Estados para la pestaña de distribuidores
    const [numeroRecibo, setNumeroRecibo] = useState("");
    const [montoDistribuidor, setMontoDistribuidor] = useState("");
    const [formasPagoDistribuidor, setFormasPagoDistribuidor] = useState<string[]>([]);
    const [distribuidorSeleccionado, setDistribuidorSeleccionado] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Solo procesar si estamos en la pestaña "otros"
        if (activeTab !== "otros") {
            return;
        }
        
        // Validar que los campos estén completos
        if (!monto || !detalle) {
            alert("Por favor completa todos los campos");
            return;
        }

        setIsLoading(true);
        
        try {
            // Crear el objeto del egreso
            const egresoData = {
                monto: parseFloat(monto) || 0,
                detalle: detalle,
                formaPago: forma,
                fecha: new Date().toISOString(),
                tipo: "egreso"
            };


            console.log("Egreso guardado:", egresoData);
            
            // Limpiar el formulario después de guardar
            setMonto("");
            setDetalle("");
            setForma("contado");
            
            alert("Egreso registrado exitosamente");
            
        } catch (error) {
            console.error("Error al guardar el egreso:", error);
            alert("Error al guardar el egreso");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitDistribuidor = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Solo procesar si estamos en la pestaña "distribuidores"
        if (activeTab !== "distribuidores") {
            return;
        }
        
        // Validar que los campos estén completos
        if (!numeroRecibo || !montoDistribuidor || !distribuidorSeleccionado || formasPagoDistribuidor.length === 0) {
            alert("Por favor completa todos los campos");
            return;
        }

        setIsLoading(true);
        
        try {
            // Crear el objeto del egreso de distribuidor
            const egresoDistribuidorData = {
                numeroRecibo: numeroRecibo,
                monto: parseFloat(montoDistribuidor) || 0,
                formasPago: formasPagoDistribuidor,
                distribuidor: distribuidorSeleccionado,
                fecha: new Date().toISOString(),
                tipo: "egreso_distribuidor"
            };

            console.log("Egreso de distribuidor guardado:", egresoDistribuidorData);
            
            // Limpiar el formulario después de guardar
            setNumeroRecibo("");
            setMontoDistribuidor("");
            setFormasPagoDistribuidor([]);
            setDistribuidorSeleccionado("");
            
            alert("Egreso de distribuidor registrado exitosamente");
            
        } catch (error) {
            console.error("Error al guardar el egreso de distribuidor:", error);
            alert("Error al guardar el egreso de distribuidor");
        } finally {
            setIsLoading(false);
        }
    };

    const renderOtrosContent = () => (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Monto */}
            <div>
                <input
                    type="text"
                    placeholder="$ Monto"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={monto}
                    onChange={(e) => {
                        const value = e.target.value;
                        // Solo permitir números, punto decimal y backspace
                        if (/^\d*\.?\d*$/.test(value) || value === '') {
                            setMonto(value);
                        }
                    }}
                    required
                    style={{ 
                        WebkitAppearance: 'none', 
                        MozAppearance: 'textfield',
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none'
                    }}
                />
            </div>

            {/* Campo Detalle */}
            <div>
                <input
                    type="text"
                    placeholder="Detalle"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value)}
                    required
                />
            </div>

            {/* Forma de Pago */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de pago
                </label>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <div className="space-y-2">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="formaPagoOtros"
                                value="contado"
                                checked={forma === "contado"}
                                onChange={() => setForma("contado")}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Contado</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="formaPagoOtros"
                                value="electronico"
                                checked={forma === "electronico"}
                                onChange={() => setForma("electronico")}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Electronico</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Botón centrado */}
            <div className="flex justify-center pt-4">
                <button
                    type="submit"
                    disabled={isLoading || !monto || !detalle}
                    className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Guardando..." : "Aceptar"}
                </button>
            </div>
        </form>
    );

    const renderDistribuidoresContent = () => (
        <form onSubmit={handleSubmitDistribuidor} className="space-y-4">
            {/* Campo Número de Recibo/Factura */}
            <div>
                <input
                    type="text"
                    placeholder="N° Recibo/Factura"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={numeroRecibo}
                    onChange={(e) => setNumeroRecibo(e.target.value)}
                    required
                />
            </div>

            {/* Campo Monto */}
            <div>
                <input
                    type="text"
                    placeholder="$ Monto"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={montoDistribuidor}
                    onChange={(e) => {
                        const value = e.target.value;
                        // Solo permitir números, punto decimal y backspace
                        if (/^\d*\.?\d*$/.test(value) || value === '') {
                            setMontoDistribuidor(value);
                        }
                    }}
                    required
                    style={{ 
                        WebkitAppearance: 'none', 
                        MozAppearance: 'textfield',
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none'
                    }}
                />
            </div>

            {/* Forma de Pago */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de pago
                </label>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <div className="space-y-2">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                value="contado"
                                checked={formasPagoDistribuidor.includes("contado")}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormasPagoDistribuidor([...formasPagoDistribuidor, "contado"]);
                                    } else {
                                        setFormasPagoDistribuidor(formasPagoDistribuidor.filter(f => f !== "contado"));
                                    }
                                }}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Contado</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                value="electronico"
                                checked={formasPagoDistribuidor.includes("electronico")}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormasPagoDistribuidor([...formasPagoDistribuidor, "electronico"]);
                                    } else {
                                        setFormasPagoDistribuidor(formasPagoDistribuidor.filter(f => f !== "electronico"));
                                    }
                                }}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Electronico</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                value="cheque"
                                checked={formasPagoDistribuidor.includes("cheque")}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormasPagoDistribuidor([...formasPagoDistribuidor, "cheque"]);
                                    } else {
                                        setFormasPagoDistribuidor(formasPagoDistribuidor.filter(f => f !== "cheque"));
                                    }
                                }}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Cheque</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Desplegable de Distribuidores */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distribuidor
                </label>
                <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={distribuidorSeleccionado}
                    onChange={(e) => setDistribuidorSeleccionado(e.target.value)}
                    required
                >
                    <option value="">Seleccione un distribuidor</option>
                    <option value="distribuidor1">Distribuidor 1</option>
                    <option value="distribuidor2">Distribuidor 2</option>
                    <option value="distribuidor3">Distribuidor 3</option>
                </select>
            </div>

            {/* Botón centrado */}
            <div className="flex justify-center pt-4">
                <button
                    type="submit"
                    disabled={isLoading || !numeroRecibo || !montoDistribuidor || !distribuidorSeleccionado}
                    className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Guardando..." : "Aceptar"}
                </button>
            </div>
        </form>
    );

    return {
        title: 'VENTANA DE EGRESOS',
        renderContent: (
            <div className="p-4">
                {/* Tabs */}
                <div className="flex mb-4 border-b border-gray-200">
                    <button 
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                            activeTab === "otros" 
                                ? "text-purple-600 bg-purple-100 border-b-2 border-purple-600" 
                                : "text-gray-500 hover:text-purple-600"
                        }`}
                        onClick={() => setActiveTab("otros")}
                    >
                        Otros
                    </button>
                    <button 
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                            activeTab === "distribuidores" 
                                ? "text-purple-600 bg-purple-100 border-b-2 border-purple-600" 
                                : "text-gray-500 hover:text-purple-600"
                        }`}
                        onClick={() => setActiveTab("distribuidores")}
                    >
                        Distribuidores
                    </button>
                </div>

                {/* Contenido dinámico según la pestaña activa */}
                {activeTab === "otros" ? renderOtrosContent() : renderDistribuidoresContent()}
            </div>
        )
    }
} 