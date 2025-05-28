'use client';

import { useState, useEffect } from 'react';

export default function Producto() {
  // Llista de productos
  const [productos, setProductos] = useState([]);
  // Estado de carga
  const [cargando, setCargando] = useState(true);
  // Nuevo producto a crear
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', precio_costo: '' });
  const [productoEditando, setProductoEditando] = useState(null);
  const [mostrarFormularioEdicion, setMostrarFormularioEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [tipoCliente, setTipoCliente] = useState('cliente final');
  const productosPorPagina = 10;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Cargar productos desde la API
  const cargarProductos = async () => {
    try {
      setCargando(true);
      // Llamada a la API para obtener productos
      const res = await fetch('/api/products');
      
      const data = await res.json();
      setProductos(data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
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
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProducto),
      });

      if (!res.ok) throw new Error('Error al crear producto');

      setNuevoProducto({ nombre: '', precio_costo: '' });
      setMostrarFormulario(false);
      cargarProductos(); // recargar lista
    } catch (err) {
      alert('Error al crear producto');
      console.error(err);
    }
  };

  // Función para actualizar producto
  const actualizarProducto = async () => {
    try {
      const datosActualizacion = {
        nombre: productoEditando.nombre_producto,
        precio_costo: parseFloat(productoEditando.precio_costo),
        stock: parseInt(productoEditando.stock),
        id_tipo: productoEditando.id_tipo
      };
      
      console.log('Datos a enviar:', datosActualizacion);
      console.log('ID del producto:', productoEditando.id_producto);
      
      const res = await fetch(`/api/products/${productoEditando.id_producto}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizacion),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al actualizar producto');
      }

      const productoActualizado = await res.json();
      console.log('Respuesta del servidor:', productoActualizado);

      // Verificar si el producto se actualizó correctamente
      const resGet = await fetch('/api/products');
      const productos = await resGet.json();
      console.log('Productos después de actualizar:', productos);

      setMostrarFormularioEdicion(false);
      setProductoEditando(null);
      cargarProductos(); // recargar lista
    } catch (err) {
      alert(err.message);
      console.error('Error completo:', err);
    }
  };

  // Eliminar producto
  /*
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
*/

  // Filtrar productos según la búsqueda y tipo de cliente
  const productosFiltrados = productos.filter(producto => {
    // Primero filtramos por la búsqueda
    const coincideBusqueda = producto.nombre_producto.toLowerCase().includes(busqueda.toLowerCase());
    
    // Si no coincide con la búsqueda, no lo incluimos
    if (!coincideBusqueda) return false;

    // Retornamos true para incluir el producto en los resultados
    return true;
  });

  // Calcular productos para la página actual
  const indexUltimoProducto = paginaActual * productosPorPagina;
  const indexPrimerProducto = indexUltimoProducto - productosPorPagina;
  const productosActuales = productosFiltrados.slice(indexPrimerProducto, indexUltimoProducto);
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <div className="space-x-2">
          <button 
            onClick={() => setMostrarFormulario(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Nuevo Producto
          </button>
          <button 
            onClick={() => {
              if (productoSeleccionado) {
                setProductoEditando({...productoSeleccionado});
                setMostrarFormularioEdicion(true);
              } else {
                alert('Por favor, selecciona un producto para editar');
              }
            }}
            className={`px-4 py-2 rounded ${
              productoSeleccionado 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Editar Producto
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        {/* Selector de tipo de cliente */}
        <div className="flex items-center gap-4">
          <label htmlFor="tipoCliente" className="font-medium">Tipo de Cliente:</label>
          <select
            id="tipoCliente"
            value={tipoCliente}
            onChange={(e) => {
              setTipoCliente(e.target.value);
              setPaginaActual(1); // Reset a la primera página al cambiar el filtro
            }}
            className="border px-4 py-2 rounded"
          >
            <option value="cliente final">Cliente Final</option>
            <option value="mayorista">Mayorista</option>
          </select>
        </div>

        {/* Buscador */}
        <input
          type="text"
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border px-4 py-2 rounded"
        />
      </div>

      {/* Modal de nuevo producto */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Nuevo Producto</h2>
            <input
              type="text"
              placeholder="Nombre"
              value={nuevoProducto.nombre}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
              className="border px-2 py-1 mb-2 w-full"
            />
            <input
              type="number"
              placeholder="Precio"
              value={nuevoProducto.precio_costo}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio_costo: e.target.value })}
              className="border px-2 py-1 mb-4 w-full"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setMostrarFormulario(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button 
                onClick={crearProducto}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de producto */}
      {mostrarFormularioEdicion && productoEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Editar Producto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={productoEditando.nombre_producto}
                  onChange={(e) => setProductoEditando({
                    ...productoEditando,
                    nombre_producto: e.target.value
                  })}
                  className="border px-2 py-1 w-full rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Precio</label>
                <input
                  type="number"
                  value={productoEditando.precio_costo}
                  onChange={(e) => setProductoEditando({
                    ...productoEditando,
                    precio_costo: e.target.value
                  })}
                  className="border px-2 py-1 w-full rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input
                  type="number"
                  value={productoEditando.stock}
                  onChange={(e) => setProductoEditando({
                    ...productoEditando,
                    stock: e.target.value
                  })}
                  className="border px-2 py-1 w-full rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => {
                  setMostrarFormularioEdicion(false);
                  setProductoEditando(null);
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button 
                onClick={actualizarProducto}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {cargando ? (
        <p>Cargando productos...</p>
      ) : productosActuales.length === 0 ? (
        <p>No hay productos que coincidan con la búsqueda.</p>
      ) : (
        <>
          <table className="table-fixed w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2 w-1/3">Descripcion</th>
                <th className="border px-4 py-2 w-1/6">Código</th>
                <th className="border px-4 py-2 w-1/6">Stock</th>
                <th className="border px-4 py-2 w-1/6">Tipo</th>
                <th className="border px-4 py-2 w-1/6">Precio {tipoCliente === 'mayorista' ? 'Mayorista' : 'Final'}</th>
              </tr>
            </thead>
            <tbody>
              {productosActuales.map((p) => {
                const precioMostrar = tipoCliente === 'mayorista' 
                  ? parseFloat(p.precio_costo) * 1.19
                  : parseFloat(p.precio_costo) * 1.35;
                
                return (
                  <tr 
                    key={p.id_producto} 
                    className={`hover:bg-gray-50 cursor-pointer ${
                      productoSeleccionado?.id_producto === p.id_producto 
                        ? 'bg-blue-100' 
                        : ''
                    }`}
                    onClick={() => setProductoSeleccionado(p)}
                  >
                    <td className="border px-4 py-3 w-1/3 truncate">{p.nombre_producto}</td>
                    <td className="border px-4 py-3 w-1/6 text-center">{p.id_producto}</td>
                    <td className="border px-4 py-3 w-1/6 text-center">{p.stock}</td>
                    <td className="border px-4 py-3 w-1/6 text-center">{p.nombre_tipo}</td>
                    <td className="border px-4 py-3 w-1/6 text-center">${precioMostrar.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Paginación */}
          <div className="mt-4 flex justify-center items-center gap-4">
            <button
              onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span>
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
