'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { FileText } from 'lucide-react';

export default function Ingreso({ onVolver }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modoBusqueda, setModoBusqueda] = useState('descripcion'); // 'descripcion' | 'codigo'
  const [tipoCliente, setTipoCliente] = useState('cliente final');
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [totalVenta, setTotalVenta] = useState(0);
  const [formasPago, setFormasPago] = useState([]);

  const validarNumero = (valor) => {
    const numero = parseFloat(valor);
    return isNaN(numero) ? 0 : numero;
  };

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Error al cargar productos');
      const data = await res.json();
      const lista = Array.isArray(data) ? data : Array.isArray(data?.productos) ? data.productos : [];
      setProductos(lista);
    } catch (err) {
      console.error(err);
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const calcularPrecio = (producto, tipo = 'final') => {
    if (!producto) return 0;
    const base = validarNumero(producto.precio_costo);
    const porcentaje = tipo === 'final' ? validarNumero(producto.porcentaje_final) : validarNumero(producto.porcentaje_mayorista);
    const precio = base * porcentaje;
    return isNaN(precio) ? 0 : precio;
  };

  const coincideBusqueda = (p) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    if (modoBusqueda === 'codigo') {
      return String(p.id_producto ?? '').toLowerCase().includes(q);
    }
    return String(p.nombre_producto ?? '').toLowerCase().includes(q);
  };

  const productosFiltrados = Array.isArray(productos) ? productos.filter(coincideBusqueda) : [];
  
  // Limitar productos mostrados para estética
  const productosMostrados = productosFiltrados.slice(0, 50);

  // Función para agregar producto al resumen
  const agregarProducto = (producto) => {
    const precio = calcularPrecio(producto, tipoCliente === 'mayorista' ? 'mayorista' : 'final');
    const productoExistente = productosSeleccionados.find(p => p.id_producto === producto.id_producto);
    
    if (productoExistente) {
      // Si ya existe, incrementar cantidad
      const nuevosProductos = productosSeleccionados.map(p => 
        p.id_producto === producto.id_producto 
          ? { ...p, cantidad: p.cantidad + 1, precioTotal: (p.cantidad + 1) * precio }
          : p
      );
      setProductosSeleccionados(nuevosProductos);
    } else {
      // Si no existe, agregarlo
      const nuevoProducto = {
        ...producto,
        cantidad: 1,
        precioUnitario: precio,
        precioTotal: precio
      };
      setProductosSeleccionados([...productosSeleccionados, nuevoProducto]);
    }
  };

  // Función para actualizar cantidad
  const actualizarCantidad = (idProducto, nuevaCantidad) => {
    const nuevosProductos = productosSeleccionados.map(p => 
      p.id_producto === idProducto 
        ? { ...p, cantidad: nuevaCantidad, precioTotal: nuevaCantidad * p.precioUnitario }
        : p
    );
    setProductosSeleccionados(nuevosProductos);
  };

  // Función para eliminar producto del resumen
  const eliminarProducto = (idProducto) => {
    setProductosSeleccionados(productosSeleccionados.filter(p => p.id_producto !== idProducto));
  };

  // Calcular total de venta
  useEffect(() => {
    const total = productosSeleccionados.reduce((sum, p) => sum + p.precioTotal, 0);
    setTotalVenta(total);
  }, [productosSeleccionados]);

  // Función para manejar cambio de formas de pago
  const handleFormaPagoChange = (formaPago) => {
    if (formasPago.includes(formaPago)) {
      setFormasPago(formasPago.filter(f => f !== formaPago));
    } else {
      setFormasPago([...formasPago, formaPago]);
    }
  };

  // Función para finalizar venta
  const finalizarVenta = async () => {
    if (productosSeleccionados.length === 0) {
      alert('Debe seleccionar al menos un producto');
      return;
    }
    
    if (formasPago.length === 0) {
      alert('Debe seleccionar al menos una forma de pago');
      return;
    }

    // Aquí se implementará la lógica para conectar con la base de datos
    console.log('Finalizando venta:', {
      productos: productosSeleccionados,
      total: totalVenta,
      formasPago: formasPago,
      tipoCliente: tipoCliente
    });
    
    alert('Venta finalizada exitosamente!');
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col items-center justify-start py-6 overflow-hidden mx-6">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 w-full max-w-7xl flex flex-col gap-6 h-full">

        {/* Sección de búsqueda y controles */}
        <div className="flex flex-col gap-6">
          {/* Fila superior: Input de búsqueda y tabla de productos */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              {/* Input de búsqueda */}
              <div className="relative">
                <Input
                  id="busqueda"
                  placeholder={modoBusqueda === 'codigo' ? 'Buscar por código...' : 'Buscar por descripción...'}
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="text-base px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-[#a06ba5] focus:ring-2 focus:ring-[#a06ba5]/20 h-14 pr-12 bg-gray-50 transition-all duration-200"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-6 h-6 text-[#a06ba5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Controles de búsqueda y tipo de cliente */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-6">
                      <label className="inline-flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="modo"
                          checked={modoBusqueda === 'codigo'}
                          onChange={() => setModoBusqueda('codigo')}
                          className="w-5 h-5 text-[#a06ba5] focus:ring-[#a06ba5]"
                        />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-[#a06ba5] transition-colors">Buscar Código</span>
                      </label>
                      <label className="inline-flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="modo"
                          checked={modoBusqueda === 'descripcion'}
                          onChange={() => setModoBusqueda('descripcion')}
                          className="w-5 h-5 text-[#a06ba5] focus:ring-[#a06ba5]"
                        />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-[#a06ba5] transition-colors">Buscar Descripción</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <select
                      id="tipoCliente"
                      value={tipoCliente}
                      onChange={(e) => setTipoCliente(e.target.value)}
                      className="border-2 border-gray-200 px-4 py-3 rounded-lg font-medium bg-white text-gray-700 focus:border-[#a06ba5] focus:ring-2 focus:ring-[#a06ba5]/20 h-12 min-w-[160px] transition-all duration-200"
                    >
                      <option value="cliente final">Cliente Final</option>
                      <option value="mayorista">Mayorista</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tabla de productos a la derecha */}
            <div className="w-full lg:w-1/2">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-3 overflow-y-auto max-h-40 shadow-inner">
                {cargando ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#a06ba5]"></div>
                    <span className="ml-2 text-xs font-medium text-gray-600">Cargando...</span>
                  </div>
                ) : productosMostrados.length === 0 ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="text-center">
                      <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="mt-1 text-xs font-medium text-gray-500">No hay productos</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {productosMostrados.map((p) => {
                      const precio = calcularPrecio(p, tipoCliente === 'mayorista' ? 'mayorista' : 'final');
                      return (
                        <div key={p.id_producto} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:shadow-sm hover:border-[#a06ba5]/30 transition-all duration-200 group">
                          <span className="text-m font-medium text-gray-700 group-hover:text-[#a06ba5] transition-colors truncate pr-2">{p.nombre_producto}</span>
                          <Button 
                            size="sm" 
                            onClick={() => agregarProducto(p)}
                            className="px-2 py-1 text-xs h-6 bg-[#a06ba5] hover:bg-[#a06ba5]/80 text-white rounded transition-all duration-200 flex-shrink-0"
                          >
                            +
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Total de venta */}
        <div className="flex justify-left">
          <div className="bg-gradient-to-r from-[#a06ba5] to-[#8a5a8f] text-white rounded-xl px-6 py-4 shadow-lg">
            <span className="text-xl font-bold">$ TOTAL VENTA: ${totalVenta.toFixed(2)}</span>
          </div>
        </div>

        {/* Resumen de compra */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-3xl p-6 flex-1 min-h-0 shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Resumen de Compra</h3>
              <div className="bg-[#a06ba5]/10 text-[#a06ba5] px-3 py-1 rounded-full text-sm font-semibold">
                {productosSeleccionados.length} productos
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Tabla del resumen */}
              <div className="flex-1 min-w-0">
                {productosSeleccionados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="text-center">
                      <FileText className="mx-auto h-16 w-16 text-gray-400" />
                      <p className="mt-4 text-lg font-medium text-gray-500">No hay productos seleccionados</p>
                      <p className="text-sm text-gray-400">Busca y agrega productos para comenzar</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-h-83 overflow-y-auto shadow-inner">
                    <Table>
                      <TableBody>
                        {productosSeleccionados.map((p) => (
                          <TableRow key={p.id_producto} className="hover:bg-[#a06ba5]/5 transition-colors border-b border-gray-200 group last:border-b-0">
                            <TableCell className="font-medium text-gray-700">{p.nombre_producto}</TableCell>
                            <TableCell className="text-center font-semibold text-green-600 w-24">${p.precioUnitario.toFixed(2)}</TableCell>
                            <TableCell className="text-center py-2 w-24">
                              <Input
                                type="number"
                                min="1"
                                value={p.cantidad}
                                onChange={(e) => actualizarCantidad(p.id_producto, parseInt(e.target.value) || 0)}
                                className="w-16 h-8 text-center text-sm border-[#a06ba5]/20 focus:border-[#a06ba5] focus:ring-[#a06ba5]/20 rounded-lg"
                              />
                            </TableCell>
                            <TableCell className="text-center font-bold text-[#a06ba5] w-32 min-w-32 max-w-32 overflow-hidden text-ellipsis whitespace-nowrap">${p.precioTotal.toFixed(2)}</TableCell>
                            <TableCell className="text-center w-12">
                              <button
                                onClick={() => eliminarProducto(p.id_producto)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-100 rounded-full"
                                title="Eliminar producto"
                              >
                                <svg className="w-5 h-5 text-red-500 hover:text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Formas de pago y botón finalizar */}
              <div className="w-full lg:w-80 flex flex-col gap-4">
                {/* Formas de pago */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Forma de pago
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          value="contado"
                          checked={formasPago.includes("contado")}
                          onChange={() => handleFormaPagoChange("contado")}
                          className="mr-2 text-[#a06ba5] focus:ring-[#a06ba5]"
                        />
                      <span className="text-sm font-medium text-gray-700">Contado</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          value="debito"
                          checked={formasPago.includes("debito")}
                          onChange={() => handleFormaPagoChange("debito")}
                          className="mr-2 text-[#a06ba5] focus:ring-[#a06ba5]"
                        />
                      <span className="text-sm font-medium text-gray-700">Débito</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          value="credito"
                          checked={formasPago.includes("credito")}
                          onChange={() => handleFormaPagoChange("credito")}
                          className="mr-2 text-[#a06ba5] focus:ring-[#a06ba5]"
                        />
                      <span className="text-sm font-medium text-gray-700">Crédito</span>
                    </label>
                  </div>
                </div>

                {/* Botón finalizar */}
                <div className="flex justify-center">
                  <Button
                    onClick={finalizarVenta}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 w-full"
                  >
                    Finalizar Venta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}