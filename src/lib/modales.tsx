import React, { useState, useEffect } from "react";

// ====== Modales reutilizables para Productos ======
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

            const result = await response.json();
            
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

            const result = await response.json();
            
            // Limpiar el formulario después de guardar
            setNumeroRecibo("");
            setMonto("");
            setFormasPago([]);
            setDistribuidorSeleccionado("");
            
            alert("Egreso de distribuidor registrado exitosamente");
            
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

  type CreateField = "nombre" | "marca" | "precio_costo" | "stock" | "id_tipo" | "porcentaje_final" | "porcentaje_mayorista";
  type EditField = "nombre" | "precio_costo" | "stock" | "marca" | "id_tipo";

  const getCreateValue = (field: CreateField): string | number => {
    if (!nuevoProducto) return "";
    switch (field) {
      case "nombre":
        return nuevoProducto.nombre ?? "";
      case "marca":
        return nuevoProducto.marca ?? "";
      case "precio_costo":
        return nuevoProducto.precio_costo ?? "";
      case "stock":
        return nuevoProducto.stock ?? "";
      case "id_tipo":
        return nuevoProducto.id_tipo ?? "";
      case "porcentaje_final":
        return nuevoProducto.porcentaje_final ?? "";
      case "porcentaje_mayorista":
        return nuevoProducto.porcentaje_mayorista ?? "";
      default:
        return "";
    }
  };

  const handleCreateChange = (field: CreateField, value: string): void => {
    if (!nuevoProducto || !setNuevoProducto) return;
    setNuevoProducto({ ...nuevoProducto, [field]: value });
  };

  const getEditValue = (field: EditField): string | number => {
    if (!productoEditando) return "";
    switch (field) {
      case "nombre":
        return productoEditando.nombre_producto ?? "";
      case "precio_costo":
        return productoEditando.precio_costo ?? "";
      case "stock":
        return productoEditando.stock ?? "";
      default:
        return "";
    }
  };

  const handleEditChange = (field: EditField, value: string): void => {
    if (!productoEditando || !setProductoEditando) return;
    if (field === "nombre") {
      setProductoEditando({ ...productoEditando, nombre_producto: value });
      return;
    }
    setProductoEditando({ ...productoEditando, [field]: value } as ProductoEditando);
  };

  return (
    <div className={isEdit ? "w-full" : "w-full"}>
      <h2 className="text-center text-base font-semibold mb-4">{isEdit ? "Actualizar Producto" : "Nuevo Producto"}</h2>
      <div className={isEdit ? "grid grid-cols-3 gap-4" : "grid grid-cols-1 gap-3"}>
        <div>
          <Label className="text-sm" htmlFor="idProducto">ID Producto</Label>
          <Input
            id="idProducto"
            value={String((isEdit ? ((productoEditando as ProductoEditando & { id_producto?: string | number })?.id_producto) : (nextIdPreview ?? "")) ?? "")}
            disabled
            className="rounded-full border-2 border-purple-400 focus:ring-purple-500"
          />
        </div>
        <div className={isEdit ? "col-span-1" : ""}>
          <Label className="text-sm" htmlFor={isEdit ? "nombreEdit" : "nombre"}>Descripción</Label>
          <Input
            id={isEdit ? "nombreEdit" : "nombre"}
            value={String(isEdit ? getEditValue("nombre") : getCreateValue("nombre"))}
            onChange={(e) => (isEdit ? handleEditChange("nombre", e.target.value) : handleCreateChange("nombre", e.target.value))}
            className="rounded-full border-2 border-purple-400 focus:ring-purple-500"
          />
        </div>
        {isEdit && (
          <div>
            <Label className="text-sm" htmlFor="rubro">Rubro</Label>
            <select
              id="rubro"
              value={String(((productoEditando as ProductoEditando & { id_tipo?: string })?.id_tipo) ?? "1")}
              onChange={(e) => handleEditChange("id_tipo", e.target.value)}
              className="w-full border-2 border-purple-400 rounded-full px-3 py-2 bg-white text-black"
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
        )}

        {isEdit && (
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
        )}

        {isEdit && (
          <div>
            <Label className="text-sm" htmlFor="marcaEdit">Marca</Label>
            <Input
              id="marcaEdit"
              value={String(((productoEditando as ProductoEditando & { marca?: string })?.marca) ?? "")}
              onChange={(e) => handleEditChange("marca", e.target.value)}
              className="rounded-full border-2 border-purple-400 focus:ring-purple-500"
            />
          </div>
        )}

        {!isEdit && (
          <>
            <Label htmlFor="marca">Marca</Label>
            <Input
              id="marca"
              value={String(getCreateValue("marca"))}
              onChange={(e) => handleCreateChange("marca", e.target.value)}
              className="rounded-full border-2 border-purple-400 focus:ring-purple-500"
            />
          </>
        )}
        {isEdit ? (
          <div className="col-start-1 row-start-3">
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
          <>
            <Label htmlFor="precio">Precio Costo</Label>
            <Input
              id="precio"
              type="number"
              value={String(getCreateValue("precio_costo"))}
              onChange={(e) => handleCreateChange("precio_costo", e.target.value)}
              className="rounded-full border-2 border-purple-400 focus:ring-purple-500"
            />
          </>
        )}

        {!isEdit && (
          <>
            <Label htmlFor="tipo">Tipo</Label>
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
              className="border-2 border-purple-400 rounded-full px-3 py-2"
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
          </>
        )}

        {!isEdit && (
          <>
            <div className="col-start-2 row-start-3">
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
            <div className="col-start-3 row-start-3">
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
            <div className="col-start-2 row-start-4">
              <Label className="text-sm">Precio final</Label>
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
            <div className="col-start-3 row-start-4">
              <Label className="text-sm">Precio final</Label>
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
          </>
        )}
        {isEdit && (
          <>
            <div className="col-start-2 row-start-3">
              <Label className="text-sm" htmlFor="incCF">% incremento CF</Label>
              <Input
                id="incCF"
                type="number"
                step="0.01"
                value={String(((productoEditando as ProductoEditando & { porcentaje_final?: string | number })?.porcentaje_final) ?? "")}
                onChange={(e) => handleEditChange("precio_costo", e.target.value)}
                disabled={!porcentajePersonalizado}
                className={`rounded-full border-2 ${porcentajePersonalizado ? "border-purple-400" : "border-gray-300 bg-gray-100 text-gray-500"}`}
              />
            </div>
            <div className="col-start-3 row-start-3">
              <Label className="text-sm" htmlFor="incR">% de incremento R</Label>
              <Input
                id="incR"
                type="number"
                step="0.01"
                value={String(((productoEditando as ProductoEditando & { porcentaje_mayorista?: string | number })?.porcentaje_mayorista) ?? "")}
                onChange={(e) => setProductoEditando && productoEditando && setProductoEditando({ ...productoEditando, porcentaje_mayorista: e.target.value } as unknown as React.SetStateAction<ProductoEditando | null>)}
                disabled={!porcentajePersonalizado}
                className={`rounded-full border-2 ${porcentajePersonalizado ? "border-purple-400" : "border-gray-300 bg-gray-100 text-gray-500"}`}
              />
            </div>
            <div className="col-start-1 row-start-4 flex items-center gap-2">
              <input
                id="manual"
                type="checkbox"
                checked={porcentajePersonalizado}
                onChange={(e) => setPorcentajePersonalizado && setPorcentajePersonalizado(e.target.checked)}
                className="mr-2"
              />
              <Label htmlFor="manual" className="text-sm">% Manual</Label>
            </div>
            <div className="col-start-2 row-start-4">
              <Label className="text-sm">Precio final</Label>
              <Input
                disabled
                value={(() => {
                  const base = Number(((productoEditando as ProductoEditando)?.precio_costo ?? 0));
                  const mult = Number(((productoEditando as ProductoEditando & { porcentaje_final?: string | number })?.porcentaje_final ?? 0));
                  const v = !isNaN(base * mult) ? (base * mult).toFixed(2) : "";
                  return `$ ${v}`;
                })()}
                className="rounded-full border-2 border-purple-200 bg-gray-50 text-gray-700"
              />
            </div>
            <div className="col-start-3 row-start-4">
              <Label className="text-sm">Precio final</Label>
              <Input
                disabled
                value={(() => {
                  const base = Number(((productoEditando as ProductoEditando)?.precio_costo ?? 0));
                  const mult = Number(((productoEditando as ProductoEditando & { porcentaje_mayorista?: string | number })?.porcentaje_mayorista ?? 0));
                  const v = !isNaN(base * mult) ? (base * mult).toFixed(2) : "";
                  return `$ ${v}`;
                })()}
                className="rounded-full border-2 border-purple-200 bg-gray-50 text-gray-700"
              />
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