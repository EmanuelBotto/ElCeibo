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
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
    stock: '0',
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
  const productosPorPagina = 20; // cantidad de productos mostrados
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [mostrarDialogoDuplicado, setMostrarDialogoDuplicado] = useState(false);
  const [infoDuplicado, setInfoDuplicado] = useState(null);
  
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
      toast.error('Error al cargar productos. Por favor, intenta de nuevo.');
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
  };

  // Cargar productos solo cuando cambian: autenticación, página o búsqueda
  // NO cuando cambia tipoBusqueda (solo cambia el placeholder)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      cargarProductos();
    }
  }, [authLoading, isAuthenticated, paginaActual, busqueda]);
  
  // NO agregar tipoBusqueda aquí - solo cambia el placeholder del input
  
  // Separar el useEffect para tipoBusqueda (solo para cambiar placeholder)
  useEffect(() => {
    // Este useEffect solo cambia el placeholder, NO recarga productos
    // No hace nada, solo documenta que tipoBusqueda cambia
  }, [tipoBusqueda]);

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
        let isDuplicate = false;
        let duplicateInfo = null;
        
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
          
          // Si es un error de duplicado, mostrar información específica
          if (res.status === 409 && errorData.duplicate) {
            isDuplicate = true;
            duplicateInfo = errorData.duplicate;
            errorMessage = `Ya existe un producto con el nombre "${errorData.duplicate.nombre}" y el mismo tipo. Por favor, cambia el nombre o el tipo para crear un producto diferente.`;
          }
        } catch (jsonError) {
          // Si no podemos parsear el JSON, usamos el status text
          errorMessage = `Error: ${res.status} - ${res.statusText}`;
        }
        
        const error = new Error(errorMessage);
        error.isDuplicate = isDuplicate;
        error.duplicateInfo = duplicateInfo;
        throw error;
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
      toast.success('Producto creado exitosamente');
    } catch (err) {
      if (err.isDuplicate) {
        // Mostrar popup de duplicado
        setInfoDuplicado(err.duplicateInfo);
        setMostrarDialogoDuplicado(true);
        // No logear como error ya que es un comportamiento esperado
        console.log('Producto duplicado detectado:', err.duplicateInfo);
      } else {
        toast.error(err.message);
        console.error('Error completo:', err);
      }
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
        const errorData = await res.json();
        let errorMessage = errorData.error || 'Error al actualizar producto';
        
        // Si es un error de duplicado, mostrar información específica
        if (res.status === 409 && errorData.duplicate) {
          errorMessage = `Ya existe un producto con el nombre "${errorData.duplicate.nombre}" y el mismo tipo. Por favor, cambia el nombre o el tipo para actualizar el producto.`;
        }
        
        const error = new Error(errorMessage);
        error.isDuplicate = res.status === 409 && errorData.duplicate;
        error.duplicateInfo = errorData.duplicate;
        throw error;
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
      
      toast.success('Producto actualizado exitosamente');
      cargarProductos();

    } catch (err) {
      if (err.isDuplicate) {
        // Mostrar popup de duplicado
        setInfoDuplicado(err.duplicateInfo);
        setMostrarDialogoDuplicado(true);
        // No logear como error ya que es un comportamiento esperado
        console.log('Producto duplicado detectado:', err.duplicateInfo);
      } else {
        toast.error(err.message);
        console.error('Error completo:', err);
      }
    }
  };

  // Eliminar producto
  
  const eliminarProducto = async (id) => {
    // Buscar el producto para mostrar su nombre
    const producto = productos.find(p => p.id_producto === id);
    setProductoAEliminar(producto);
    setMostrarConfirmacionEliminar(true);
  };

  const ejecutarEliminacion = async () => {
    try {
      const res = await fetch(`/api/products/${productoAEliminar.id_producto}`, { method: 'DELETE' });
      // Verificar si la respuesta fue exitosa
      if (!res.ok) throw new Error('Error al eliminar producto');
      
      toast.success('Producto eliminado exitosamente');
      setMostrarConfirmacionEliminar(false);
      setProductoAEliminar(null);
      cargarProductos();
    } catch (err) {
      toast.error('Error al eliminar producto');
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
            <h1 className="text-4xl font-bold text-purple-800 tracking-tight mb-2">Productos</h1>
            
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

        {/* Sección de búsqueda y filtros integrada */}
        <div className="mb-4">
          {/* Barra de búsqueda principal */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Buscar Producto</Label>
              <Input
                id="busqueda"
                placeholder={tipoBusqueda === 'codigo' ? "Buscar por código..." : "Buscar por descripción..."}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="text-base px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 h-12 transition-all duration-200"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Tipo de búsqueda */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-gray-700">Buscar por</Label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="tipoBusqueda"
                      checked={tipoBusqueda === 'nombre'}
                      onChange={() => setTipoBusqueda('nombre')}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                      Descripción
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="tipoBusqueda"
                      checked={tipoBusqueda === 'codigo'}
                      onChange={() => setTipoBusqueda('codigo')}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                      Código
                    </span>
                  </label>
                </div>
              </div>

              {/* Tipo de cliente */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-gray-700">Tipo de Cliente</Label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="tipoCliente"
                      checked={tipoCliente === 'cliente final'}
                      onChange={() => setTipoCliente('cliente final')}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                      Final
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="tipoCliente"
                      checked={tipoCliente === 'mayorista'}
                      onChange={() => setTipoCliente('mayorista')}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                      Mayorista
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla estática - siempre visible */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold text-white">Descripción</TableHead>
              <TableHead className="font-bold text-white">Código</TableHead>
              <TableHead className="font-bold text-white">Stock</TableHead>
              <TableHead className="font-bold text-white text-center">Tipo</TableHead>
              <TableHead className="font-bold text-white text-center">{tipoCliente === 'mayorista' ? 'Mayorista' : 'Final'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargando ? (
              // Estado de carga - fila especial
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="text-lg font-semibold text-gray-600">Cargando productos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !Array.isArray(productos) || productos.length === 0 ? (
              // Sin productos disponibles
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xl">⚠️</span>
                    </div>
                    <p className="text-lg font-semibold text-red-700">No hay productos disponibles</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : productosActuales.length === 0 ? (
              // Sin resultados de búsqueda
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 text-xl">🔍</span>
                    </div>
                    <p className="text-lg font-semibold text-yellow-800">No hay productos que coincidan con la búsqueda</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Productos - contenido dinámico
              productosActuales.map((p, idx) => {
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
              })
            )}
          </TableBody>
        </Table>


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
            
            {/* Números de página dinámicos */}
            {(() => {
              const paginas = [];
              const paginasVisibles = 5; // Mostrar hasta 5 páginas a la vez
              const mitad = Math.floor(paginasVisibles / 2);
              
              let inicio = Math.max(1, paginaActual - mitad);
              let fin = Math.min(totalPaginas, inicio + paginasVisibles - 1);
              
              // Ajustar inicio si estamos cerca del final
              if (fin - inicio + 1 < paginasVisibles) {
                inicio = Math.max(1, fin - paginasVisibles + 1);
              }
              
              // Mostrar puntos suspensivos al inicio si es necesario
              if (inicio > 1) {
                paginas.push(
                  <span key="start-ellipsis" className="px-3 py-2 text-sm text-gray-500">
                    ...
                  </span>
                );
              }
              
              // Generar botones de páginas
              for (let i = inicio; i <= fin; i++) {
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
              
              // Mostrar puntos suspensivos al final si es necesario
              if (fin < totalPaginas) {
                paginas.push(
                  <span key="end-ellipsis" className="px-3 py-2 text-sm text-gray-500">
                    ...
                  </span>
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

      {/* Popup de confirmación de eliminación */}
      <Dialog open={mostrarConfirmacionEliminar} onOpenChange={setMostrarConfirmacionEliminar}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              ¿Eliminar producto?
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {productoAEliminar && (
                <>
                  Estás a punto de eliminar el producto <strong>"{productoAEliminar.nombre_producto}"</strong>.
                  <br />
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setMostrarConfirmacionEliminar(false);
                setProductoAEliminar(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={ejecutarEliminacion}
              className="flex-1"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup de duplicado */}
      <Dialog open={mostrarDialogoDuplicado} onOpenChange={setMostrarDialogoDuplicado}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-orange-600">
              ⚠️ Producto duplicado
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {infoDuplicado && (
                <>
                  Ya existe un producto con el nombre <strong>"{infoDuplicado.nombre}"</strong> y el mismo tipo.
                  <br />
                  <span className="text-orange-600 font-medium">
                    ID del producto existente: {infoDuplicado.id}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setMostrarDialogoDuplicado(false);
                setInfoDuplicado(null);
              }}
              className="flex-1"
            >
              Entendido
            </Button>
            <Button
              onClick={() => {
                setMostrarDialogoDuplicado(false);
                setInfoDuplicado(null);
                // Mantener el formulario abierto para que el usuario pueda modificar
              }}
              className="flex-1"
            >
              Modificar datos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
