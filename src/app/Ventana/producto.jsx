'use client';

import { useState, useEffect } from 'react';
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
  TableCaption,
} from "@/components/ui/table";
import Modal from "@/components/ui/modal";
import { buildProductoFormContent } from "@/lib/modales";
import { useAuth } from '@/components/AuthProvider';

export default function Producto() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // Lista de productos
  const [productos, setProductos] = useState([]);
  const [tipos, setTipos] = useState([]);
  // Estado de carga
  const [cargando, setCargando] = useState(true);
  // Nuevo producto a crear
  const [nuevoProducto, setNuevoProducto] = useState({ 
    nombre: '', 
    marca: '',
    precio_costo: '',
    stock: '',
    id_tipo: '1'
  });
  const [productoEditando, setProductoEditando] = useState(null);
  const [mostrarFormularioEdicion, setMostrarFormularioEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [tipoBusqueda, setTipoBusqueda] = useState('nombre');
  const [paginaActual, setPaginaActual] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [tipoCliente, setTipoCliente] = useState('cliente final');
  const productosPorPagina = 10;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  const [porcentajePersonalizado, setPorcentajePersonalizado] = useState(false);
 

  const validarNumero = (valor) => {
    const numero = parseFloat(valor);
    return isNaN(numero) ? 0 : numero;
  };

  const cargarProductos = async () => {
    try {
      setCargando(true);
  
      
      if (!isAuthenticated) {
        setProductos([]);
        return;
      }
      
      const params = new URLSearchParams({
        page: paginaActual.toString(),
        limit: productosPorPagina.toString()
      });
      
      if (busqueda) {
        params.append('search', busqueda);
        params.append('searchType', tipoBusqueda);
      }
      
      const url = `/api/products?${params}`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Incluir cookies para autenticación
      });
      
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const response = await res.json();
      
      if (response.productos && Array.isArray(response.productos)) {
        setProductos(response.productos);
        setPaginaActual(paginaActual);
        if (response.pagination) {
          setPagination(response.pagination);
        } else {
          setPagination({
            currentPage: paginaActual,
            totalPages: Math.ceil(response.productos.length / productosPorPagina),
            totalItems: response.productos.length
          });
        }
      } else if (Array.isArray(response)) {
        setProductos(response);
        setPaginaActual(paginaActual);
        setPagination({
          currentPage: paginaActual,
          totalPages: Math.ceil(response.length / productosPorPagina),
          totalItems: response.length
        });
      } else {
        setProductos([]);
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      cargarProductos();
    }
  }, [authLoading, isAuthenticated, paginaActual, busqueda, tipoBusqueda]);

  const crearProducto = async () => {
    try {
      // Validaciones
      if (!nuevoProducto.nombre?.trim()) {
        throw new Error('El nombre del producto es requerido');
      }

      const precio_costo = validarNumero(nuevoProducto.precio_costo);
      const stock = validarNumero(nuevoProducto.stock);

      if (precio_costo <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      if (stock < 0) {
        throw new Error('El stock no puede ser negativo');
      }

      const productoParaEnviar = {
        nombre: nuevoProducto.nombre.trim(),
        marca: nuevoProducto.marca?.trim() || '',
        precio_costo: precio_costo,
        stock: stock,
        id_tipo: nuevoProducto.id_tipo || '1'
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(productoParaEnviar),
      });

      // Manejar diferentes tipos de errores
      if (!res.ok) {
        let errorMessage = 'Error al crear producto';
        
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // Si no podemos parsear el JSON, usamos el status text
          errorMessage = `Error: ${res.status} - ${res.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      // Intentar parsear la respuesta exitosa
      let responseData;
      try {
        responseData = await res.json();
      } catch (jsonError) {
      }

      setNuevoProducto({ 
        nombre: '', 
        marca: '', 
        precio_costo: '', 
        stock: '', 
        id_tipo: '1' 
      });
      setMostrarFormulario(false);
      cargarProductos(); // recargar lista
      
      // Mostrar mensaje de éxito
      alert('Producto creado exitosamente');
    } catch (err) {
      alert(err.message);
      console.error('Error completo:', err);
    }
  };

  // Función para actualizar producto
  const actualizarProducto = async () => {
    try {
      if (!productoEditando.nombre_producto?.trim()) {
        throw new Error('El nombre del producto es requerido');
      }

      const precio_costo = validarNumero(productoEditando.precio_costo);
      const stock = validarNumero(productoEditando.stock);
      const porcentajeMayorista = validarNumero(productoEditando.porcentaje_mayorista);
      const porcentajeFinal = validarNumero(productoEditando.porcentaje_final);

      if (precio_costo <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      if (stock < 0) {
        throw new Error('El stock no puede ser negativo');
      }

      const datosActualizacion = {
        nombre: productoEditando.nombre_producto.trim(),
        marca: productoEditando.marca?.trim() || '',
        precio_costo: precio_costo,
        stock: stock,
        id_tipo: productoEditando.id_tipo,
        modificado: porcentajePersonalizado
      };

      // Actualizar el producto
      const res = await fetch(`/api/products/${productoEditando.id_producto}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizacion)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al actualizar producto');
      }

      // Si hay porcentajes personalizados, actualizarlos
      if (porcentajePersonalizado) {
        const resPercentages = await fetch(`/api/products/${productoEditando.id_producto}/percentages`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            porcentaje_mayorista: porcentajeMayorista,
            porcentaje_minorista: porcentajeFinal
          })
        });

        if (!resPercentages.ok) {
          const error = await resPercentages.json();
          throw new Error(error.error || 'Error al actualizar porcentajes');
        }
      }

      // Limpiar estados y recargar datos
      setMostrarFormularioEdicion(false);
      setProductoEditando(null);
      setPorcentajePersonalizado(false);
      cargarProductos();

    } catch (err) {
      alert(err.message);
      console.error('Error completo:', err);
    }
  };

  // Eliminar producto
  
  const eliminarProducto = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      // Verificar si la respuesta fue exitosa
      if (!res.ok) throw new Error('Error al eliminar producto');
      cargarProductos();
    } catch (err) {
      alert('Error al eliminar producto');
      console.error(err);
    }
  };


  // Los productos ya vienen paginados de la API, no necesitamos filtrar localmente
  const productosActuales = Array.isArray(productos) ? productos : [];
  const totalPaginas = pagination.totalPages || 1;
  

  // Calcular precio con porcentaje
  const calcularPrecio = (producto, tipoCliente = 'final') => {
    if (!producto) return 0;
    
    const precio_base = validarNumero(producto.precio_costo);
    const porcentaje = tipoCliente === 'final' ? 
        validarNumero(producto.porcentaje_final) : 
        validarNumero(producto.porcentaje_mayorista);
    
    const precio = precio_base * porcentaje;
    return isNaN(precio) ? 0 : precio;
  };

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-8">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-8 w-full max-w-6xl flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <span className="text-lg font-medium text-gray-700">Verificando autenticación...</span>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-8">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-8 w-full max-w-6xl flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso no autorizado</h2>
            <p className="text-gray-600">Debes iniciar sesión para acceder a esta página.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-8">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-10 w-full max-w-4xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold text-purple-800 tracking-tight mb-2">Gestión de Productos</h1>
            <p className="text-gray-600 text-lg">Administra el inventario y precios</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setMostrarFormulario(true)} className="px-6 py-2">
              Agregar
            </Button>
            <Button
              variant={productoSeleccionado ? "default" : "outline"}
              disabled={!productoSeleccionado}
              onClick={() => {
                if (productoSeleccionado) {
                  setProductoEditando({ ...productoSeleccionado });
                  setMostrarFormularioEdicion(true);
                }
              }}
              className="px-6 py-2"
            >
              Modificar
            </Button>
            <Button
              variant="destructive"
              disabled={!productoSeleccionado}
              onClick={() => {
                if (productoSeleccionado) eliminarProducto(productoSeleccionado.id_producto);
              }}
              className="px-6 py-2"
            >
              Eliminar
            </Button>
          </div>
        </div>

        <div className="mb-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-start">
            {/* Sección de búsqueda */}
            <div className="flex flex-col gap-4 w-full lg:w-1/2">
              <Label className="text-base font-semibold text-gray-800">Buscar Producto</Label>
              
              {/* Campo de búsqueda */}
              <Input
                id="busqueda"
                placeholder={tipoBusqueda === 'codigo' ? "Buscar por código..." : "Buscar por descripción..."}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="text-base px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-400 h-12 transition-colors"
              />
              
              {/* Radio buttons para tipo de búsqueda - Debajo del buscador */}
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="tipoBusqueda"
                    checked={tipoBusqueda === 'nombre'}
                    onChange={() => setTipoBusqueda('nombre')}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                    Por Descripción
                  </span>
                </label>
                <label className="inline-flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="tipoBusqueda"
                    checked={tipoBusqueda === 'codigo'}
                    onChange={() => setTipoBusqueda('codigo')}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                    Por Código
                  </span>
                </label>
              </div>
            </div>

            {/* Sección de tipo de cliente */}
            <div className="flex flex-col gap-4 w-full lg:w-1/2">
              <Label className="text-base font-semibold text-gray-800">Tipo de Cliente</Label>
              
              {/* Radio buttons para tipo de cliente */}
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="tipoCliente"
                    checked={tipoCliente === 'cliente final'}
                    onChange={() => setTipoCliente('cliente final')}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                    Cliente Final
                  </span>
                </label>
                <label className="inline-flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="tipoCliente"
                    checked={tipoCliente === 'mayorista'}
                    onChange={() => setTipoCliente('mayorista')}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                    Mayorista
                  </span>
                </label>
              </div>

              {/* Select como respaldo (oculto) */}
              <select
                id="tipoCliente"
                value={tipoCliente}
                onChange={(e) => setTipoCliente(e.target.value)}
                className="hidden"
              >
                <option value="cliente final">Cliente Final</option>
                <option value="mayorista">Mayorista</option>
              </select>
            </div>
          </div>
        </div>

        {cargando ? (
          <p className="text-center text-lg font-semibold py-8">Cargando productos...</p>
        ) : !Array.isArray(productos) || productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-center text-lg font-semibold bg-red-100 text-red-700 px-6 py-4 rounded-lg border border-red-300">No hay productos disponibles.</p>
          </div>
        ) : productosActuales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-center text-lg font-semibold bg-yellow-100 text-yellow-800 px-6 py-4 rounded-lg border border-yellow-300">No hay productos que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-white">Descripción</TableHead>
                <TableHead className="font-bold text-white">Código</TableHead>
                <TableHead className="font-bold text-white">Stock</TableHead>
                <TableHead className="font-bold text-white">Tipo</TableHead>
                <TableHead className="font-bold text-white">Precio {tipoCliente === 'mayorista' ? 'Mayorista' : 'Final'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productosActuales.map((p, idx) => {
                const precioMostrar = calcularPrecio(
                  p,
                  tipoCliente === 'mayorista' ? 'mayorista' : 'final'
                );
                return (
                  <TableRow
                    key={p.id_producto}
                    className={
                      productoSeleccionado?.id_producto === p.id_producto
                        ? "bg-gray-200 !border-2 !border-gray-500"
                        : "hover:bg-gray-100 transition-colors"
                    }
                    onClick={() => setProductoSeleccionado(p)}
                    style={{ cursor: "pointer" }}
                    aria-rowindex={idx}
                    aria-rowcount={productosActuales.length}
                  >
                    <TableCell>{p.nombre_producto}</TableCell>
                    <TableCell className="text-center">{p.id_producto}</TableCell>
                    <TableCell className="text-center">{p.stock}</TableCell>
                    <TableCell className="text-center">{p.nombre_tipo}</TableCell>
                    <TableCell className="text-center">${precioMostrar.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}


        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-1">
            {/* Botón Primera página */}
            <Button
              variant="outline"
              onClick={() => cambiarPagina(1)}
              disabled={paginaActual === 1}
              className="px-3 py-2 text-sm font-medium"
              size="sm"
            >
              Primera
            </Button>
            
            {/* Botón Anterior */}
            <Button
              variant="outline"
              onClick={() => cambiarPagina(Math.max(paginaActual - 1, 1))}
              disabled={paginaActual === 1}
              className="px-3 py-2 text-sm font-medium"
              size="sm"
            >
              ‹
            </Button>
            
            {/* Números de página - Solo páginas 1, 2 y 3 */}
            {(() => {
              const paginas = [];
              const maxPaginas = Math.min(3, totalPaginas);
              
              // Botones de páginas 1, 2 y 3
              for (let i = 1; i <= maxPaginas; i++) {
                paginas.push(
                  <Button
                    key={i}
                    variant={i === paginaActual ? "default" : "outline"}
                    onClick={() => cambiarPagina(i)}
                    className={`px-3 py-2 text-sm font-medium ${
                      i === paginaActual 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'hover:bg-gray-50'
                    }`}
                    size="sm"
                  >
                    {i}
                  </Button>
                );
              }
              
              return paginas;
            })()}
            
            {/* Botón Siguiente */}
            <Button
              variant="outline"
              onClick={() => cambiarPagina(Math.min(paginaActual + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-2 text-sm font-medium"
              size="sm"
            >
              ›
            </Button>
            
            {/* Botón Última página */}
            <Button
              variant="outline"
              onClick={() => cambiarPagina(totalPaginas)}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-2 text-sm font-medium"
              size="sm"
            >
              Última
            </Button>
          </div>
        )}
      </div>

      {/* Modal de nuevo producto */}
      <Modal isOpen={mostrarFormulario} onClose={() => setMostrarFormulario(false)} contentClassName="max-w-[960px]">
        {buildProductoFormContent({
          mode: "create",
          nuevoProducto,
          setNuevoProducto,
          tipos,
          onCancel: () => setMostrarFormulario(false),
          onSubmit: crearProducto,
        })}
      </Modal>

      {/* Modal de edición de producto */}
      <Modal
        isOpen={Boolean(mostrarFormularioEdicion && productoEditando)}
        contentClassName="max-w-[960px]"
        onClose={() => {
          setMostrarFormularioEdicion(false);
          setProductoEditando(null);
        }}
      >
        {buildProductoFormContent({
          mode: "edit",
          productoEditando,
          setProductoEditando,
          tipos,
          porcentajePersonalizado,
          setPorcentajePersonalizado,
          onCancel: () => {
            setMostrarFormularioEdicion(false);
            setProductoEditando(null);
          },
          onSubmit: actualizarProducto,
        })}
      </Modal>
    </div>
  );
}
