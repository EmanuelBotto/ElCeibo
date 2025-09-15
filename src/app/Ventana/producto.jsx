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

export default function Producto() {
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
  const [tipoBusqueda, setTipoBusqueda] = useState('nombre'); // 'nombre' o 'codigo'
  const [paginaActual, setPaginaActual] = useState(1);
  const [tipoCliente, setTipoCliente] = useState('cliente final');
  const productosPorPagina = 10;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [cargandoPagina, setCargandoPagina] = useState(false);
  
  // Nuevos estados para los porcentajes
  const [porcentajePersonalizado, setPorcentajePersonalizado] = useState(false);
 

  // Función para validar número
  const validarNumero = (valor) => {
    const numero = parseFloat(valor);
    return isNaN(numero) ? 0 : numero;
  };

  // Cargar productos desde la API
  const cargarProductos = async (pagina = 1, busqueda = '', tipoBusqueda = 'nombre') => {
    try {
      setCargando(true);
      const params = new URLSearchParams({
        page: pagina.toString(),
        limit: productosPorPagina.toString()
      });
      
      if (busqueda) {
        params.append('search', busqueda);
        params.append('searchType', tipoBusqueda);
      }
      
      const res = await fetch(`/api/products?${params}`);
      
      if (!res.ok) {
        throw new Error('Error al cargar productos');
      }

      const response = await res.json();
      
      // Manejar la nueva estructura con paginación
      if (response.data && Array.isArray(response.data)) {
        setProductos(response.data);
        setPaginaActual(pagina);
        setPagination(response.pagination);
      } else {
        console.error('Los datos recibidos no tienen la estructura esperada:', response);

        setProductos([]);
        setPagination(null);
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setProductos([]); // En caso de error, establecemos un array vacío
    } finally {
      setCargando(false);
    }
  };

  // Función para cambiar de página con transición suave
  const cambiarPagina = async (nuevaPagina) => {
    if (cargandoPagina || nuevaPagina === paginaActual) return;
    
    setCargandoPagina(true);
    
    // Pequeño delay para mostrar la transición
    await new Promise(resolve => setTimeout(resolve, 150));
    
    try {
      await cargarProductos(nuevaPagina, busqueda, tipoBusqueda);
    } finally {
      setCargandoPagina(false);
    }
  };

  // Carga los productos en la pagina por primera vez
  useEffect(() => {
    cargarProductos();
  }, []);

  // Efecto para manejar la búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (busqueda !== '') {
        cargarProductos(1, busqueda, tipoBusqueda);
      } else {
        cargarProductos(1);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [busqueda, tipoBusqueda]);

  // Crear producto
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
        console.warn('La respuesta no contiene JSON válido, pero el producto fue creado');
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


  // Los productos ya vienen filtrados y paginados del servidor
  const productosActuales = Array.isArray(productos) ? productos : [];
  
  // Usar la paginación del servidor si está disponible, sino calcular localmente
  const totalPaginas = pagination ? pagination.totalPages : 1;

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

        {/* Sección de búsqueda y filtros */}
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="flex flex-col gap-3 w-full lg:w-1/2">
              <Label htmlFor="busqueda" className="text-base font-semibold text-gray-700">Buscar Producto</Label>
              <Input
                id="busqueda"
                placeholder={tipoBusqueda === 'nombre' ? "Buscar por nombre del producto..." : "Buscar por código (ID)..."}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="text-base px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-400 h-12 shadow-sm bg-white"
              />
              
              {/* Radio buttons para tipo de búsqueda */}
              <div className="flex gap-6 mt-1">
                <label className="flex items-center gap-2 cursor-pointer hover:bg-white px-3 py-2 rounded-md transition-colors">
                  <input
                    type="radio"
                    name="tipoBusqueda"
                    value="nombre"
                    checked={tipoBusqueda === 'nombre'}
                    onChange={(e) => setTipoBusqueda(e.target.value)}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Por Nombre</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer hover:bg-white px-3 py-2 rounded-md transition-colors">
                  <input
                    type="radio"
                    name="tipoBusqueda"
                    value="codigo"
                    checked={tipoBusqueda === 'codigo'}
                    onChange={(e) => setTipoBusqueda(e.target.value)}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Por Código (ID)</span>
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full lg:w-1/2">
              <Label htmlFor="tipoCliente" className="text-base font-semibold text-gray-700">Tipo de Cliente</Label>
              <select
                id="tipoCliente"
                value={tipoCliente}
                onChange={(e) => setTipoCliente(e.target.value)}
                className="border-2 border-gray-300 px-4 py-3 rounded-lg font-semibold bg-white text-black focus:border-purple-400 h-12 shadow-sm"
              >
                <option value="cliente final">Cliente Final</option>
                <option value="mayorista">Mayorista</option>
              </select>
              {/* Espacio vacío para mantener alineación */}
              <div className="h-8"></div>
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
          <div className={`transition-opacity duration-300 ${cargandoPagina ? 'opacity-50' : 'opacity-100'}`}>
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
          </div>
        )}

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-4">
            <Button
              variant="outline"
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={!pagination.hasPrev || cargandoPagina}
              className={`px-4 transition-all duration-200 ${
                cargandoPagina ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              {cargandoPagina ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  Cargando...
                </div>
              ) : (
                '← Anterior'
              )}
            </Button>
            
            {/* Navegación rápida */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => cambiarPagina(1)}
                disabled={paginaActual === 1 || cargandoPagina}
                className="px-2 py-1 text-xs"
              >
                1
              </Button>
              {paginaActual > 3 && <span className="text-gray-400">...</span>}
              {paginaActual > 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={cargandoPagina}
                  className="px-2 py-1 text-xs"
                >
                  {paginaActual - 1}
                </Button>
              )}
              {paginaActual > 1 && paginaActual < totalPaginas && (
                <Button
                  variant="default"
                  size="sm"
                  className="px-2 py-1 text-xs bg-blue-600 text-white"
                >
                  {paginaActual}
                </Button>
              )}
              {paginaActual < totalPaginas - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={cargandoPagina}
                  className="px-2 py-1 text-xs"
                >
                  {paginaActual + 1}
                </Button>
              )}
              {paginaActual < totalPaginas - 2 && <span className="text-gray-400">...</span>}
              {totalPaginas > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cambiarPagina(totalPaginas)}
                  disabled={paginaActual === totalPaginas || cargandoPagina}
                  className="px-2 py-1 text-xs"
                >
                  {totalPaginas}
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={!pagination.hasNext || cargandoPagina}
              className={`px-4 transition-all duration-200 ${
                cargandoPagina ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              {cargandoPagina ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  Cargando...
                </div>
              ) : (
                'Siguiente →'
              )}
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
