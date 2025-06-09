'use client';

import { useState, useEffect } from 'react';

export default function Producto() {
  // Llista de productos
  const [productos, setProductos] = useState([]);
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
      
      // Nos aseguramos de que data sea un array
      if (Array.isArray(data)) {
        setProductos(data);
      } else {
        console.error('Los datos recibidos no son un array:', data);
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
    
    const precio = precio_base * (1 + porcentaje / 100);
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
              type="text"
              placeholder="marca"
              value={nuevoProducto.marca}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, marca: e.target.value })}
              className="border px-2 py-1 mb-4 w-full"
            />
            <input
              type="number"
              placeholder="Precio"
              value={nuevoProducto.precio_costo}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio_costo: e.target.value })}
              className="border px-2 py-1 mb-4 w-full"
            />
            <input
              type="number"
              placeholder="Stock"
              value={nuevoProducto.stock}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })}
              className="border px-2 py-1 mb-4 w-full"
            />
            <select
              value={nuevoProducto.id_tipo}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, id_tipo: e.target.value })}
              className="border px-2 py-1 mb-4 w-full"
            >
              <option value="1">Balanceado</option>
              <option value="2">Medicamento</option>
              <option value="3">Accesorio</option>
              <option value="4">Acuario</option>

            </select>
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

              {/* Sección de porcentajes */}
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
                      value={productoEditando.porcentaje_mayorista || ''}
                      onChange={(e) => setProductoEditando({
                        ...productoEditando,
                        porcentaje_mayorista: validarNumero(e.target.value)
                      })}
                      disabled={!porcentajePersonalizado}
                      className="border px-2 py-1 w-full rounded disabled:bg-gray-100"
                    />
                    {!porcentajePersonalizado && (
                      <span className="text-xs text-gray-500">
                        Porcentaje base: {productoEditando.porcentaje_mayorista}%
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">% Final</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productoEditando.porcentaje_final || ''}
                      onChange={(e) => setProductoEditando({
                        ...productoEditando,
                        porcentaje_final: validarNumero(e.target.value)
                      })}
                      disabled={!porcentajePersonalizado}
                      className="border px-2 py-1 w-full rounded disabled:bg-gray-100"
                    />
                    {!porcentajePersonalizado && (
                      <span className="text-xs text-gray-500">
                        Porcentaje base: {productoEditando.porcentaje_final}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Previsualización de precios */}
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <h3 className="font-medium text-sm mb-2">Precios calculados:</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Precio Mayorista: </span>
                      ${calcularPrecio(productoEditando, 'mayorista').toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Precio Final: </span>
                      ${calcularPrecio(productoEditando, 'final').toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => {
                  setMostrarFormularioEdicion(false);
                  setProductoEditando(null);
                  setPorcentajePersonalizado(false);
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
      ) : !Array.isArray(productos) || productos.length === 0 ? (
        <p>No hay productos disponibles.</p>
      ) : productosActuales.length === 0 ? (
        <p>No hay productos que coincidan con la búsqueda.</p>
      ) : (
        <>
          <table className="table-fixed w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2 w-1/3">Descripción</th>
                <th className="border px-4 py-2 w-1/6">Código</th>
                <th className="border px-4 py-2 w-1/6">Stock</th>
                <th className="border px-4 py-2 w-1/6">Tipo</th>
                <th className="border px-4 py-2 w-1/6">Precio {tipoCliente === 'mayorista' ? 'Mayorista' : 'Final'}</th>
                {/*<th className="border px-4 py-2 w-1/6">Estado</th>*/}  
              </tr>
            </thead>
            <tbody>
              {productosActuales.map((p) => {
                const precioMostrar = calcularPrecio(
                  p,
                  tipoCliente === 'mayorista' ? 'mayorista' : 'final'
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
                    <td className="border px-4 py-3 w-1/6 text-center"><button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={() => eliminarProducto(p.id_producto)}>Eliminar</button></td>
                    {/*<td className="border px-4 py-3 w-1/6 text-center">
                      {p.modificado ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Modificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Base
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
