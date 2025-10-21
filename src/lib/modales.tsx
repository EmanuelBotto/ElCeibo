import React, { useState, useEffect, useRef } from "react";

// ====== Modales reutilizables para Productos ======
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import { AlertTriangle, CheckCircle, Trash2, Camera } from 'lucide-react';

type NuevoProducto = {
  nombre: string;
  marca: string;
  precio_costo: string | number;
  stock: string | number;
  id_tipo: string;
  porcentaje_final?: string | number;
  porcentaje_mayorista?: string | number;
};

type ProductoEditando = {
  nombre_producto: string;
  precio_costo: string | number;
  stock: string | number;
  id_tipo?: string;
  marca?: string;
};

export function useEgreso({ onEgresoSuccess }: { onEgresoSuccess?: () => void } = {}) {
    const [monto, setMonto] = useState("");
    const [detalle, setDetalle] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("otros");
    
    // Estados unificados para ambas pestañas
    const [numeroRecibo, setNumeroRecibo] = useState("");
    const [formasPago, setFormasPago] = useState<string[]>([]);
    const [distribuidorSeleccionado, setDistribuidorSeleccionado] = useState("");
    
    // Estados para distribuidores
    const [distribuidores, setDistribuidores] = useState([]);
    const [isLoadingDistribuidores, setIsLoadingDistribuidores] = useState(false);

    // Función para cargar distribuidores desde la API
    const cargarDistribuidores = async () => {
        setIsLoadingDistribuidores(true);
        try {
            const response = await fetch('/api/distribuidores');
            if (response.ok) {
                const data = await response.json();
                setDistribuidores(data);
            } else {
                console.error('Error al cargar distribuidores');
            }
        } catch (error) {
            console.error('Error al cargar distribuidores:', error);
        } finally {
            setIsLoadingDistribuidores(false);
        }
    };

    // Cargar distribuidores cuando se active la pestaña de distribuidores
    useEffect(() => {
        if (activeTab === "distribuidores") {
            cargarDistribuidores();
        }
    }, [activeTab]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Solo procesar si estamos en la pestaña "otros"
        if (activeTab !== "otros") return;
        
        // Validar que los campos estén completos
        if (!monto || !detalle || formasPago.length === 0) {
            alert("Por favor completa todos los campos");
            return;
        }

        setIsLoading(true);
        
        try {
            // Crear el objeto del egreso
            const egresoData = {
                monto: parseFloat(monto) || 0,
                detalle: detalle,
                formasPago: formasPago,
                tipo: "varios"
                
            };

            const response = await fetch('/api/caja/1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(egresoData)
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Error al guardar el egreso');
            }

            await response.json();
            
            // Limpiar el formulario después de guardar
            setMonto("");
            setDetalle("");
            setFormasPago([]);
            
            // Llamar la función de callback si existe
            if (onEgresoSuccess) {
                onEgresoSuccess();
            }
            
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
        if (!numeroRecibo || !monto || !distribuidorSeleccionado || formasPago.length === 0) {
            alert("Por favor completa todos los campos");
            return;
        }

        setIsLoading(true);
        
        try {
            // Crear el objeto del egreso de distribuidor
            const egresoDistribuidorData = {
                numeroRecibo: numeroRecibo,
                monto: parseFloat(monto) || 0,
                formasPago: formasPago,
                distribuidor: distribuidorSeleccionado,
                tipo: "distribuidor"
            };

            const response = await fetch('/api/caja/1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(egresoDistribuidorData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al guardar el egreso de distribuidor');
            }

            await response.json();
            
            // Actualizar la deuda del distribuidor
            try {
                // Obtener la información actual del distribuidor
                const distribuidorResponse = await fetch(`/api/distribuidores/${distribuidorSeleccionado}`);
                if (distribuidorResponse.ok) {
                    const distribuidorActual = await distribuidorResponse.json();
                    
                    // Calcular la nueva deuda (deuda actual + monto del egreso)
                    const deudaActual = distribuidorActual.deuda || 0;
                    const nuevaDeuda = deudaActual - parseFloat(monto) || 0;
                    
                    // Actualizar la deuda del distribuidor
                    const updateResponse = await fetch(`/api/distribuidores/${distribuidorSeleccionado}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            ...distribuidorActual,
                            deuda: nuevaDeuda
                        })
                    });
                    
                    if (updateResponse.ok) {
                        console.log("Deuda del distribuidor actualizada exitosamente");
                        // Recargar la lista de distribuidores para mostrar la deuda actualizada
                        await cargarDistribuidores();
                    } else {
                        console.error("Error al actualizar la deuda del distribuidor");
                    }
                }
            } catch (error) {
                console.error("Error al actualizar la deuda del distribuidor:", error);
                // No mostrar error al usuario ya que el egreso se guardó correctamente
            }
            
            // Limpiar el formulario después de guardar
            setNumeroRecibo("");
            setMonto("");
            setFormasPago([]);
            setDistribuidorSeleccionado("");
            
            alert("Egreso de distribuidor registrado exitosamente y deuda actualizada");
            
            // Llamar la función de callback si existe
            if (onEgresoSuccess) {
                onEgresoSuccess();
            }
            
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
                                type="checkbox"
                                value="contado"
                                checked={formasPago.includes("contado")}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormasPago([...formasPago, "contado"]);
                                    } else {
                                        setFormasPago(formasPago.filter(f => f !== "contado"));
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
                                checked={formasPago.includes("electronico")}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormasPago([...formasPago, "electronico"]);
                                    } else {
                                        setFormasPago(formasPago.filter(f => f !== "electronico"));
                                    }
                                }}
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
                                checked={formasPago.includes("contado")}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormasPago([...formasPago, "contado"]);
                                    } else {
                                        setFormasPago(formasPago.filter(f => f !== "contado"));
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
                                checked={formasPago.includes("electronico")}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormasPago([...formasPago, "electronico"]);
                                    } else {
                                        setFormasPago(formasPago.filter(f => f !== "electronico"));
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
                                checked={formasPago.includes("cheque")}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormasPago([...formasPago, "cheque"]);
                                    } else {
                                        setFormasPago(formasPago.filter(f => f !== "cheque"));
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
                    disabled={isLoadingDistribuidores}
                >
                    <option value="">
                        {isLoadingDistribuidores ? "Cargando distribuidores..." : "Seleccione un distribuidor"}
                    </option>
                    {distribuidores.length > 0 ? (
                        distribuidores.map((dist: { id_distribuidor: number; nombre: string; nombre_fantasia?: string }) => (
                            <option key={dist.id_distribuidor} value={dist.id_distribuidor}>
                                {dist.nombre_fantasia || dist.nombre}
                            </option>
                        ))
                    ) : (
                        <option value="">No hay distribuidores disponibles</option>
                    )}
                </select>
            </div>

            {/* Botón centrado */}
            <div className="flex justify-center pt-4">
                <button
                    type="submit"
                    disabled={isLoading || !numeroRecibo || !monto || !distribuidorSeleccionado || formasPago.length === 0}
                    className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Guardando..." : "Aceptar"}
                </button>
            </div>
        </form>
    );

    // Función para reiniciar las variables al cambiar de pestaña
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setFormasPago([]); // Reiniciar el array de formas de pago
        setMonto(""); // Reiniciar el monto
        setDetalle(""); // Reiniciar el detalle
        setNumeroRecibo(""); // Reiniciar el número de recibo
        setDistribuidorSeleccionado(""); // Reiniciar el distribuidor seleccionado
    };

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
                        onClick={() => handleTabChange("otros")}
                    >
                        Otros
                    </button>
                    <button 
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                            activeTab === "distribuidores" 
                                ? "text-purple-600 bg-purple-100 border-b-2 border-purple-600" 
                                : "text-gray-500 hover:text-purple-600"
                        }`}
                        onClick={() => handleTabChange("distribuidores")}
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


export function buildProductoFormContent(args: {
  mode: "create" | "edit";
  nuevoProducto?: NuevoProducto;
  setNuevoProducto?: React.Dispatch<React.SetStateAction<NuevoProducto>>;
  productoEditando?: ProductoEditando | null;
  setProductoEditando?: React.Dispatch<React.SetStateAction<ProductoEditando | null>>;
  porcentajePersonalizado?: boolean;
  setPorcentajePersonalizado?: React.Dispatch<React.SetStateAction<boolean>>;
  tipos?: Array<{ id_tipo: string | number; nombre: string; porcentaje_final: number; porcentaje_mayorista: number }>;
  nextIdPreview?: string | number;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const {
    mode,
    nuevoProducto,
    setNuevoProducto,
    productoEditando,
    setProductoEditando,
    porcentajePersonalizado = false,
    setPorcentajePersonalizado,
    onCancel,
    onSubmit,
    tipos = [],
    nextIdPreview,
  } = args;

  const isEdit = mode === "edit";

  // ========================================
  // FUNCIONES AUXILIARES
  // ========================================

  const getCreateValue = (field: keyof NuevoProducto): string | number => {
    return nuevoProducto?.[field] ?? "";
  };

  const handleCreateChange = (field: keyof NuevoProducto, value: string): void => {
    if (!nuevoProducto || !setNuevoProducto) return;
    setNuevoProducto({ ...nuevoProducto, [field]: value });
  };

  const getEditValue = (field: string): string | number => {
    if (!productoEditando) return "";
    if (field === "nombre") return productoEditando.nombre_producto ?? "";
    return (productoEditando as any)[field] ?? "";
  };

  const handleEditChange = (field: string, value: string): void => {
    if (!productoEditando || !setProductoEditando) return;
    if (field === "nombre") {
      setProductoEditando({ ...productoEditando, nombre_producto: value });
      return;
    }
    setProductoEditando({ ...productoEditando, [field]: value } as ProductoEditando);
  };

  const calcularPrecioFinal = (precioBase: number, porcentaje: number): string => {
    const resultado = precioBase * porcentaje;
    return isNaN(resultado) ? "0.00" : resultado.toFixed(2);
  };

  const handleTipoChange = (selectedTipo: string) => {
    if (!isEdit && setNuevoProducto) {
      handleCreateChange("id_tipo", selectedTipo);
      const tipoSeleccionado = tipos.find((t) => String(t.id_tipo) === selectedTipo);
      if (tipoSeleccionado) {
        setNuevoProducto((prev) => ({
          ...prev,
          porcentaje_final: tipoSeleccionado.porcentaje_final,
          porcentaje_mayorista: tipoSeleccionado.porcentaje_mayorista,
        }));
      }
    }
  };

  // ========================================
  // COMPONENTES DE CAMPOS
  // ========================================

  const CampoInput = ({ 
    id, 
    label, 
    value, 
    onChange, 
    type = "text", 
    disabled = false, 
    required = false,
    className = "",
    step
  }: {
    id: string;
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    step?: string;
  }) => (
    <div>
      <Label htmlFor={id} className="text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        step={step}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`rounded-full border-2 border-purple-400 focus:ring-purple-500 ${disabled ? "bg-gray-50 text-gray-500" : ""} ${className}`}
      />
    </div>
  );

  const CampoSelect = ({ 
    id, 
    label, 
    value, 
    onChange, 
    options, 
    disabled = false,
    required = false
  }: {
    id: string;
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    options: Array<{ value: string | number; label: string }>;
    disabled?: boolean;
    required?: boolean;
  }) => (
    <div>
      <Label htmlFor={id} className="text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <select
        id={id}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full border-2 border-purple-400 rounded-full px-3 py-2 bg-white text-black disabled:bg-gray-50 disabled:text-gray-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  // ========================================
  // OPCIONES DE TIPOS
  // ========================================
  const opcionesTipos = tipos.length > 0 
    ? tipos.map((t) => ({ value: t.id_tipo, label: t.nombre }))
    : [
        { value: "1", label: "Balanceado" },
        { value: "2", label: "Medicamento" },
        { value: "3", label: "Accesorio" },
        { value: "4", label: "Acuario" }
      ];

  // ========================================
  // RENDERIZADO DEL FORMULARIO
  // ========================================
  return (
    <div className={isEdit ? "w-full" : "w-full"}>
      <h2 className="text-center text-xl font-bold text-purple-800 mb-4">
        {isEdit ? "Actualizar Producto" : "Nuevo Producto"}
      </h2>
      
      <div className="space-y-6">
        {/* Primera fila: ID, Descripción, Marca, Tipo */}
        <div className="grid grid-cols-4 gap-4">
          {/* ID Producto */}
          <div>
            <Label className="text-sm" htmlFor="idProducto">ID Producto</Label>
            <Input
              id="idProducto"
              value={String((isEdit ? ((productoEditando as any)?.id_producto) : (nextIdPreview ?? "")) ?? "")}
              disabled
              className="rounded-full border-2 border-purple-400 focus:ring-purple-500"
            />
          </div>

          {/* Descripción/Nombre */}
          <div>
            <Label className="text-sm" htmlFor={isEdit ? "nombreEdit" : "nombre"}>Descripción</Label>
            <Input
              id={isEdit ? "nombreEdit" : "nombre"}
              value={String(isEdit ? getEditValue("nombre") : getCreateValue("nombre"))}
              onChange={(e) => (isEdit ? handleEditChange("nombre", e.target.value) : handleCreateChange("nombre", e.target.value))}
              className="rounded-full border-2 border-purple-400 focus:ring-purple-500"
            />
          </div>

          {/* Marca */}
          {isEdit ? (
            <div className="flex flex-col">
              <Label className="text-sm mb-1" htmlFor="marcaEdit">Marca</Label>
              <Input
                id="marcaEdit"
                value={String(((productoEditando as any)?.marca) ?? "")}
                onChange={(e) => handleEditChange("marca", e.target.value)}
                className="rounded-full border-2 border-purple-400 focus:ring-purple-500"
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <Label className="mb-1" htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={String(getCreateValue("marca"))}
                onChange={(e) => handleCreateChange("marca", e.target.value)}
                className="rounded-full border-2 border-purple-400 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Tipo/Rubro */}
          {isEdit ? (
            <div className="flex flex-col">
              <Label className="text-sm mb-1" htmlFor="rubro">Rubro</Label>
              <select
                id="rubro"
                value={String(((productoEditando as any)?.id_tipo) ?? "1")}
                onChange={(e) => handleEditChange("id_tipo", e.target.value)}
                className="w-full h-12 border-2 border-purple-400 rounded-full px-3 py-2 bg-white text-black focus:ring-purple-500 focus:border-transparent text-base"
                style={{ height: '3rem', lineHeight: '1.5rem' }}
              >
                {Array.isArray(tipos) && tipos.length > 0 ? (
                  tipos.map((t) => (
                    <option key={t.id_tipo} value={String(t.id_tipo)}>{t.nombre}</option>
                  ))
                ) : (
                  <>
                    <option value="1">Balanceado</option>
                    <option value="2">Medicamento</option>
                    <option value="3">Accesorio</option>
                    <option value="4">Acuario</option>
                  </>
                )}
              </select>
            </div>
          ) : (
            <div className="flex flex-col">
              <Label className="mb-1" htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                value={String(getCreateValue("id_tipo"))}
                onChange={(e) => {
                  const selected = e.target.value;
                  handleCreateChange("id_tipo", selected);
                  const t = tipos.find((x) => String(x.id_tipo) === String(selected));
                  if (t && setNuevoProducto) {
                    setNuevoProducto((prev) => {
                      const prevObj = prev as NuevoProducto & {
                        porcentaje_final?: string | number;
                        porcentaje_mayorista?: string | number;
                      };
                      return {
                        ...prevObj,
                        porcentaje_final: t.porcentaje_final,
                        porcentaje_mayorista: t.porcentaje_mayorista,
                      } as NuevoProducto;
                    });
                  }
                }}
                className="w-full h-12 border-2 border-purple-400 rounded-full px-3 py-2 bg-white text-black focus:ring-purple-500 focus:border-transparent text-base"
                style={{ height: '3rem', lineHeight: '1.5rem' }}
              >
                {tipos.length > 0 ? (
                  tipos.map((t) => (
                    <option key={t.id_tipo} value={t.id_tipo}>{t.nombre}</option>
                  ))
                ) : (
                  <>
                    <option value="1">Balanceado</option>
                    <option value="2">Medicamento</option>
                    <option value="3">Accesorio</option>
                    <option value="4">Acuario</option>
                  </>
                )}
              </select>
            </div>
          )}
        </div>

        {/* Tercera fila: Stock, Precio Costo, Porcentajes */}
        <div className="grid grid-cols-4 gap-4">
          {/* Stock */}
          {isEdit ? (
            <div>
              <Label htmlFor={"stockEdit"}>Stock</Label>
              <Input
                id={"stockEdit"}
                type="number"
                value={String(getEditValue("stock"))}
                onChange={(e) => handleEditChange("stock", e.target.value)}
                className="rounded-full border-2 border-purple-400 focus:ring-purple-500"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={String(getCreateValue("stock"))}
                onChange={(e) => handleCreateChange("stock", e.target.value)}
                placeholder="0"
                className="rounded-full border-2 border-purple-400 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Precio Costo */}
          {isEdit ? (
            <div>
              <Label htmlFor="precioEdit">Precio Costo</Label>
              <Input
                id="precioEdit"
                type="number"
                value={String(getEditValue("precio_costo"))}
                onChange={(e) => handleEditChange("precio_costo", e.target.value)}
                className="rounded-full border-2 border-purple-400 focus:ring-purple-500"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="precio">Precio Costo</Label>
              <Input
                id="precio"
                type="number"
                value={String(getCreateValue("precio_costo"))}
                onChange={(e) => handleCreateChange("precio_costo", e.target.value)}
                className="rounded-full border-2 border-purple-400 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Porcentajes - Solo en creación */}
          {!isEdit && (
            <>
              <div>
                <Label className="text-sm">% incremento CF</Label>
                <Input
                  id="incCFCreate"
                  type="number"
                  step="0.01"
                  value={String(getCreateValue("porcentaje_final"))}
                  disabled
                  className="rounded-full border-2 border-purple-200 bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <Label className="text-sm">% de incremento R</Label>
                <Input
                  id="incRCreate"
                  type="number"
                  step="0.01"
                  value={String(getCreateValue("porcentaje_mayorista"))}
                  disabled
                  className="rounded-full border-2 border-purple-200 bg-gray-50 text-gray-700"
                />
              </div>
            </>
          )}

          {/* Porcentajes - Solo en edición */}
          {isEdit && (
            <>
              <div>
                <Label className="text-sm" htmlFor="incCF">% incremento CF</Label>
                <Input
                  id="incCF"
                  type="number"
                  step="0.01"
                  value={String(((productoEditando as any)?.porcentaje_final) ?? "")}
                  onChange={(e) => handleEditChange("precio_costo", e.target.value)}
                  disabled={!porcentajePersonalizado}
                  className={`rounded-full border-2 ${porcentajePersonalizado ? "border-purple-400" : "border-gray-300 bg-gray-100 text-gray-500"}`}
                />
              </div>
              <div>
                <Label className="text-sm" htmlFor="incR">% de incremento R</Label>
                <Input
                  id="incR"
                  type="number"
                  step="0.01"
                  value={String(((productoEditando as any)?.porcentaje_mayorista) ?? "")}
                  onChange={(e) => setProductoEditando && productoEditando && setProductoEditando({ ...productoEditando, porcentaje_mayorista: e.target.value } as any)}
                  disabled={!porcentajePersonalizado}
                  className={`rounded-full border-2 ${porcentajePersonalizado ? "border-purple-400" : "border-gray-300 bg-gray-100 text-gray-500"}`}
                />
              </div>
            </>
          )}
        </div>


        {/* Precios Finales - Solo en creación */}
        {!isEdit && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-sm">Precio final CF</Label>
              <Input
                disabled
                value={(() => {
                  const base = Number(getCreateValue("precio_costo") || 0);
                  const mult = Number(getCreateValue("porcentaje_final") || 0);
                  const v = !isNaN(base * mult) ? (base * mult).toFixed(2) : "";
                  return `$ ${v}`;
                })()}
                className="rounded-full border-2 border-purple-200 bg-gray-50 text-gray-700"
              />
            </div>
            <div>
              <Label className="text-sm">Precio final R</Label>
              <Input
                disabled
                value={(() => {
                  const base = Number(getCreateValue("precio_costo") || 0);
                  const mult = Number(getCreateValue("porcentaje_mayorista") || 0);
                  const v = !isNaN(base * mult) ? (base * mult).toFixed(2) : "";
                  return `$ ${v}`;
                })()}
                className="rounded-full border-2 border-purple-200 bg-gray-50 text-gray-700"
              />
            </div>
          </div>
        )}

        {/* Checkbox y Precios Finales - Solo en edición */}
        {isEdit && (
          <>
            {/* Cuarta fila: Checkbox */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-2">
                <input
                  id="manual"
                  type="checkbox"
                  checked={porcentajePersonalizado}
                  onChange={(e) => setPorcentajePersonalizado && setPorcentajePersonalizado(e.target.checked)}
                  className="mr-2"
                />
                <Label htmlFor="manual" className="text-sm">% Manual</Label>
              </div>
              <div></div>
            </div>

            {/* Quinta fila: Precios finales */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-sm">Precio final CF</Label>
                <Input
                  disabled
                  value={(() => {
                    const base = Number(((productoEditando as any)?.precio_costo ?? 0));
                    const mult = Number(((productoEditando as any)?.porcentaje_final ?? 0));
                    const v = !isNaN(base * mult) ? (base * mult).toFixed(2) : "";
                    return `$ ${v}`;
                  })()}
                  className="rounded-full border-2 border-purple-200 bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <Label className="text-sm">Precio final R</Label>
                <Input
                  disabled
                  value={(() => {
                    const base = Number(((productoEditando as any)?.precio_costo ?? 0));
                    const mult = Number(((productoEditando as any)?.porcentaje_mayorista ?? 0));
                    const v = !isNaN(base * mult) ? (base * mult).toFixed(2) : "";
                    return `$ ${v}`;
                  })()}
                  className="rounded-full border-2 border-purple-200 bg-gray-50 text-gray-700"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSubmit}>{isEdit ? "Guardar" : "Guardar"}</Button>
      </div>
    </div>
  );
}

// ====== Modal de Venta (Error y Éxito) ======
// 
// Componente reutilizable para mostrar modales de error y éxito en ventas
// 
// Ejemplo de uso:
// 
// import { ModalVenta, useModalVenta } from '@/lib/modales';
// 

type ModalVentaType = 'error' | 'success' | '';

interface ModalVentaProps {
  isOpen: boolean;
  type: ModalVentaType;
  message: string;
  onClose: () => void;
  onSuccessRedirect?: () => void;
}

export function ModalVenta({ isOpen, type, message, onClose, onSuccessRedirect }: ModalVentaProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center p-6">
        {type === 'error' ? (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-sm text-gray-500 mb-4">{message}</p>
            <Button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Entendido
            </Button>
          </>
        ) : type === 'success' ? (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">¡Venta Exitosa!</h3>
            <p className="text-sm text-gray-500 mb-4">{message}</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={onClose}
                variant="outline"
                className="px-4 py-2"
              >
                Continuar Vendiendo
              </Button>
              <Button
                onClick={onSuccessRedirect}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
              >
                Ir a Caja
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}

// Hook para manejar el modal de venta
export function useModalVenta() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalVentaType>('');
  const [modalMessage, setModalMessage] = useState('');

  const showErrorModal = (message: string) => {
    setModalType('error');
    setModalMessage(message);
    setIsModalOpen(true);
  };

  const showSuccessModal = (message: string) => {
    setModalType('success');
    setModalMessage(message);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType('');
    setModalMessage('');
  };

  return {
    isModalOpen,
    modalType,
    modalMessage,
    showErrorModal,
    showSuccessModal,
    closeModal
  };
}

// ====== Modal de Nuevo Distribuidor ======

type NuevoDistribuidor = {
  cuit: string;
  nombre: string;
  telefono: string;
  email: string;
  nombre_fantasia: string;
  calle: string;
  numero: string;
  codigo_postal: string;
  cbu: string;
  alias: string;
  deuda: number;
};

export function useNuevoDistribuidor({ onDistribuidorSuccess }: { onDistribuidorSuccess?: () => void } = {}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nuevoDistribuidor, setNuevoDistribuidor] = useState<NuevoDistribuidor>({
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

  // Hook para el modal de notificaciones
  const { isModalOpen: isNotificationOpen, modalType, modalMessage, showSuccessModal, closeModal } = useModalVenta();

  const handleOpenModal = () => {
    setIsModalOpen(true);
    // Resetear el formulario
    setNuevoDistribuidor({
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
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos requeridos
    if (!nuevoDistribuidor.cuit || !nuevoDistribuidor.nombre || !nuevoDistribuidor.email || !nuevoDistribuidor.nombre_fantasia) {
      alert("Por favor completa los campos requeridos (CUIT, Nombre, Email, Nombre de Fantasía)");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/distribuidores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoDistribuidor)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el distribuidor');
      }

      await response.json();
      
      // Limpiar el formulario después de guardar
      setNuevoDistribuidor({
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
      
      // Cerrar el modal
      handleCloseModal();
      
      // Llamar la función de callback si existe
      if (onDistribuidorSuccess) {
        onDistribuidorSuccess();
      }
      
      // Mostrar modal de éxito
      showSuccessModal("Distribuidor cargado exitosamente");
      
    } catch (error) {
      console.error("Error al crear el distribuidor:", error);
      alert("Error al crear el distribuidor: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-center text-xl font-semibold mb-6">Nuevo Distribuidor</h2>
      
      <div className="grid grid-cols-2 gap-6">
        {/* CUIT */}
        <div>
          <Label htmlFor="cuit" className="text-base font-medium">
            CUIT <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cuit"
            value={nuevoDistribuidor.cuit}
            onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, cuit: e.target.value})}
            className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
            required
          />
        </div>

        {/* Nombre de Fantasía */}
        <div>
          <Label htmlFor="nombre_fantasia" className="text-base font-medium">
            Nombre de Fantasía <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nombre_fantasia"
            value={nuevoDistribuidor.nombre_fantasia}
            onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, nombre_fantasia: e.target.value})}
            className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
            required
          />
        </div>

        {/* Nombre */}
        <div>
          <Label htmlFor="nombre" className="text-base font-medium">
            Nombre de Contacto <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nombre"
            value={nuevoDistribuidor.nombre}
            onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, nombre: e.target.value})}
            className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
            required
          />
        </div>

        {/* Teléfono */}
        <div>
          <Label htmlFor="telefono" className="text-base font-medium">Teléfono</Label>
          <Input
            id="telefono"
            value={nuevoDistribuidor.telefono}
            onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, telefono: e.target.value})}
            className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-base font-medium">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={nuevoDistribuidor.email}
            onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, email: e.target.value})}
            className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
            required
          />
        </div>

        {/* Calle */}
        <div>
          <Label htmlFor="calle" className="text-base font-medium">Calle</Label>
          <Input
            id="calle"
            value={nuevoDistribuidor.calle}
            onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, calle: e.target.value})}
            className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
          />
        </div>

        {/* Número */}
        <div>
          <Label htmlFor="numero" className="text-base font-medium">Número</Label>
          <Input
            id="numero"
            type="number"
            value={nuevoDistribuidor.numero}
            onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, numero: e.target.value})}
            className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
          />
        </div>

        {/* Código Postal */}
        <div>
          <Label htmlFor="codigo_postal" className="text-base font-medium">Código Postal</Label>
          <Input
            id="codigo_postal"
            type="number"
            value={nuevoDistribuidor.codigo_postal}
            onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, codigo_postal: e.target.value})}
            className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
          />
        </div>

        {/* CBU */}
        <div>
          <Label htmlFor="cbu" className="text-base font-medium">CBU</Label>
          <Input
            id="cbu"
            value={nuevoDistribuidor.cbu}
            onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, cbu: e.target.value})}
            className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
          />
        </div>

        {/* Alias */}
        <div>
          <Label htmlFor="alias" className="text-base font-medium">Alias</Label>
          <Input
            id="alias"
            value={nuevoDistribuidor.alias}
            onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, alias: e.target.value})}
            className="rounded-full border-2 border-purple-400 focus:ring-purple-500 h-12 text-base"
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 mt-8">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleCloseModal}
          disabled={isLoading}
          className="px-6 py-3 text-base"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !nuevoDistribuidor.cuit || !nuevoDistribuidor.nombre || !nuevoDistribuidor.email || !nuevoDistribuidor.nombre_fantasia}
          className="px-6 py-3 text-base"
        >
          {isLoading ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );

  return {
    isModalOpen,
    handleOpenModal,
    handleCloseModal,
    renderContent,
    isNotificationOpen,
    modalType,
    modalMessage,
    closeModal
  };
}

// ====== Modal de Confirmación de Eliminación ======

interface ModalConfirmacionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ModalConfirmacion({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  isLoading = false
}: ModalConfirmacionProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center p-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
            className="px-4 py-2"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
          >
            {isLoading ? "Eliminando..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Hook para manejar el modal de confirmación
export function useModalConfirmacion() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Eliminar',
    cancelText: 'Cancelar'
  });
  const [isLoading, setIsLoading] = useState(false);

  const showConfirmModal = (data: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }) => {
    setModalData({
      title: data.title,
      message: data.message,
      onConfirm: data.onConfirm,
      confirmText: data.confirmText || 'Eliminar',
      cancelText: data.cancelText || 'Cancelar'
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsLoading(false);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await modalData.onConfirm();
      closeModal();
    } catch (error) {
      console.error('Error en confirmación:', error);
      setIsLoading(false);
    }
  };

  return {
    isModalOpen,
    modalData,
    isLoading,
    showConfirmModal,
    closeModal,
    handleConfirm
  };
}

// ====== Modal de Nueva Mascota ======

type NuevaMascota = {
  nombre: string;
  especie: string;
  raza: string;
  sexo: string;
  edad: string;
  peso: string;
  estado_reproductivo: boolean;
  deceso: boolean;
  foto: File | null;
};

export function useNuevaMascota({ onMascotaSuccess }: { onMascotaSuccess?: () => void } = {}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nuevaMascotaForm, setNuevaMascotaForm] = useState<NuevaMascota>({
    nombre: '',
    especie: '',
    raza: '',
    sexo: '',
    edad: '',
    peso: '',
    estado_reproductivo: false,
    deceso: false,
    foto: null
  });
  const [ownerInfo, setOwnerInfo] = useState({ nombre: '', apellido: '', id_clinete: '' });

  const abrirModal = (owner: any) => {
    setOwnerInfo(owner);
    setNuevaMascotaForm({
      nombre: '',
      especie: '',
      raza: '',
      sexo: '',
      edad: '',
      peso: '',
      estado_reproductivo: false,
      deceso: false,
      foto: null
    });
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
  };

  const manejarEnvioNuevaMascota = async (e: any) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      console.log('Datos del formulario:', nuevaMascotaForm);
      console.log('Información del propietario:', ownerInfo);
      
      // Convertir foto a Base64 si existe
      let fotoBase64 = null;
      if (nuevaMascotaForm.foto) {
        console.log('Convirtiendo foto a Base64...');
        fotoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(nuevaMascotaForm.foto!);
        });
        console.log('Foto convertida a Base64');
      }
      
      // Validar campos requeridos antes de enviar
      console.log('Validando campos:', {
        nombre: nuevaMascotaForm.nombre,
        especie: nuevaMascotaForm.especie,
        sexo: nuevaMascotaForm.sexo,
        id_cliente: ownerInfo.id_clinete
      });
      
      if (!nuevaMascotaForm.nombre || !nuevaMascotaForm.especie || !nuevaMascotaForm.sexo) {
        throw new Error('Nombre, especie y sexo son campos requeridos');
      }

      if (!ownerInfo.id_clinete) {
        throw new Error('ID del cliente no encontrado');
      }
      
      // Preparar datos para enviar como JSON
      const data = {
        nombre: nuevaMascotaForm.nombre,
        especie: nuevaMascotaForm.especie,
        raza: nuevaMascotaForm.raza || '',
        sexo: nuevaMascotaForm.sexo,
        edad: parseFloat(nuevaMascotaForm.edad) || 0,
        peso: parseFloat(nuevaMascotaForm.peso) || 0,
        estado_reproductivo: nuevaMascotaForm.estado_reproductivo,
        deceso: false,
        id_cliente: ownerInfo.id_clinete,
        foto: fotoBase64
      };
      
      console.log('Datos a enviar:', data);
      
      const response = await fetch('/api/mascotas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      });

      console.log('Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `Error ${response.status}: ${response.statusText}` };
        }
        console.error('Error del servidor:', errorData);
        console.error('Status:', response.status);
        console.error('Status Text:', response.statusText);
        throw new Error(errorData.error || 'Error al crear la mascota');
      }

      const result = await response.json();
      console.log('Mascota creada exitosamente:', result);

      // Cerrar modal y ejecutar callback
      setIsModalOpen(false);
      if (onMascotaSuccess) {
        onMascotaSuccess();
      }
      
    } catch (error) {
      console.error('Error al crear mascota:', error);
      alert((error as any).message || 'Error al crear la mascota');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (
    <div className="text-gray-900">
      <h2 className="text-center text-base font-semibold mb-4 text-purple-800">
        AGREGAR NUEVA MASCOTA
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Complete los datos de la nueva mascota para {ownerInfo.nombre} {ownerInfo.apellido}
      </p>
      
      <form onSubmit={manejarEnvioNuevaMascota} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Foto de la mascota */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-full">
              
              <div className="text-center">
                <div 
                  className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer group hover:shadow-lg transition-all duration-200 overflow-hidden"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  title="Hacer click para seleccionar foto"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => setNuevaMascotaForm(f => ({ ...f, foto: e.target.files?.[0] || null }))}
                    className="hidden"
                  />
                  {nuevaMascotaForm.foto ? (
                    <img
                      src={URL.createObjectURL(nuevaMascotaForm.foto)}
                      alt="Vista previa"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Camera className="text-purple-600" size={32} />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Seleccionar Foto
                </Button>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF</p>
              </div>
            </div>
          </div>

          {/* Panel derecho - Formulario */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {/* Primera fila */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre_mascota" className="text-gray-700 font-semibold">Nombre *</Label>
                  <Input
                    id="nombre_mascota"
                    value={nuevaMascotaForm.nombre}
                    onChange={e => setNuevaMascotaForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Nombre de la mascota"
                    required
                    className="mt-1 h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="especie_mascota" className="text-gray-700 font-semibold">Especie *</Label>
                  <select
                    id="especie_mascota"
                    value={nuevaMascotaForm.especie}
                    onChange={e => setNuevaMascotaForm(f => ({ ...f, especie: e.target.value }))}
                    required
                    className="mt-1 w-full h-12 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar especie...</option>
                    <option value="Perro">Perro</option>
                    <option value="Gato">Gato</option>
                    <option value="Conejo">Conejo</option>
                    <option value="Ave">Ave</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Segunda fila */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="raza_mascota" className="text-gray-700 font-semibold">Raza</Label>
                  <Input
                    id="raza_mascota"
                    value={nuevaMascotaForm.raza}
                    onChange={e => setNuevaMascotaForm(f => ({ ...f, raza: e.target.value }))}
                    placeholder="Raza de la mascota"
                    className="mt-1 h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="sexo_mascota" className="text-gray-700 font-semibold">Sexo *</Label>
                  <select
                    id="sexo_mascota"
                    value={nuevaMascotaForm.sexo}
                    onChange={e => setNuevaMascotaForm(f => ({ ...f, sexo: e.target.value }))}
                    required
                    className="mt-1 w-full h-12 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar sexo...</option>
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </div>
              </div>

              {/* Tercera fila */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edad_mascota" className="text-gray-700 font-semibold">Edad (años)</Label>
                  <Input
                    id="edad_mascota"
                    type="number"
                    value={nuevaMascotaForm.edad}
                    onChange={e => setNuevaMascotaForm(f => ({ ...f, edad: e.target.value }))}
                    placeholder="Edad en años"
                    min="0"
                    step="0.1"
                    className="mt-1 h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="peso_mascota" className="text-gray-700 font-semibold">Peso (kg)</Label>
                  <Input
                    id="peso_mascota"
                    type="number"
                    value={nuevaMascotaForm.peso}
                    onChange={e => setNuevaMascotaForm(f => ({ ...f, peso: e.target.value }))}
                    placeholder="Peso en kg"
                    min="0"
                    step="0.1"
                    className="mt-1 h-12"
                  />
                </div>
              </div>

              {/* Estado reproductivo */}
              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  id="estado_reproductivo_mascota"
                  checked={nuevaMascotaForm.estado_reproductivo}
                  onChange={e => setNuevaMascotaForm(f => ({ ...f, estado_reproductivo: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <Label htmlFor="estado_reproductivo_mascota" className="text-gray-700 font-semibold">
                  Esterilizado/a
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-6 pt-6">
          <Button type="button" variant="outline" onClick={cerrarModal} className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 px-8 py-2">
            {isLoading ? 'Agregando...' : 'Agregar Mascota'}
          </Button>
        </div>
      </form>
    </div>
  );

  return {
    isModalOpen,
    abrirModal,
    cerrarModal,
    renderContent
  };
}

// ====== Modal de Confirmación de Eliminación de Factura ======

interface ModalConfirmacionFacturaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  modalData: {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
  };
}

export function ModalConfirmacionFactura({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading, 
  modalData 
}: ModalConfirmacionFacturaProps) {
  return (
    <div className="text-center p-6">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
        <Trash2 className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{modalData.title}</h3>
      <p className="text-sm text-gray-500 mb-6 whitespace-pre-line">{modalData.message}</p>
      <div className="flex gap-3 justify-center">
        <Button
          onClick={onClose}
          variant="outline"
          disabled={isLoading}
          className="px-4 py-2"
        >
          {modalData.cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
        >
          {isLoading ? "Eliminando..." : modalData.confirmText}
        </Button>
      </div>
    </div>
  );
}

// ====== Modal de Notificaciones de Factura ======

interface ModalNotificacionFacturaProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  message: string;
}

export function ModalNotificacionFactura({ 
  isOpen, 
  onClose, 
  type, 
  message 
}: ModalNotificacionFacturaProps) {
  return (
    <div className="text-center p-6">
      {type === 'error' ? (
        <>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-sm text-gray-500 mb-4">{message}</p>
          <Button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Entendido
          </Button>
        </>
      ) : type === 'success' ? (
        <>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">¡Éxito!</h3>
          <p className="text-sm text-gray-500 mb-4">{message}</p>
          <Button
            onClick={onClose}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Entendido
          </Button>
        </>
      ) : null}
    </div>
  );
}

// ====== Hook para Ver Registro ======

type FacturaData = {
  id_factura: number;
  tipo_factura: string;
  dia: number;
  mes: number;
  anio: number;
  hora: string;
  forma_de_pago: string;
  monto_total: number;
  detalle: string;
  num_factura: string;
  nombre_usuario: string;
};

type Distribuidor = {
  id_distribuidor: number;
  nombre: string;
  nombre_fantasia?: string;
  cuit: string;
  telefono: string;
  email: string;
};

type FacturaSeleccionada = {
  id_factura: number;
  tipo_factura: string;
};

export function useVerRegistro() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facturaData, setFacturaData] = useState<any>(null);
  const [distribuidorData, setDistribuidorData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("otros");

  const handleOpenModal = async (factura: FacturaSeleccionada) => {
    setIsLoading(true);
    try {
      // Obtener detalles de la factura
      const response = await fetch(`/api/caja/detalle/${factura.id_factura}`);
      
      if (response.ok) {
        const data = await response.json();
        setFacturaData(data.factura);
        
        // Determinar el tipo basado en si tiene distribuidor asociado
        if (data.factura.id_distribuidor) {
          setActiveTab("distribuidores");
          
          try {
            const distribuidorResponse = await fetch(`/api/distribuidores/${data.factura.id_distribuidor}`);
            if (distribuidorResponse.ok) {
              const distribuidorData = await distribuidorResponse.json();
              setDistribuidorData(distribuidorData);
            } else {
              console.error('Error al cargar distribuidor:', distribuidorResponse.status);
            }
          } catch (error) {
            console.error('Error al cargar distribuidor:', error);
          }
        } else {
          setActiveTab("otros");
        }
        
        setIsModalOpen(true);
      } else {
        const errorData = await response.json();
        console.error('Error al cargar detalles de la factura:', errorData);
      }
    } catch (error) {
      console.error('Error al cargar detalles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFacturaData(null);
    setDistribuidorData(null);
  };

  const renderOtrosContent = () => {
    return (
      <div className="space-y-4">
        {/* Campo Monto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto
          </label>
          <input
            type="text"
            placeholder="$ Monto"
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
            value={facturaData?.monto_total || ''}
            readOnly
          />
        </div>

        {/* Campo Detalle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detalle
          </label>
          <input
            type="text"
            placeholder="Detalle"
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
            value={facturaData?.detalle || ''}
            readOnly
          />
        </div>

        {/* Forma de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Forma de pago
          </label>
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <div className="space-y-2">
              {facturaData?.forma_de_pago ? (
                facturaData.forma_de_pago.split(' - ').map((forma: string, index: number) => (
                  <label key={index} className="flex items-center cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{forma}</span>
                  </label>
                ))
              ) : (
                <span className="text-sm text-gray-500">No especificado</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDistribuidoresContent = () => {
    return (
      <div className="space-y-4">
        {/* Campo Número de Recibo/Factura */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Recibo/Factura
          </label>
          <input
            type="text"
            placeholder="N° Recibo/Factura"
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
            value={facturaData?.num_factura || ''}
            readOnly
          />
        </div>

        {/* Campo Monto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto
          </label>
          <input
            type="text"
            placeholder="$ Monto"
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
            value={facturaData?.monto_total || ''}
            readOnly
          />
        </div>

        {/* Forma de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Forma de pago
          </label>
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <div className="space-y-2">
              {facturaData?.forma_de_pago ? (
                facturaData.forma_de_pago.split(' - ').map((forma: string, index: number) => (
                  <label key={index} className="flex items-center cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{forma}</span>
                  </label>
                ))
              ) : (
                <span className="text-sm text-gray-500">No especificado</span>
              )}
            </div>
          </div>
        </div>

        {/* Desplegable de Distribuidores */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distribuidor
          </label>
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <div className="text-sm text-gray-700">
              {distribuidorData ? (distribuidorData.nombre_fantasia || distribuidorData.nombre) : 'No especificado'}
            </div>
          </div>
        </div>

        {/* Información adicional del distribuidor si existe */}
        {distribuidorData && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3">Información del Distribuidor</h4>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium text-blue-700">CUIT:</span> {distribuidorData.cuit}
              </div>
              <div className="text-sm">
                <span className="font-medium text-blue-700">Teléfono:</span> {distribuidorData.telefono}
              </div>
              <div className="text-sm">
                <span className="font-medium text-blue-700">Email:</span> {distribuidorData.email}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return {
    isModalOpen,
    facturaData,
    isLoading,
    activeTab,
    handleOpenModal,
    handleCloseModal,
    title: activeTab === "distribuidores" ? 'EGRESO - DISTRIBUIDOR' : 'EGRESO - VARIOS',
    renderContent: (
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Cargando detalles...</span>
          </div>
        ) : (
          <>
            {/* Mostrar pestañas solo si hay datos para ambos tipos */}
            {/* En modo solo lectura, siempre mostramos solo el contenido correspondiente */}
            
            {/* Contenido dinámico según la pestaña activa */}
            {activeTab === "otros" ? renderOtrosContent() : renderDistribuidoresContent()}
          </>
        )}
      </div>
    )
  };
}

// ====== Hook para Ver Registro de Ingresos ======

export function useVerRegistroIngreso() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facturaData, setFacturaData] = useState<any>(null);
  const [productosData, setProductosData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenModal = async (factura: FacturaSeleccionada) => {
    setIsLoading(true);
    try {
      // Obtener detalles de la factura
      const response = await fetch(`/api/caja/detalle/${factura.id_factura}`);
      
      if (response.ok) {
        const data = await response.json();
        setFacturaData(data.factura);
        setProductosData(data.productos || []);
        setIsModalOpen(true);
      } else {
        const errorData = await response.json();
        console.error('Error al cargar detalles de la factura:', errorData);
      }
    } catch (error) {
      console.error('Error al cargar detalles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFacturaData(null);
    setProductosData([]);
  };

  const renderIngresoContent = () => {
    const totalProductos = productosData.reduce((sum, producto) => sum + (producto.cantidad || 0), 0);
    
    return (
      <div className="space-y-6">
        {/* Información General */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3">📊 Información General</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Fecha y Hora</label>
              <div className="text-sm text-gray-700">
                {facturaData?.dia}/{facturaData?.mes}/{facturaData?.anio} - {facturaData?.hora}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Usuario</label>
              <div className="text-sm text-gray-700">
                {facturaData?.nombre_usuario || 'No especificado'}
              </div>
            </div>
          </div>
        </div>

        {/* Resumen Financiero */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 mb-3">💰 Resumen Financiero</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">Total de la Venta</label>
              <div className="text-lg font-bold text-green-800">
                ${facturaData?.monto_total || '0.00'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">Formas de Pago</label>
              <div className="text-sm text-gray-700">
                {facturaData?.forma_de_pago || 'No especificado'}
              </div>
            </div>
          </div>
        </div>

        {/* Productos Vendidos */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">🛒 Productos Vendidos</h4>
          {productosData.length > 0 ? (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 font-medium text-gray-700">Producto</th>
                      <th className="text-center py-2 font-medium text-gray-700">Cantidad</th>
                      <th className="text-right py-2 font-medium text-gray-700">Precio Unit.</th>
                      <th className="text-right py-2 font-medium text-gray-700">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosData.map((producto, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-2 text-gray-700">
                          {producto.nombre_producto || 'Producto'}
                          {producto.marca && <span className="text-gray-500"> - {producto.marca}</span>}
                        </td>
                        <td className="py-2 text-center text-gray-700">{producto.cantidad}</td>
                        <td className="py-2 text-right text-gray-700">${producto.precio_unidad}</td>
                        <td className="py-2 text-right font-medium text-gray-700">${producto.precio_tot}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                <span className="text-sm font-medium text-gray-700">
                  📊 Total productos: {totalProductos}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No hay productos registrados para esta venta
            </div>
          )}
        </div>

      </div>
    );
  };

  return {
    isModalOpen,
    facturaData,
    productosData,
    isLoading,
    handleOpenModal,
    handleCloseModal,
    title: 'INGRESO - RESUMEN DE VENTA',
    renderContent: (
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Cargando detalles...</span>
          </div>
        ) : (
          renderIngresoContent()
        )}
      </div>
    )
  };
}