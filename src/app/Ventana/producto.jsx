'use client';

import { useState, useEffect } from 'react';

export default function Producto() {
  // Llista de productos
  const [productos, setProductos] = useState([]);
  // Estado de carga
  const [cargando, setCargando] = useState(true);
  // Nuevo producto a crear
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', precio_costo: '' });

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
      cargarProductos(); // recargar lista
    } catch (err) {
      alert('Error al crear producto');
      console.error(err);
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
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>
    {/*
      <div className="mb-6 space-y-2">
        <input
          type="text"
          name="name"
          placeholder="Nombre"
          value={nuevoProducto.name}
          onChange={(e) => setNuevoProducto({ ...nuevoProducto, name: e.target.value })}
          className="border px-2 py-1 mr-2"
        />
        <input
          type="number"
          name="price"
          placeholder="Precio"
          value={nuevoProducto.price}
          onChange={(e) => setNuevoProducto({ ...nuevoProducto, price: e.target.value })}
          className="border px-2 py-1 mr-2"
        />
        
        <button onClick={crearProducto} className="bg-green-600 text-white px-4 py-1 rounded">
          Crear producto
        </button>
        
        
      </div>
    */}
      {cargando ? (
        <p>Cargando productos...</p>
      ) : productos.length === 0 ? (
        <p>No hay productos aún.</p>
      ) : (
        <table className="table-auto w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Nombre</th>
              <th className="border px-4 py-2">Precio</th>
              {/*<th className="border px-4 py-2">Acciones</th>*/}
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id}>
                <td className="border px-4 py-2">{p.id_producto}</td>
                <td className="border px-4 py-2">{p.nombre}</td>
                <td className="border px-4 py-2">${p.precio_costo}</td>
                {/*
                <td className="border px-4 py-2">
                  <button
                    onClick={() => eliminarProducto(p.id_producto)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Eliminar
                  </button>
                </td>
                */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
