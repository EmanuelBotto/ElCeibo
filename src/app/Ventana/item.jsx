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

export default function Item() {
  // Lista de items
  const [items, setItems] = useState([]);
  // Estado de carga
  const [cargando, setCargando] = useState(true);
  // Nuevo item a crear
  const [nuevoItem, setNuevoItem] = useState({
    detalle: '',
    rubro: '',
    duracion: '',
    prospecto: ''
  });
  const [itemEditando, setItemEditando] = useState(null);
  const [mostrarFormularioEdicion, setMostrarFormularioEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [rubroSeleccionado, setRubroSeleccionado] = useState('Todos');
  const [tipoBusqueda, setTipoBusqueda] = useState('nombre'); // 'nombre' o 'rubro'
  const itemsPorPagina = 6;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState('');

  // Función para validar número
  const validarNumero = (valor) => {
    const numero = parseFloat(valor);
    return isNaN(numero) ? 0 : numero;
  };

  // Cargar items desde la API
  const cargarItems = async () => {
    try {
      setCargando(true);
      const res = await fetch('/api/items');
      
      if (!res.ok) {
        throw new Error('Error al cargar items');
      }

      const data = await res.json();
      
      // Nos aseguramos de que data sea un array
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        console.error('Los datos recibidos no son un array:', data);
        setItems([]);
      }
    } catch (err) {
      console.error('Error al cargar items:', err);
      setItems([]); // En caso de error, establecemos un array vacío
    } finally {
      setCargando(false);
    }
  };

  // Carga los items en la pagina por primera vez
  useEffect(() => {
    cargarItems();
  }, []);

  // Resetear página cuando cambie la búsqueda o filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, rubroSeleccionado, tipoBusqueda]);

  // Crear item
  const crearItem = async () => {
    try {
      // Validaciones
      if (!nuevoItem.detalle?.trim()) {
        throw new Error('La descripción es requerida');
      }
      if (!nuevoItem.rubro?.trim()) {
        throw new Error('El rubro es requerido');
      }

      const itemParaEnviar = {
        detalle: nuevoItem.detalle.trim(),
        rubro: nuevoItem.rubro.trim(),
        duracion: nuevoItem.duracion?.trim() || '',
        prospecto: nuevoItem.prospecto?.trim() || ''
      };

      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(itemParaEnviar),
      });

      // Manejar diferentes tipos de errores
      if (!res.ok) {
        let errorMessage = 'Error al crear item';
        
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
        console.warn('La respuesta no contiene JSON válido, pero el item fue creado');
      }

      setNuevoItem({
        detalle: '',
        rubro: '',
        duracion: '',
        prospecto: ''
      });
      setMostrarFormulario(false);
      cargarItems(); // recargar lista
      
      // Mostrar mensaje de éxito
      alert('Item creado exitosamente');
    } catch (err) {
      alert(err.message);
      console.error('Error completo:', err);
    }
  };

  // Función para actualizar item
  const actualizarItem = async () => {
    try {
      if (!itemEditando.detalle?.trim()) {
        throw new Error('La descripción es requerida');
      }
      if (!itemEditando.rubro?.trim()) {
        throw new Error('El rubro es requerido');
      }

      const datosActualizacion = {
        detalle: itemEditando.detalle.trim(),
        rubro: itemEditando.rubro.trim(),
        duracion: itemEditando.duracion?.trim() || '',
        prospecto: itemEditando.prospecto?.trim() || ''
      };

      // Actualizar el item
      const res = await fetch(`/api/items/${itemEditando.id_item}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizacion)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al actualizar item');
      }

      // Limpiar estados y recargar datos
      setMostrarFormularioEdicion(false);
      setItemEditando(null);
      cargarItems();

    } catch (err) {
      alert(err.message);
      console.error('Error completo:', err);
    }
  };

  // Eliminar item
  const eliminarItem = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este item?')) return;

    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      // Verificar si la respuesta fue exitosa
      if (!res.ok) throw new Error('Error al eliminar item');
      cargarItems();
      setItemSeleccionado(null);
      setProspectoSeleccionado('');
    } catch (err) {
      alert('Error al eliminar item');
      console.error(err);
    }
  };

  // Rubros únicos para el dropdown
  const rubros = ['Todos', ...Array.from(new Set(items.map(i => i.rubro)))];

  // Filtrar items según la búsqueda y rubro
  const itemsFiltrados = Array.isArray(items) ? items.filter(item => {
    if (!item) return false;
    
    // Filtro por rubro
    if (rubroSeleccionado !== 'Todos' && item.rubro !== rubroSeleccionado) {
      return false;
    }
    
    // Filtro por búsqueda según el tipo seleccionado
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      if (tipoBusqueda === 'nombre') {
        return item.detalle?.toLowerCase().includes(busquedaLower);
      } else if (tipoBusqueda === 'rubro') {
        return item.rubro?.toLowerCase().includes(busquedaLower);
      }
    }
    
    return true;
  }) : [];

  // Calcular items para la página actual
  const indexUltimoItem = paginaActual * itemsPorPagina;
  const indexPrimerItem = indexUltimoItem - itemsPorPagina;
  const itemsActuales = itemsFiltrados.slice(indexPrimerItem, indexUltimoItem);
  const totalPaginas = Math.ceil(itemsFiltrados.length / itemsPorPagina);

  // Manejar selección de item
  const handleItemSeleccionado = (item) => {
    setItemSeleccionado(item);
    setProspectoSeleccionado(item.prospecto || '');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-8">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-10 w-full max-w-6xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold text-purple-800 tracking-tight mb-2">Gestión de Items</h1>
            <p className="text-gray-600 text-lg">Administra productos, medicamentos y servicios</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setMostrarFormulario(true)} className="px-6 py-2">
              Agregar
            </Button>
            <Button
              variant={itemSeleccionado ? "default" : "outline"}
              disabled={!itemSeleccionado}
              onClick={() => {
                if (itemSeleccionado) {
                  setItemEditando({ ...itemSeleccionado });
                  setMostrarFormularioEdicion(true);
                }
              }}
              className="px-6 py-2"
            >
              Modificar
            </Button>
            <Button
              variant="destructive"
              disabled={!itemSeleccionado}
              onClick={() => {
                if (itemSeleccionado) eliminarItem(itemSeleccionado.id_item);
              }}
              className="px-6 py-2"
            >
              Eliminar
            </Button>
          </div>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-6">
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <Label htmlFor="busqueda" className="text-base font-semibold text-gray-700">Buscar Items</Label>
            <Input
              id="busqueda"
              placeholder={tipoBusqueda === 'nombre' ? "Buscar por nombre..." : "Buscar por rubro..."}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="text-base px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-400 h-12 shadow-sm"
            />
            <div className="flex gap-6 mt-2">
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
                  value="rubro"
                  checked={tipoBusqueda === 'rubro'}
                  onChange={(e) => setTipoBusqueda(e.target.value)}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">Por Rubro</span>
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <Label htmlFor="rubro" className="text-base font-semibold text-gray-700">Filtrar por Rubro</Label>
            <select
              id="rubro"
              value={rubroSeleccionado}
              onChange={(e) => setRubroSeleccionado(e.target.value)}
              className="border-2 border-gray-300 px-4 py-3 rounded-lg font-semibold bg-white text-black focus:border-purple-400 h-12 shadow-sm"
            >
              {rubros.map(rubro => (
                <option key={rubro} value={rubro}>{rubro}</option>
              ))}
            </select>
            {/* Espacio vacío para mantener alineación con los checkboxes */}
            <div className="h-10"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tabla de items */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">       
              {cargando ? (
                <div className="p-8 text-center">
                  <p className="text-lg font-semibold text-gray-600">Cargando items...</p>
                </div>
              ) : !Array.isArray(items) || items.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-lg font-semibold bg-red-100 text-red-700 px-6 py-4 rounded-lg border border-red-300">No hay items disponibles.</p>
                </div>
              ) : itemsActuales.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-lg font-semibold bg-yellow-100 text-yellow-800 px-6 py-4 rounded-lg border border-yellow-300">No hay items que coincidan con la búsqueda.</p>
                </div>
              ) : (
                <div className="min-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-bold text-white">Descripción</TableHead>
                        <TableHead className="font-bold text-white">Rubro</TableHead>
                        <TableHead className="font-bold text-white text-center">Duración</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 6 }, (_, idx) => {
                        const item = itemsActuales[idx];
                        return (
                          <TableRow
                            key={item ? item.id_item : `empty-${idx}`}
                            className={
                              item && itemSeleccionado?.id_item === item.id_item
                                ? "bg-purple-100 border-l-4 border-purple-500"
                                : item
                                ? "hover:bg-gray-50 transition-colors"
                                : "h-16" // Altura fija para filas vacías
                            }
                            onClick={() => item && handleItemSeleccionado(item)}
                            style={{ cursor: item ? "pointer" : "default" }}
                            aria-rowindex={idx}
                            aria-rowcount={6}
                          >
                            <TableCell className="font-medium">
                              {item ? item.detalle : ''}
                            </TableCell>
                            <TableCell className="text-purple-600 font-medium">
                              {item ? item.rubro : ''}
                            </TableCell>
                            <TableCell className="text-center text-gray-600">
                              {item ? (item.duracion ? `${item.duracion} ${parseInt(item.duracion) === 1 ? 'Año' : 'Meses'}` : '-') : ''}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Paginación */}
            {itemsFiltrados.length > itemsPorPagina && (
              <div className="mt-6 flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPaginaActual(1)}
                  disabled={paginaActual === 1}
                  className="px-3 py-2 text-sm"
                >
                  « Primera
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-2 text-sm"
                >
                  ← Anterior
                </Button>
                
                {/* Números de página */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let pageNum;
                    if (totalPaginas <= 5) {
                      pageNum = i + 1;
                    } else if (paginaActual <= 3) {
                      pageNum = i + 1;
                    } else if (paginaActual >= totalPaginas - 2) {
                      pageNum = totalPaginas - 4 + i;
                    } else {
                      pageNum = paginaActual - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={paginaActual === pageNum ? "default" : "outline"}
                        onClick={() => setPaginaActual(pageNum)}
                        className="px-3 py-2 text-sm min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-2 text-sm"
                >
                  Siguiente →
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPaginaActual(totalPaginas)}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-2 text-sm"
                >
                  Última »
                </Button>
                
                <span className="text-gray-600 text-sm ml-4">
                  {itemsFiltrados.length} items total
                </span>
              </div>
            )}
          </div>

          {/* Panel de prospecto */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
                <span className="mr-2">📋</span>
                Prospecto del Item
              </h3>
              <textarea
                value={prospectoSeleccionado}
                onChange={(e) => setProspectoSeleccionado(e.target.value)}
                placeholder="Selecciona un item para ver su prospecto..."
                className="w-full h-48 p-4 border-2 border-purple-200 rounded-lg resize-none focus:border-purple-400 focus:outline-none bg-white text-gray-800 font-medium leading-relaxed"
                disabled
              />
              
            </div>
          </div>
        </div>
      </div>

      {/* Modal de nuevo item */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nuevo Item</h2>
            <div className="flex flex-col gap-4 mb-4">
              <div>
                <Label htmlFor="detalle">Descripción *</Label>
                <Input
                  id="detalle"
                  value={nuevoItem.detalle}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, detalle: e.target.value })}
                  placeholder="Descripción del item"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="rubro">Rubro *</Label>
                <Input
                  id="rubro"
                  value={nuevoItem.rubro}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, rubro: e.target.value })}
                  placeholder="Rubro del item"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="duracion">Duración</Label>
                <Input
                  id="duracion"
                  value={nuevoItem.duracion}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, duracion: e.target.value })}
                  placeholder="Duración (ej: 12 meses)"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="prospecto">Prospecto</Label>
                <textarea
                  id="prospecto"
                  value={nuevoItem.prospecto}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, prospecto: e.target.value })}
                  placeholder="Prospecto del item..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:border-purple-400 focus:outline-none mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMostrarFormulario(false)}>
                Cancelar
              </Button>
              <Button onClick={crearItem}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de item */}
      {mostrarFormularioEdicion && itemEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Editar Item</h2>
            <div className="flex flex-col gap-4 mb-4">
              <div>
                <Label htmlFor="detalleEdit">Descripción *</Label>
                <Input
                  id="detalleEdit"
                  value={itemEditando.detalle || ''}
                  onChange={(e) => setItemEditando({ ...itemEditando, detalle: e.target.value })}
                  placeholder="Descripción del item"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="rubroEdit">Rubro *</Label>
                <Input
                  id="rubroEdit"
                  value={itemEditando.rubro || ''}
                  onChange={(e) => setItemEditando({ ...itemEditando, rubro: e.target.value })}
                  placeholder="Rubro del item"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="duracionEdit">Duración</Label>
                <Input
                  id="duracionEdit"
                  value={itemEditando.duracion || ''}
                  onChange={(e) => setItemEditando({ ...itemEditando, duracion: e.target.value })}
                  placeholder="Duración (ej: 12 meses)"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="prospectoEdit">Prospecto</Label>
                <textarea
                  id="prospectoEdit"
                  value={itemEditando.prospecto || ''}
                  onChange={(e) => setItemEditando({ ...itemEditando, prospecto: e.target.value })}
                  placeholder="Prospecto del item..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:border-purple-400 focus:outline-none mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setMostrarFormularioEdicion(false);
                setItemEditando(null);
              }}>
                Cancelar
              </Button>
              <Button onClick={actualizarItem}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}