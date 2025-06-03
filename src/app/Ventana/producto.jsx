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
  
  // Nuevos estados para los porcentajes
  const [porcentajePersonalizado, setPorcentajePersonalizado] = useState(false);
  const [porcentajes, setPorcentajes] = useState({
    mayorista: 19,
    minorista: 35
  });

  // Función para validar número
  const validarNumero = (valor) => {
    const numero = parseFloat(valor);
    return isNaN(numero) ? 0 : numero;
  };

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
      if (!productoEditando.nombre_producto?.trim()) {
        throw new Error('El nombre del producto es requerido');
      }

      const precio_costo = validarNumero(productoEditando.precio_costo);
      const stock = validarNumero(productoEditando.stock);

      if (precio_costo <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      if (stock < 0) {
        throw new Error('El stock no puede ser negativo');
      }

      const datosActualizacion = {
        nombre: productoEditando.nombre_producto.trim(),
        precio_costo: precio_costo,
        stock: stock,
        id_tipo: productoEditando.id_tipo
      };
      
      // Si los porcentajes son personalizados, crear o actualizar en detalle_lista
      if (porcentajePersonalizado) {
        try {
          const porcentajeMayorista = validarNumero(porcentajes.mayorista);
          const porcentajeMinorista = validarNumero(porcentajes.minorista);

          if (porcentajeMayorista <= 0 || porcentajeMinorista <= 0) {
            throw new Error('Los porcentajes deben ser mayores a 0');
          }

          const detalleListaData = {
            nombre: "Lista personalizada",
            detalles: [{
              id_producto: productoEditando.id_producto,
              precio: precio_costo,
              porcentaje_mayorista: porcentajeMayorista,
              porcentaje_minorista: porcentajeMinorista
            }]
          };

          const resLista = await fetch('/api/price-lists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(detalleListaData)
          });

          if (!resLista.ok) {
            const errorData = await resLista.json();
            throw new Error(errorData.error || 'Error al guardar los porcentajes personalizados');
          }
        } catch (err) {
          console.error('Error al guardar porcentajes:', err);
          throw new Error(err.message || 'Error al guardar los porcentajes personalizados');
        }
      }
      
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
      setPorcentajePersonalizado(false);
      setPorcentajes({ mayorista: 19, minorista: 35 });
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

  // Calcular precio con porcentaje
  const calcularPrecio = (precio_base, porcentaje) => {
    const precio = validarNumero(precio_base) * (1 + validarNumero(porcentaje) / 100);
    return isNaN(precio) ? 0 : precio;
  };

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
          <div className="bg-white p-6 rounded-lg w-[500px]">
            <h2 className="text-xl font-bold mb-4">Editar Producto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={productoEditando.nombre_producto || ''}
                  onChange={(e) => setProductoEditando({
                    ...productoEditando,
                    nombre_producto: e.target.value
                  })}
                  className="border px-2 py-1 w-full rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Precio Costo</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productoEditando.precio_costo || ''}
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
                  min="0"
                  value={productoEditando.stock || ''}
                  onChange={(e) => setProductoEditando({
                    ...productoEditando,
                    stock: e.target.value
                  })}
                  className="border px-2 py-1 w-full rounded"
                />
              </div>

              {/* Nueva sección de porcentajes */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="porcentajePersonalizado"
                    checked={porcentajePersonalizado}
                    onChange={(e) => setPorcentajePersonalizado(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="porcentajePersonalizado" className="text-sm font-medium">
                    Personalizar porcentajes de ganancia
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">% Mayorista</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={porcentajes.mayorista}
                      onChange={(e) => setPorcentajes({
                        ...porcentajes,
                        mayorista: validarNumero(e.target.value)
                      })}
                      disabled={!porcentajePersonalizado}
                      className="border px-2 py-1 w-full rounded disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">% Minorista</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={porcentajes.minorista}
                      onChange={(e) => setPorcentajes({
                        ...porcentajes,
                        minorista: validarNumero(e.target.value)
                      })}
                      disabled={!porcentajePersonalizado}
                      className="border px-2 py-1 w-full rounded disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div className="mt-2 text-sm">
                  <div>Precio Mayorista: ${calcularPrecio(productoEditando.precio_costo, porcentajes.mayorista).toFixed(2)}</div>
                  <div>Precio Minorista: ${calcularPrecio(productoEditando.precio_costo, porcentajes.minorista).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => {
                  setMostrarFormularioEdicion(false);
                  setProductoEditando(null);
                  setPorcentajePersonalizado(false);
                  setPorcentajes({ mayorista: 19, minorista: 35 });
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
                {/* <th className="border px-4 py-2 w-1/6">Estado</th> */}
              </tr>
            </thead>
            <tbody>
              {productosActuales.map((p) => {
                const precioMostrar = calcularPrecio(
                  p.precio_costo,
                  tipoCliente === 'mayorista' ? porcentajes.mayorista : porcentajes.minorista
                );
                
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
                    {/* <td className="border px-4 py-3 w-1/6 text-center">
                      {p.modificado ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Modificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Original
                        </span>
                      )}
                    </td>*/}
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
