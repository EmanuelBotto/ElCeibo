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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Distribuidor() {
  // Lista de distribuidores
  const [distribuidores, setDistribuidores] = useState([]);
  // Estado de carga
  const [cargando, setCargando] = useState(true);
  // Nuevo distribuidor a crear
  const [nuevoDistribuidor, setNuevoDistribuidor] = useState({
    cuit: '',
    nombre: '',
    telefono: '',
    email: '',
    nombre_fantasia: '',
    calle: '',
    numero: '',
    codigo_postal: '',
    cbu: '',
    alias: '',
    deuda: '0'
  });
  const [distribuidorEditando, setDistribuidorEditando] = useState(null);
  const [mostrarFormularioEdicion, setMostrarFormularioEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const distribuidoresPorPagina = 10;
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [distribuidorSeleccionado, setDistribuidorSeleccionado] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Función para validar número
  const validarNumero = (valor) => {
    const numero = parseFloat(valor);
    return isNaN(numero) ? 0 : numero;
  };

  // Cargar distribuidores desde la API
  const cargarDistribuidores = async () => {
    try {
      setCargando(true);
      const res = await fetch('/api/distribuidores');
      
      if (!res.ok) {
        throw new Error('Error al cargar distribuidores');
      }

      const data = await res.json();
      
      // Nos aseguramos de que data sea un array
      if (Array.isArray(data)) {
        setDistribuidores(data);
      } else {
        console.error('Los datos recibidos no son un array:', data);
        setDistribuidores([]);
      }
    } catch (err) {
      console.error('Error al cargar distribuidores:', err);
      setDistribuidores([]); // En caso de error, establecemos un array vacío
    } finally {
      setCargando(false);
    }
  };

  // Carga los distribuidores en la pagina por primera vez
  useEffect(() => {
    cargarDistribuidores();
  }, []);

  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (['numero', 'codigo_postal', 'cbu'].includes(name)) {
      setNuevoDistribuidor(prev => ({
        ...prev,
        [name]: value === '' ? '' : value.replace(/\D/g, '')
      }));
    } else if (name === 'deuda') {
      setNuevoDistribuidor(prev => ({
        ...prev,
        [name]: value === '' ? '0' : value.replace(/[^\d.-]/g, '')
      }));
    } else {
      setNuevoDistribuidor(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Crear distribuidor
  const crearDistribuidor = async () => {
    try {
      // Validaciones
      if (!nuevoDistribuidor.cuit?.trim()) {
        throw new Error('El CUIT es requerido');
      }
      if (!nuevoDistribuidor.nombre?.trim()) {
        throw new Error('El nombre es requerido');
      }
      if (!nuevoDistribuidor.email?.trim()) {
        throw new Error('El email es requerido');
      }

      const deuda = validarNumero(nuevoDistribuidor.deuda);

      const distribuidorParaEnviar = {
        cuit: nuevoDistribuidor.cuit.trim(),
        nombre: nuevoDistribuidor.nombre.trim(),
        telefono: nuevoDistribuidor.telefono?.trim() || '',
        email: nuevoDistribuidor.email.trim(),
        nombre_fantasia: nuevoDistribuidor.nombre_fantasia?.trim() || '',
        calle: nuevoDistribuidor.calle?.trim() || '',
        numero: nuevoDistribuidor.numero || '0',
        codigo_postal: nuevoDistribuidor.codigo_postal || '0',
        cbu: nuevoDistribuidor.cbu || '0',
        alias: nuevoDistribuidor.alias?.trim() || '',
        deuda: deuda
      };

      const res = await fetch('/api/distribuidores', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(distribuidorParaEnviar),
      });

      // Manejar diferentes tipos de errores
      if (!res.ok) {
        let errorMessage = 'Error al crear distribuidor';
        
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
        console.warn('La respuesta no contiene JSON válido, pero el distribuidor fue creado');
      }

      setNuevoDistribuidor({
        cuit: '',
        nombre: '',
        telefono: '',
        email: '',
        nombre_fantasia: '',
        calle: '',
        numero: '',
        codigo_postal: '',
        cbu: '',
        alias: '',
        deuda: '0'
      });
      setMostrarFormulario(false);
      cargarDistribuidores(); // recargar lista
      
      // Mostrar mensaje de éxito
      alert('Distribuidor creado exitosamente');
    } catch (err) {
      alert(err.message);
      console.error('Error completo:', err);
    }
  };

  // Función para actualizar distribuidor
  const actualizarDistribuidor = async () => {
    try {
      if (!distribuidorEditando.cuit?.trim()) {
        throw new Error('El CUIT es requerido');
      }
      if (!distribuidorEditando.nombre?.trim()) {
        throw new Error('El nombre es requerido');
      }
      if (!distribuidorEditando.email?.trim()) {
        throw new Error('El email es requerido');
      }

      const deuda = validarNumero(distribuidorEditando.deuda);

      const datosActualizacion = {
        cuit: distribuidorEditando.cuit.trim(),
        nombre: distribuidorEditando.nombre.trim(),
        telefono: distribuidorEditando.telefono?.trim() || '',
        email: distribuidorEditando.email.trim(),
        nombre_fantasia: distribuidorEditando.nombre_fantasia?.trim() || '',
        calle: distribuidorEditando.calle?.trim() || '',
        numero: distribuidorEditando.numero || '0',
        codigo_postal: distribuidorEditando.codigo_postal || '0',
        cbu: distribuidorEditando.cbu || '0',
        alias: distribuidorEditando.alias?.trim() || '',
        deuda: deuda
      };

      // Actualizar el distribuidor
      const res = await fetch(`/api/distribuidores/${distribuidorEditando.id_distribuidor}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizacion)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al actualizar distribuidor');
      }

      // Limpiar estados y recargar datos
      setMostrarFormularioEdicion(false);
      setDistribuidorEditando(null);
      cargarDistribuidores();

    } catch (err) {
      alert(err.message);
      console.error('Error completo:', err);
    }
  };

  // Eliminar distribuidor
  const eliminarDistribuidor = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este distribuidor?')) return;

    try {
      const res = await fetch(`/api/distribuidores/${id}`, { method: 'DELETE' });
      // Verificar si la respuesta fue exitosa
      if (!res.ok) throw new Error('Error al eliminar distribuidor');
      cargarDistribuidores();
    } catch (err) {
      alert('Error al eliminar distribuidor');
      console.error(err);
    }
  };

  // Filtrar distribuidores según la búsqueda
  const distribuidoresFiltrados = Array.isArray(distribuidores) ? distribuidores.filter(distribuidor => {
    if (!distribuidor) return false;
    const busquedaLower = busqueda.toLowerCase();
    return (
      distribuidor.nombre?.toLowerCase().includes(busquedaLower) ||
      distribuidor.cuit?.toLowerCase().includes(busquedaLower) ||
      distribuidor.email?.toLowerCase().includes(busquedaLower) ||
      distribuidor.nombre_fantasia?.toLowerCase().includes(busquedaLower)
    );
  }) : [];

  // Calcular distribuidores para la página actual
  const indexUltimoDistribuidor = paginaActual * distribuidoresPorPagina;
  const indexPrimerDistribuidor = indexUltimoDistribuidor - distribuidoresPorPagina;
  const distribuidoresActuales = distribuidoresFiltrados.slice(indexPrimerDistribuidor, indexUltimoDistribuidor);
  const totalPaginas = Math.ceil(distribuidoresFiltrados.length / distribuidoresPorPagina);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-8">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-10 w-full max-w-6xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-extrabold text-purple-800 tracking-tight">Distribuidores</h1>
          <div className="flex gap-2">
            <Button onClick={() => setMostrarFormulario(true)}>
              Agregar
            </Button>
            <Button
              variant={distribuidorSeleccionado ? "default" : "outline"}
              disabled={!distribuidorSeleccionado}
              onClick={() => {
                if (distribuidorSeleccionado) {
                  setDistribuidorEditando({ ...distribuidorSeleccionado });
                  setMostrarFormularioEdicion(true);
                }
              }}
            >
              Modificar
            </Button>
            <Button
              variant="destructive"
              disabled={!distribuidorSeleccionado}
              onClick={() => {
                if (distribuidorSeleccionado) eliminarDistribuidor(distribuidorSeleccionado.id_distribuidor);
              }}
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
              placeholder="Buscar por nombre, CUIT, email o fantasía..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="text-base px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-400 h-12"
            />
          </div>
        </div>

        {cargando ? (
          <p className="text-center text-lg font-semibold py-8">Cargando distribuidores...</p>
        ) : !Array.isArray(distribuidores) || distribuidores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-center text-lg font-semibold bg-red-100 text-red-700 px-6 py-4 rounded-lg border border-red-300">No hay distribuidores disponibles.</p>
          </div>
        ) : distribuidoresActuales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-center text-lg font-semibold bg-yellow-100 text-yellow-800 px-6 py-4 rounded-lg border border-yellow-300">No hay distribuidores que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CUIT</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Nombre Fantasía</TableHead>
                <TableHead>Deuda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distribuidoresActuales.map((d, idx) => (
                <TableRow
                  key={d.id_distribuidor}
                  className={
                    distribuidorSeleccionado?.id_distribuidor === d.id_distribuidor
                      ? "bg-gray-200 !border-2 !border-gray-500"
                      : "hover:bg-gray-100 transition-colors"
                  }
                  onClick={() => setDistribuidorSeleccionado(d)}
                  style={{ cursor: "pointer" }}
                  aria-rowindex={idx}
                  aria-rowcount={distribuidoresActuales.length}
                >
                  <TableCell>{d.cuit}</TableCell>
                  <TableCell>{d.nombre}</TableCell>
                  <TableCell>{d.email}</TableCell>
                  <TableCell>{d.telefono || '-'}</TableCell>
                  <TableCell>{d.nombre_fantasia || '-'}</TableCell>
                  <TableCell className="text-center">${Number(d.deuda)?.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Paginación */}
        {distribuidoresActuales.length > 0 && (
          <div className="mt-4 flex justify-center items-center gap-4">
            <Button
              variant="default"
              onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
            >
              Anterior
            </Button>
            <span className="text-black font-semibold">
              Página {paginaActual} de {totalPaginas}
            </span>
            <Button
              variant="default"
              onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>

      {/* Modal de nuevo distribuidor */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nuevo Distribuidor</h2>
            <div className="flex flex-col gap-2 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cuit">CUIT *</Label>
                  <Input
                    id="cuit"
                    name="cuit"
                    value={nuevoDistribuidor.cuit}
                    onChange={handleInputChange}
                    placeholder="CUIT"
                  />
                </div>
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={nuevoDistribuidor.nombre}
                    onChange={handleInputChange}
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={nuevoDistribuidor.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={nuevoDistribuidor.telefono}
                    onChange={handleInputChange}
                    placeholder="Teléfono"
                  />
                </div>
                <div>
                  <Label htmlFor="nombre_fantasia">Nombre Fantasía</Label>
                  <Input
                    id="nombre_fantasia"
                    name="nombre_fantasia"
                    value={nuevoDistribuidor.nombre_fantasia}
                    onChange={handleInputChange}
                    placeholder="Nombre Fantasía"
                  />
                </div>
                <div>
                  <Label htmlFor="deuda">Deuda</Label>
                  <Input
                    id="deuda"
                    name="deuda"
                    type="number"
                    step="0.01"
                    value={nuevoDistribuidor.deuda}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="calle">Calle</Label>
                  <Input
                    id="calle"
                    name="calle"
                    value={nuevoDistribuidor.calle}
                    onChange={handleInputChange}
                    placeholder="Calle"
                  />
                </div>
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    name="numero"
                    type="number"
                    value={nuevoDistribuidor.numero}
                    onChange={handleInputChange}
                    placeholder="Número"
                  />
                </div>
                <div>
                  <Label htmlFor="codigo_postal">Código Postal</Label>
                  <Input
                    id="codigo_postal"
                    name="codigo_postal"
                    type="number"
                    value={nuevoDistribuidor.codigo_postal}
                    onChange={handleInputChange}
                    placeholder="Código Postal"
                  />
                </div>
                <div>
                  <Label htmlFor="cbu">CBU</Label>
                  <Input
                    id="cbu"
                    name="cbu"
                    type="number"
                    value={nuevoDistribuidor.cbu}
                    onChange={handleInputChange}
                    placeholder="CBU"
                  />
                </div>
                <div>
                  <Label htmlFor="alias">Alias</Label>
                  <Input
                    id="alias"
                    name="alias"
                    value={nuevoDistribuidor.alias}
                    onChange={handleInputChange}
                    placeholder="Alias"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMostrarFormulario(false)}>
                Cancelar
              </Button>
              <Button onClick={crearDistribuidor}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de distribuidor */}
      {mostrarFormularioEdicion && distribuidorEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Editar Distribuidor</h2>
            <div className="flex flex-col gap-2 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cuitEdit">CUIT *</Label>
                  <Input
                    id="cuitEdit"
                    value={distribuidorEditando.cuit || ''}
                    onChange={(e) => setDistribuidorEditando({ ...distribuidorEditando, cuit: e.target.value })}
                    placeholder="CUIT"
                  />
                </div>
                <div>
                  <Label htmlFor="nombreEdit">Nombre *</Label>
                  <Input
                    id="nombreEdit"
                    value={distribuidorEditando.nombre || ''}
                    onChange={(e) => setDistribuidorEditando({ ...distribuidorEditando, nombre: e.target.value })}
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <Label htmlFor="emailEdit">Email *</Label>
                  <Input
                    id="emailEdit"
                    type="email"
                    value={distribuidorEditando.email || ''}
                    onChange={(e) => setDistribuidorEditando({ ...distribuidorEditando, email: e.target.value })}
                    placeholder="Email"
                  />
                </div>
                <div>
                  <Label htmlFor="telefonoEdit">Teléfono</Label>
                  <Input
                    id="telefonoEdit"
                    value={distribuidorEditando.telefono || ''}
                    onChange={(e) => setDistribuidorEditando({ ...distribuidorEditando, telefono: e.target.value })}
                    placeholder="Teléfono"
                  />
                </div>
                <div>
                  <Label htmlFor="nombre_fantasiaEdit">Nombre Fantasía</Label>
                  <Input
                    id="nombre_fantasiaEdit"
                    value={distribuidorEditando.nombre_fantasia || ''}
                    onChange={(e) => setDistribuidorEditando({ ...distribuidorEditando, nombre_fantasia: e.target.value })}
                    placeholder="Nombre Fantasía"
                  />
                </div>
                <div>
                  <Label htmlFor="deudaEdit">Deuda</Label>
                  <Input
                    id="deudaEdit"
                    type="number"
                    step="0.01"
                    value={distribuidorEditando.deuda || '0'}
                    onChange={(e) => setDistribuidorEditando({ ...distribuidorEditando, deuda: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="calleEdit">Calle</Label>
                  <Input
                    id="calleEdit"
                    value={distribuidorEditando.calle || ''}
                    onChange={(e) => setDistribuidorEditando({ ...distribuidorEditando, calle: e.target.value })}
                    placeholder="Calle"
                  />
                </div>
                <div>
                  <Label htmlFor="numeroEdit">Número</Label>
                  <Input
                    id="numeroEdit"
                    type="number"
                    value={distribuidorEditando.numero || ''}
                    onChange={(e) => setDistribuidorEditando({ ...distribuidorEditando, numero: e.target.value })}
                    placeholder="Número"
                  />
                </div>
                <div>
                  <Label htmlFor="codigo_postalEdit">Código Postal</Label>
                  <Input
                    id="codigo_postalEdit"
                    type="number"
                    value={distribuidorEditando.codigo_postal || ''}
                    onChange={(e) => setDistribuidorEditando({ ...distribuidorEditando, codigo_postal: e.target.value })}
                    placeholder="Código Postal"
                  />
                </div>
                <div>
                  <Label htmlFor="cbuEdit">CBU</Label>
                  <Input
                    id="cbuEdit"
                    type="number"
                    value={distribuidorEditando.cbu || ''}
                    onChange={(e) => setDistribuidorEditando({ ...distribuidorEditando, cbu: e.target.value })}
                    placeholder="CBU"
                  />
                </div>
                <div>
                  <Label htmlFor="aliasEdit">Alias</Label>
                  <Input
                    id="aliasEdit"
                    value={distribuidorEditando.alias || ''}
                    onChange={(e) => setDistribuidorEditando({ ...distribuidorEditando, alias: e.target.value })}
                    placeholder="Alias"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setMostrarFormularioEdicion(false);
                setDistribuidorEditando(null);
              }}>
                Cancelar
              </Button>
              <Button onClick={actualizarDistribuidor}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 