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
  const [paginaActual, setPaginaActual] = useState(1);
  const [tipoCliente, setTipoCliente] = useState('cliente final');
  const productosPorPagina = 10;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  // Nuevos estados para los porcentajes
  const [porcentajePersonalizado, setPorcentajePersonalizado] = useState(false);
 

  // Función para validar número
  const validarNumero = (valor) => {
    const numero = parseFloat(valor);
    return isNaN(numero) ? 0 : numero;
  };

  // Cargar productos desde la API
  const cargarProductos = async () => {
    try {
      setCargando(true);
      const res = await fetch('/api/products');
      
      if (!res.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        // compat con respuesta anterior
        setProductos(data);
        // Derivar tipos desde productos (si vinieron campos de tipo)
        const tiposMap = new Map();
        data.forEach((p) => {
          if (!p) return;
          const key = String(p.id_tipo ?? '');
          if (!key) return;
          if (!tiposMap.has(key)) {
            tiposMap.set(key, {
              id_tipo: p.id_tipo,
              nombre: p.nombre_tipo,
              porcentaje_final: p.porcentaje_final_tipo ?? p.porcentaje_final,
              porcentaje_mayorista: p.porcentaje_mayorista_tipo ?? p.porcentaje_mayorista,
            });
          }
        });
        setTipos(Array.from(tiposMap.values()));
      } else if (data && Array.isArray(data.productos)) {
        setProductos(data.productos);
        // Derivar tipos desde productos (usar porcentajes por defecto del tipo)
        const tiposMap = new Map();
        data.productos.forEach((p) => {
          if (!p) return;
          const key = String(p.id_tipo ?? '');
          if (!key) return;
          if (!tiposMap.has(key)) {
            tiposMap.set(key, {
              id_tipo: p.id_tipo,
              nombre: p.nombre_tipo,
              porcentaje_final: p.porcentaje_final_tipo ?? p.porcentaje_final,
              porcentaje_mayorista: p.porcentaje_mayorista_tipo ?? p.porcentaje_mayorista,
            });
          }
        });
        setTipos(Array.from(tiposMap.values()));
      } else {
        console.error('Respuesta inesperada de /api/products:', data);
        setProductos([]);
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setProductos([]); // En caso de error, establecemos un array vacío
    } finally {
      setCargando(false);
    }
  };

  // Carga los productos en la pagina por primera vez
  useEffect(() => {
    cargarProductos();
  }, []);

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


  // Filtrar productos según la búsqueda y tipo de cliente
  const productosFiltrados = Array.isArray(productos) ? productos.filter(producto => {
    if (!producto) return false;
    return producto.nombre_producto?.toLowerCase().includes(busqueda.toLowerCase());
  }) : [];

  // Calcular productos para la página actual
  const indexUltimoProducto = paginaActual * productosPorPagina;
  const indexPrimerProducto = indexUltimoProducto - productosPorPagina;
  const productosActuales = productosFiltrados.slice(indexPrimerProducto, indexUltimoProducto);
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

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

        <div className="mb-6 flex flex-col md:flex-row md:items-end gap-6">
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <Label htmlFor="busqueda" className="text-base font-semibold">Buscar</Label>
            <Input
              id="busqueda"
              placeholder="Buscar por descripción o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="text-base px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-400 h-12"
            />
          </div>
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <Label htmlFor="tipoCliente" className="text-base font-semibold">Tipo de Cliente</Label>
            <select
              id="tipoCliente"
              value={tipoCliente}
              onChange={(e) => setTipoCliente(e.target.value)}
              className="border-2 border-gray-300 px-4 py-3 rounded-lg font-semibold bg-white text-black focus:border-purple-400 h-12"
            >
              <option value="cliente final">Cliente Final</option>
              <option value="mayorista">Mayorista</option>
            </select>
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
        {productosFiltrados.length > productosPorPagina && (
          <div className="mt-6 flex justify-center items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
              className="px-4"
            >
              ← Anterior
            </Button>
            <span className="text-gray-700 font-semibold px-4 py-2 bg-white rounded-lg border">
              Página {paginaActual} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className="px-4"
            >
              Siguiente →
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
