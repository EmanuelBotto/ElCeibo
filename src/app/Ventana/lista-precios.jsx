'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

export default function ListaPrecios() {
  const [listas, setListas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevaLista, setNuevaLista] = useState({
    nombre: '',
    detalles: []
  });
  const [listaSeleccionada, setListaSeleccionada] = useState(null);
  const [mostrarFormularioEdicion, setMostrarFormularioEdicion] = useState(false);

  // Cargar listas de precios
  const cargarListas = async () => {
    try {
      setCargando(true);
      const res = await fetch('/api/price-lists');
      const data = await res.json();
      
      // Verificar que data sea un array
      if (!Array.isArray(data)) {
        console.error('Los datos recibidos no son un array:', data);
        setListas([]);
        return;
      }
      
      // Agrupar los detalles por lista
      const listasAgrupadas = data.reduce((acc, item) => {
        if (!acc[item.id_lista]) {
          acc[item.id_lista] = {
            id_lista: item.id_lista,
            nombre: item.nombre,
            detalles: []
          };
        }
        if (item.id_detalle) {
          acc[item.id_lista].detalles.push({
            id_detalle: item.id_detalle,
            id_producto: item.id_producto,
            nombre_producto: item.nombre_producto,
            precio: item.precio_costo,
            porcentaje_mayorista: item.porcentaje_mayorista,
            porcentaje_minorista: item.porcentaje_minorista
          });
        }
        return acc;
      }, {});
      
      setListas(Object.values(listasAgrupadas));
    } catch (err) {
      console.error('Error al cargar listas:', err);
      alert('Error al cargar las listas de precios');
    } finally {
      setCargando(false);
    }
  };

  // Cargar productos
  const cargarProductos = async () => {
    try {
      const res = await fetch('/api/products?limit=1000'); // Cargar más productos para la lista
      const response = await res.json();
      
      // Manejar la nueva estructura con paginación
      if (response.data && Array.isArray(response.data)) {
        setProductos(response.data);
      } else {
        console.error('Los datos recibidos no tienen la estructura esperada:', response);
        setProductos([]);
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
      alert('Error al cargar los productos');
    }
  };

  useEffect(() => {
    cargarListas();
    cargarProductos();
  }, []);

  // Crear nueva lista
  const crearLista = async () => {
    try {
      const res = await fetch('/api/price-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaLista)
      });

      if (!res.ok) throw new Error('Error al crear lista');

      setMostrarFormulario(false);
      setNuevaLista({ nombre: '', detalles: [] });
      cargarListas();
    } catch (err) {
      console.error('Error al crear lista:', err);
      alert('Error al crear la lista de precios');
    }
  };

  // Actualizar lista
  const actualizarLista = async () => {
    try {
      const res = await fetch(`/api/price-lists/${listaSeleccionada.id_lista}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listaSeleccionada)
      });

      if (!res.ok) throw new Error('Error al actualizar lista');

      setMostrarFormularioEdicion(false);
      setListaSeleccionada(null);
      cargarListas();
    } catch (err) {
      console.error('Error al actualizar lista:', err);
      alert('Error al actualizar la lista de precios');
    }
  };

  // Eliminar lista
  const eliminarLista = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta lista?')) return;

    try {
      const res = await fetch(`/api/price-lists/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al eliminar lista');

      cargarListas();
    } catch (err) {
      console.error('Error al eliminar lista:', err);
      alert('Error al eliminar la lista de precios');
    }
  };

  // Agregar detalle a nueva lista
  const agregarDetalle = () => {
    setNuevaLista(prev => ({
      ...prev,
      detalles: [
        ...prev.detalles,
        { id_producto: '', precio: 0, porcentaje_mayorista: 0, porcentaje_minorista: 0 }
      ]
    }));
  };

  // Actualizar detalle de nueva lista
  const actualizarDetalle = (index, campo, valor) => {
    setNuevaLista(prev => {
      const detalles = [...prev.detalles];
      detalles[index] = { ...detalles[index], [campo]: valor };
      return { ...prev, detalles };
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Listas de Precios</h1>
        <Button onClick={() => setMostrarFormulario(true)}>
          Nueva Lista
        </Button>
      </div>

      {/* Modal de nueva lista */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[600px]">
            <h2 className="text-xl font-bold mb-4">Nueva Lista de Precios</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                value={nuevaLista.nombre}
                onChange={(e) => setNuevaLista(prev => ({ ...prev, nombre: e.target.value }))}
                className="border px-2 py-1 w-full rounded"
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Detalles</h3>
                <Button onClick={agregarDetalle}>
                  Agregar Producto
                </Button>
              </div>

              {nuevaLista.detalles.map((detalle, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                  <select
                    value={detalle.id_producto}
                    onChange={(e) => actualizarDetalle(index, 'id_producto', e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.map(p => (
                      <option key={p.id_producto} value={p.id_producto}>
                        {p.nombre_producto}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Precio"
                    value={detalle.precio}
                    onChange={(e) => actualizarDetalle(index, 'precio', parseFloat(e.target.value))}
                    className="border rounded px-2 py-1"
                  />
                  <input
                    type="number"
                    placeholder="% Mayorista"
                    value={detalle.porcentaje_mayorista}
                    onChange={(e) => actualizarDetalle(index, 'porcentaje_mayorista', parseInt(e.target.value))}
                    className="border rounded px-2 py-1"
                  />
                  <input
                    type="number"
                    placeholder="% Minorista"
                    value={detalle.porcentaje_minorista}
                    onChange={(e) => actualizarDetalle(index, 'porcentaje_minorista', parseInt(e.target.value))}
                    className="border rounded px-2 py-1"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setMostrarFormulario(false);
                setNuevaLista({ nombre: '', detalles: [] });
              }}>
                Cancelar
              </Button>
              <Button onClick={crearLista}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {mostrarFormularioEdicion && listaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[600px]">
            <h2 className="text-xl font-bold mb-4">Editar Lista de Precios</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                value={listaSeleccionada.nombre}
                onChange={(e) => setListaSeleccionada(prev => ({ ...prev, nombre: e.target.value }))}
                className="border px-2 py-1 w-full rounded"
              />
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Detalles</h3>
              {listaSeleccionada.detalles.map((detalle, index) => (
                <div key={detalle.id_detalle || index} className="grid grid-cols-4 gap-2 mb-2">
                  <div className="px-2 py-1">{detalle.nombre_producto}</div>
                  <input
                    type="number"
                    value={detalle.precio}
                    onChange={(e) => {
                      const detalles = [...listaSeleccionada.detalles];
                      detalles[index] = { ...detalle, precio: parseFloat(e.target.value) };
                      setListaSeleccionada(prev => ({ ...prev, detalles }));
                    }}
                    className="border rounded px-2 py-1"
                  />
                  <input
                    type="number"
                    placeholder="% Mayorista"
                    value={detalle.porcentaje_mayorista}
                    onChange={(e) => {
                      const detalles = [...listaSeleccionada.detalles];
                      detalles[index] = { ...detalle, porcentaje_mayorista: parseInt(e.target.value) };
                      setListaSeleccionada(prev => ({ ...prev, detalles }));
                    }}
                    className="border rounded px-2 py-1"
                  />
                  <input
                    type="number"
                    placeholder="% Minorista"
                    value={detalle.porcentaje_minorista}
                    onChange={(e) => {
                      const detalles = [...listaSeleccionada.detalles];
                      detalles[index] = { ...detalle, porcentaje_minorista: parseInt(e.target.value) };
                      setListaSeleccionada(prev => ({ ...prev, detalles }));
                    }}
                    className="border rounded px-2 py-1"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setMostrarFormularioEdicion(false);
                setListaSeleccionada(null);
              }}>
                Cancelar
              </Button>
              <Button onClick={actualizarLista}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de precios */}
      {cargando ? (
        <p>Cargando listas de precios...</p>
      ) : listas.length === 0 ? (
        <p>No hay listas de precios.</p>
      ) : (
        <div className="space-y-6">
          {listas.map(lista => (
            <div key={lista.id_lista} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{lista.nombre}</h2>
                <div className="space-x-2">
                  <Button onClick={() => {
                    setListaSeleccionada(lista);
                    setMostrarFormularioEdicion(true);
                  }}>
                    Editar
                  </Button>
                  <Button variant="destructive" onClick={() => eliminarLista(lista.id_lista)}>
                    Eliminar
                  </Button>
                </div>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left py-2 px-4">Producto</th>
                    <th className="text-right py-2 px-4">Precio</th>
                    <th className="text-right py-2 px-4">Porcentaje</th>
                    <th className="text-right py-2 px-4">Precio Final</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.detalles.map(detalle => (
                    <tr key={detalle.id_detalle} className="border-t">
                      <td className="py-2 px-4">{detalle.nombre_producto}</td>
                      <td className="text-right py-2 px-4">${detalle.precio}</td>
                      <td className="text-right py-2 px-4">
                        Mayorista: {detalle.porcentaje_mayorista}%<br/>
                        Minorista: {detalle.porcentaje_minorista}%
                      </td>
                      <td className="text-right py-2 px-4">
                        Mayorista: ${(detalle.precio * (1 + detalle.porcentaje_mayorista / 100)).toFixed(2)}<br/>
                        Minorista: ${(detalle.precio * (1 + detalle.porcentaje_minorista / 100)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 