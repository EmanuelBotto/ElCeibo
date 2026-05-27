'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import DialogoNuevoItem from "@/components/DialogoNuevoItem";
import DialogoEditarItem from "@/components/DialogoEditarItem";
import VentanaShell from "@/components/VentanaShell";
import ResponsiveTable from "@/components/ResponsiveTable";
import ListScrollBox from "@/components/ListScrollBox";

export default function Item() {
  // Lista de items
  const [items, setItems] = useState<any[]>([]);
  // Estado de carga
  const [cargando, setCargando] = useState<boolean>(true);
  // Nuevo item a crear
  const [nuevoItem, setNuevoItem] = useState<any>({
    detalle: '',
    rubro: '',
    duracion: '',
    prospecto: ''
  });
  const [itemEditando, setItemEditando] = useState<any>(null);
  const [mostrarFormularioEdicion, setMostrarFormularioEdicion] = useState<boolean>(false);
  const [busqueda, setBusqueda] = useState<string>('');
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [rubroSeleccionado, setRubroSeleccionado] = useState<string>('Todos');
  const itemsPorPagina = 10;
  const [isNuevoItemDialogOpen, setIsNuevoItemDialogOpen] = useState<boolean>(false);
  const [isEditarItemDialogOpen, setIsEditarItemDialogOpen] = useState<boolean>(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState<string>('');

  // Función para validar número
  const validarNumero = (valor: any): number => {
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
      }

      setNuevoItem({
        detalle: '',
        rubro: '',
        duracion: '',
        prospecto: ''
      });
      // setMostrarFormulario(false);
      cargarItems(); // recargar lista
      
      // Mostrar mensaje de éxito
      alert('Item creado exitosamente');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
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
      alert(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error completo:', err);
    }
  };

  // Función para manejar la creación desde el modal
  const handleCrearItem = async (itemData: any) => {
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al crear el item');
      }

      // Recargar items
      cargarItems();
    } catch (error) {
      console.error('Error al crear item:', error);
      throw error;
    }
  };

  // Función para manejar la edición desde el modal
  const handleEditarItem = async (itemData: any) => {
    try {
      const res = await fetch(`/api/items/${itemData.id_item}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar el item');
      }

      // Recargar items
      cargarItems();
    } catch (error) {
      console.error('Error al actualizar item:', error);
      throw error;
    }
  };

  // Eliminar item
  const eliminarItem = async (id: any) => {
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
    
    // Filtro por búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      return item.detalle?.toLowerCase().includes(busquedaLower) ||
             item.rubro?.toLowerCase().includes(busquedaLower);
    }
    
    return true;
  }) : [];

  // Calcular items para la página actual
  const indexUltimoItem = paginaActual * itemsPorPagina;
  const indexPrimerItem = indexUltimoItem - itemsPorPagina;
  const itemsActuales = itemsFiltrados.slice(indexPrimerItem, indexUltimoItem);
  const totalPaginas = Math.ceil(itemsFiltrados.length / itemsPorPagina);

  // Manejar selección de item
  const handleItemSeleccionado = (item: any) => {
    setItemSeleccionado(item);
    setProspectoSeleccionado(item.prospecto || '');
  };

  return (
    <VentanaShell
      maxWidth="6xl"
      maxHeight="7xl"
      toolbar={
        <select
          id="rubro"
          aria-label="Filtrar por rubro"
          value={rubroSeleccionado}
          onChange={(e) => setRubroSeleccionado(e.target.value)}
          className="h-9 w-full sm:w-52 text-sm border-2 border-gray-300 px-3 rounded-lg font-medium bg-white text-black focus:border-purple-400 shadow-sm"
        >
          {rubros.map((rubro) => (
            <option key={rubro} value={rubro}>
              {rubro}
            </option>
          ))}
        </select>
      }
      actions={
        <>
            <Button onClick={() => setIsNuevoItemDialogOpen(true)} className="px-6 py-2">
              Agregar
            </Button>
            <Button
              variant={itemSeleccionado ? "default" : "outline"}
              disabled={!itemSeleccionado}
              onClick={() => {
                if (itemSeleccionado) {
                  setItemEditando({ ...itemSeleccionado });
                  setIsEditarItemDialogOpen(true);
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
        </>
      }
    >
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">
          {/* Tabla de items */}
          <div className="xl:col-span-3 flex flex-col min-h-0">
            <ListScrollBox
              className="shadow-sm"
              footer={
                itemsFiltrados.length > itemsPorPagina ? (
                  <div className="flex justify-center items-center gap-4 py-1">
                    <Button
                      variant="outline"
                      onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                      disabled={paginaActual === 1}
                      className="px-4"
                    >
                      ← Anterior
                    </Button>
                    <span className="text-gray-700 font-semibold px-4 py-2 bg-white rounded-lg border text-sm">
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
                ) : undefined
              }
            >
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
                <ResponsiveTable className="border-0 rounded-none">
                <Table className="min-w-full w-full">
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-bold text-white">Descripción</TableHead>
                      <TableHead className="font-bold text-white">Rubro</TableHead>
                      <TableHead className="font-bold text-white text-center">Duración</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsActuales.map((item, idx) => (
                      <TableRow
                        key={item.id_item}
                        className={
                          itemSeleccionado?.id_item === item.id_item
                            ? "bg-purple-100 border-l-4 border-purple-500"
                            : "hover:bg-gray-50 transition-colors"
                        }
                        onClick={() => handleItemSeleccionado(item)}
                        style={{ cursor: "pointer" }}
                        aria-rowindex={idx}
                        aria-rowcount={itemsActuales.length}
                      >
                        <TableCell className="font-medium">{item.detalle}</TableCell>
                        <TableCell className="text-purple-600 font-medium">{item.rubro}</TableCell>
                        <TableCell className="text-center text-gray-600">
                          {item.duracion ? `${item.duracion} ${parseInt(item.duracion) === 1 ? 'Año' : 'Meses'}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </ResponsiveTable>
              )}
            </ListScrollBox>
          </div>

          {/* Panel de prospecto */}
          <div className="xl:col-span-1 flex flex-col min-h-0">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 sm:p-6 shadow-sm flex flex-col min-h-0 flex-1">
              <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center flex-shrink-0">
                <span className="mr-2">📋</span>
                Prospecto del Item
              </h3>
              <textarea
                value={prospectoSeleccionado}
                onChange={(e) => setProspectoSeleccionado(e.target.value)}
                placeholder="Selecciona un item para ver su prospecto..."
                className="w-full flex-1 min-h-[8rem] p-4 border-2 border-purple-200 rounded-lg resize-none focus:border-purple-400 focus:outline-none bg-white text-gray-800 font-medium leading-relaxed overflow-y-auto"
                disabled
              />
            </div>
          </div>
        </div>

      {/* Modales */}
      <DialogoNuevoItem
        isOpen={isNuevoItemDialogOpen}
        onClose={() => setIsNuevoItemDialogOpen(false)}
        onSubmit={handleCrearItem}
      />

      <DialogoEditarItem
        isOpen={isEditarItemDialogOpen}
        onClose={() => {
          setIsEditarItemDialogOpen(false);
          setItemEditando(null);
        }}
        onSubmit={handleEditarItem}
        itemData={itemEditando}
      />
    </VentanaShell>
  );
}