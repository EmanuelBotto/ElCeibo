"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { PawPrint, Syringe, FolderOpen, FileText, PlusCircle, Cat, Dog, ArrowLeft, Camera, ChevronDown, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ImageDisplay from '@/components/ImageDisplay';

const InfoCard = ({ title, children, className, headerAction }) => (
  <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
    <div className="flex justify-between items-center border-b border-purple-200 pb-2 mb-3">
      <h3 className="font-bold text-purple-700">{title}</h3>
      {headerAction}
    </div>
    <div>
      {children}
    </div>
  </div>
);

const getPetIcon = (especie) => {
  switch (especie?.toLowerCase()) {
    case 'gato': return <Cat className="inline-block mr-2 text-purple-600" size={18} />;
    case 'perro': return <Dog className="inline-block mr-2 text-purple-600" size={18} />;
    default: return <PawPrint className="inline-block mr-2 text-purple-600" size={18} />;
  }
};

// Caché simple para items de vacunas (no cambian frecuentemente)
let itemsVacunasCache = null;
let itemsVacunasCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export default function FichaPaciente({ mascotaId }) {
  const [ficha, setFicha] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisitaDialogOpen, setIsVisitaDialogOpen] = useState(false);
  const [isVacunaDialogOpen, setIsVacunaDialogOpen] = useState(false);
  const [isFotoDialogOpen, setIsFotoDialogOpen] = useState(false);
  const [isNuevaMascotaDialogOpen, setIsNuevaMascotaDialogOpen] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [visitaForm, setVisitaForm] = useState({ 
    fecha: '', 
    diagnostico: '', 
    frecuencia_cardiaca: '', 
    frecuencia_respiratoria: '', 
    peso: '' 
  });
  const [nuevaVisitaId, setNuevaVisitaId] = useState(null);
  const [vacunaForm, setVacunaForm] = useState({ 
    nombre_vacuna: '', 
    fecha_aplicacion: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    duracion_meses: '', 
    observaciones: '', 
    id_item: '' 
  });
  const [itemsVacunas, setItemsVacunas] = useState([]);
  const [vacunaManual, setVacunaManual] = useState(false);
  const [duracionEditable, setDuracionEditable] = useState(false);
  const [carpetasAbiertas, setCarpetasAbiertas] = useState(new Set());
  const [nuevaMascotaForm, setNuevaMascotaForm] = useState({
    nombre: '',
    especie: '',
    raza: '',
    sexo: '',
    edad: '',
    peso: '',
    estado_reproductivo: false,
    foto: null
  });
  const [visitaSeleccionada, setVisitaSeleccionada] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [proximasVacunas, setProximasVacunas] = useState([]);
  const [vacunaSeleccionada, setVacunaSeleccionada] = useState(null);
  const [modoEdicionVacuna, setModoEdicionVacuna] = useState(false);
  const [nuevaFoto, setNuevaFoto] = useState('');
  const [isActualizandoFoto, setIsActualizandoFoto] = useState(false);
  const router = useRouter();


  useEffect(() => {
    if (mascotaId) {
      const cargarDatosMascota = async () => {
        setIsLoading(true);
        try {
          // Ejecutar todas las llamadas API en paralelo
          const [fichaRes, historialRes, itemsRes, proximasVacunasRes] = await Promise.allSettled([
            fetch(`/api/fichas-paciente/${mascotaId}`),
            fetch(`/api/historial-mascota/${mascotaId}`),
            fetch('/api/items'),
            fetch(`/api/vacunas-aplicadas/proximas?id_mascota=${mascotaId}`)
          ]);

          // Procesar respuesta de ficha principal
          if (fichaRes.status === 'fulfilled' && fichaRes.value.ok) {
            const fichaData = await fichaRes.value.json();
            setFicha(fichaData);
          } else if (fichaRes.status === 'rejected' || !fichaRes.value.ok) {
            const error = fichaRes.status === 'rejected' ? fichaRes.reason : await fichaRes.value.json();
            throw new Error(error?.error || 'No se pudo cargar la ficha');
          }

          // Procesar historial médico
          if (historialRes.status === 'fulfilled' && historialRes.value.ok) {
            const historialData = await historialRes.value.json();
            setHistorial(historialData);
          }

          // Procesar items de vacunas (usar caché si está disponible)
          const now = Date.now();
          if (itemsVacunasCache && (now - itemsVacunasCacheTime) < CACHE_DURATION) {
            // Usar datos del caché
            setItemsVacunas(itemsVacunasCache);
          } else if (itemsRes.status === 'fulfilled' && itemsRes.value.ok) {
            // Cargar desde API y actualizar caché
            const itemsData = await itemsRes.value.json();
            const vacunasData = itemsData.filter(i => i.rubro?.toLowerCase().includes('vacun'));
            setItemsVacunas(vacunasData);
            itemsVacunasCache = vacunasData;
            itemsVacunasCacheTime = now;
          }

          // Procesar próximas vacunas
          if (proximasVacunasRes.status === 'fulfilled' && proximasVacunasRes.value.ok) {
            const proximasData = await proximasVacunasRes.value.json();
            setProximasVacunas(proximasData);
          }

        } catch (error) {
          console.error('Error cargando datos de mascota:', error);
          toast.error(error.message);
        } finally {
          setIsLoading(false);
        }
      };

      cargarDatosMascota();
    }
  }, [mascotaId]);
  
  if (isLoading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
      <p className="text-gray-600 text-lg">Cargando ficha de la mascota...</p>
      <p className="text-gray-400 text-sm mt-2">Esto puede tomar unos segundos</p>
    </div>
  );
  if (!ficha) return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
      <PawPrint className="text-gray-400 mb-4" size={48} />
      <p className="text-gray-600 text-lg">No se encontró la ficha de la mascota.</p>
    </div>
  );

  const { mascota, owner, otrasMascotas } = ficha;

  // Función para alternar el estado de una carpeta
  const alternarCarpeta = (visitaId) => {
    setCarpetasAbiertas(prev => {
      const nuevasCarpetas = new Set(prev);
      if (nuevasCarpetas.has(visitaId)) {
        nuevasCarpetas.delete(visitaId);
      } else {
        nuevasCarpetas.add(visitaId);
      }
      return nuevasCarpetas;
    });
  };

  // Función para verificar si una carpeta está abierta
  const estaCarpetaAbierta = (visitaId) => {
    return carpetasAbiertas.has(visitaId);
  };

  // Función para manejar el envío del formulario de nueva mascota
  const manejarEnvioNuevaMascota = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      
      // Agregar datos del formulario
      Object.entries(nuevaMascotaForm).forEach(([key, value]) => {
        if (key !== 'foto' && value !== null && value !== '') {
          formData.append(key, value);
        }
      });
      
      // Agregar ID del cliente
      formData.append('id_cliente', ficha?.owner?.id_clinete);
      
      // Agregar foto si existe
      if (nuevaMascotaForm.foto) {
        formData.append('foto', nuevaMascotaForm.foto);
      }
      
      const response = await fetch('/api/mascotas', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la mascota');
      }

      toast.success('Mascota agregada exitosamente');
      setIsNuevaMascotaDialogOpen(false);
      
      // Limpiar formulario
      setNuevaMascotaForm({
        nombre: '',
        especie: '',
        raza: '',
        sexo: '',
        edad: '',
        peso: '',
        estado_reproductivo: false,
        foto: null
      });
      
      // Recargar la ficha para mostrar la nueva mascota
      window.location.reload();
      
    } catch (error) {
      console.error('Error al crear mascota:', error);
      toast.error(error.message || 'Error al crear la mascota');
    }
  };

  const abrirEdicionVisita = (visita) => {
    setVisitaSeleccionada(visita);
    setVisitaForm({
      fecha: visita.fecha,
      diagnostico: visita.diagnostico,
      frecuencia_cardiaca: visita.frecuencia_cardiaca,
      frecuencia_respiratoria: visita.frecuencia_respiratoria,
      peso: visita.peso?.toString() || ficha?.mascota?.peso?.toString() || ''
    });
    setModoEdicion(true);
    setIsVisitaDialogOpen(true);
  };

  const manejarEnvioVisita = async (e) => {
    e.preventDefault();
    try {
      // Actualizar peso si cambió
      if (visitaForm.peso && ficha?.mascota?.peso?.toString() !== visitaForm.peso.toString()) {
        const mascotaActualizada = { ...ficha.mascota, peso: visitaForm.peso };
        await fetch(`/api/mascotas/${mascotaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mascotaActualizada)
        });
        
        // Refrescar también la ficha completa para asegurar sincronización
        const fichaRes = await fetch(`/api/fichas-paciente/${mascotaId}`);
        if (fichaRes.ok) {
          const nuevaFicha = await fichaRes.json();
          setFicha(nuevaFicha);
        }
      }
      
      if (modoEdicion && visitaSeleccionada) {
        // Modificar visita
        const res = await fetch(`/api/visita/${visitaSeleccionada.id_visita}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...visitaForm,
            id_mascota: mascotaId,
            id_usuario: 1
          })
        });
        if (!res.ok) throw new Error('Error al modificar la visita');
        
        // Refrescar historial inmediatamente
        const histRes = await fetch(`/api/historial-mascota/${mascotaId}`);
        if (histRes.ok) {
          const nuevoHistorial = await histRes.json();
          setHistorial(nuevoHistorial);
          
          // Actualizar la visita seleccionada con los nuevos datos
          const visitaActualizada = nuevoHistorial.find(v => v.id_visita === visitaSeleccionada.id_visita);
          if (visitaActualizada) {
            setVisitaSeleccionada(visitaActualizada);
          }
        }
        
        // Refrescar también las próximas vacunas
        const proxVacRes = await fetch(`/api/vacunas-aplicadas/proximas?id_mascota=${mascotaId}`);
        if (proxVacRes.ok) {
          const nuevasProximasVacunas = await proxVacRes.json();
          setProximasVacunas(nuevasProximasVacunas);
        }
        
        setModoEdicion(false);
        setIsVisitaDialogOpen(false);
        toast.success('Visita modificada exitosamente');
      } else {
        // Guardar visita nueva
        const res = await fetch('/api/visita', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...visitaForm,
            id_mascota: mascotaId,
            id_usuario: 1
          })
        });
        if (!res.ok) throw new Error('Error al guardar la visita');
        const visita = await res.json();
        setNuevaVisitaId(visita.id_visita);
        setIsVacunaDialogOpen(true);
        
        // Refrescar historial inmediatamente
        const histRes = await fetch(`/api/historial-mascota/${mascotaId}`);
        if (histRes.ok) setHistorial(await histRes.json());
        
        // Refrescar también las próximas vacunas
        const proxVacRes = await fetch(`/api/vacunas-aplicadas/proximas?id_mascota=${mascotaId}`);
        if (proxVacRes.ok) {
          const nuevasProximasVacunas = await proxVacRes.json();
          setProximasVacunas(nuevasProximasVacunas);
        }
        
        toast.success('Visita guardada. Ahora puedes registrar vacunas.');
      }
      
      // Limpiar formulario
      setVisitaForm({ fecha: '', diagnostico: '', frecuencia_cardiaca: '', frecuencia_respiratoria: '', peso: '' });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const manejarEliminarVisita = async () => {
    if (!visitaSeleccionada) return;
    if (!window.confirm('¿Seguro que deseas eliminar esta visita?')) return;
    try {
      const res = await fetch(`/api/visita/${visitaSeleccionada.id_visita}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar la visita');
      
      // Refrescar historial inmediatamente
      const histRes = await fetch(`/api/historial-mascota/${mascotaId}`);
      if (histRes.ok) {
        const nuevoHistorial = await histRes.json();
        setHistorial(nuevoHistorial);
      }
      
      // Refrescar también las próximas vacunas
      const proxVacRes = await fetch(`/api/vacunas-aplicadas/proximas?id_mascota=${mascotaId}`);
      if (proxVacRes.ok) {
        const nuevasProximasVacunas = await proxVacRes.json();
        setProximasVacunas(nuevasProximasVacunas);
      }
      
      setVisitaSeleccionada(null);
      setModoEdicion(false);
      setIsVisitaDialogOpen(false);
      toast.success('Visita eliminada exitosamente');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const abrirEdicionVacuna = (vac) => {
    setVacunaSeleccionada(vac);
    setVacunaForm({
      nombre_vacuna: vac.nombre_vacuna,
      fecha_aplicacion: vac.fecha_aplicacion,
      duracion_meses: vac.duracion_meses,
      observaciones: vac.observaciones,
      id_item: vac.id_item || ''
    });
    setDuracionEditable(false); // Por defecto no editable en edición
    setModoEdicionVacuna(true);
    setIsVacunaDialogOpen(true);
  };

  const manejarEnvioVacuna = async (e) => {
    e.preventDefault();
    try {
      let id_item = vacunaForm.id_item;
      if (vacunaManual && vacunaForm.nombre_vacuna) {
        const resItem = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rubro: 'Vacunaciones',
            detalle: vacunaForm.nombre_vacuna,
            prospecto: vacunaForm.observaciones || '',
            duracion: vacunaForm.duracion_meses || '12'
          })
        });
        if (!resItem.ok) throw new Error('Error al crear la vacuna en items');
        const itemCreado = await resItem.json();
        id_item = itemCreado.item.id_item;
      }
      
      if (modoEdicionVacuna && vacunaSeleccionada) {
        // Modificar vacuna
        const res = await fetch(`/api/vacunas-aplicadas/${vacunaSeleccionada.id_vacuna_aplicada}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...vacunaForm,
            id_item: id_item || null
          })
        });
        if (!res.ok) throw new Error('Error al modificar la vacuna');
        
        // Refrescar historial inmediatamente
        const histRes = await fetch(`/api/historial-mascota/${mascotaId}`);
        if (histRes.ok) {
          const nuevoHistorial = await histRes.json();
          setHistorial(nuevoHistorial);
          
          // Actualizar la vacuna seleccionada con los nuevos datos
          const vacunaActualizada = nuevoHistorial.flatMap(v => v.vacunas || []).find(vac => vac.id_vacuna_aplicada === vacunaSeleccionada.id_vacuna_aplicada);
          if (vacunaActualizada) {
            setVacunaSeleccionada(vacunaActualizada);
          }
        }
        
        // Refrescar también las próximas vacunas
        const proxVacRes = await fetch(`/api/vacunas-aplicadas/proximas?id_mascota=${mascotaId}`);
        if (proxVacRes.ok) {
          const nuevasProximasVacunas = await proxVacRes.json();
          setProximasVacunas(nuevasProximasVacunas);
        }
        
        setModoEdicionVacuna(false);
        setIsVacunaDialogOpen(false);
        toast.success('Vacuna modificada exitosamente');
      } else {
        // Nueva vacuna
        if (!nuevaVisitaId) throw new Error('No hay visita asociada');
        const res = await fetch('/api/vacunas-aplicadas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...vacunaForm,
            id_mascota: mascotaId,
            id_visita: nuevaVisitaId,
            id_item: id_item || null
          })
        });
        if (!res.ok) throw new Error('Error al guardar la vacuna');
        
        // Refrescar historial inmediatamente
        const histRes = await fetch(`/api/historial-mascota/${mascotaId}`);
        if (histRes.ok) setHistorial(await histRes.json());
        
        // Refrescar también las próximas vacunas
        const proxVacRes = await fetch(`/api/vacunas-aplicadas/proximas?id_mascota=${mascotaId}`);
        if (proxVacRes.ok) {
          const nuevasProximasVacunas = await proxVacRes.json();
          setProximasVacunas(nuevasProximasVacunas);
        }
        
        toast.success('Vacuna registrada exitosamente');
      }
      
      // Limpiar formulario
      setVacunaForm({ 
        nombre_vacuna: '', 
        fecha_aplicacion: new Date().toISOString().split('T')[0], // Fecha actual por defecto
        duracion_meses: '', 
        observaciones: '', 
        id_item: '' 
      });
      setVacunaManual(false);
      setDuracionEditable(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const manejarEliminarVacuna = async () => {
    if (!vacunaSeleccionada) return;
    if (!window.confirm('¿Seguro que deseas eliminar esta vacuna?')) return;
    try {
      const res = await fetch(`/api/vacunas-aplicadas/${vacunaSeleccionada.id_vacuna_aplicada}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar la vacuna');
      
      // Refrescar historial inmediatamente
      const histRes = await fetch(`/api/historial-mascota/${mascotaId}`);
      if (histRes.ok) {
        const nuevoHistorial = await histRes.json();
        setHistorial(nuevoHistorial);
      }
      
      // Refrescar también las próximas vacunas
      const proxVacRes = await fetch(`/api/vacunas-aplicadas/proximas?id_mascota=${mascotaId}`);
      if (proxVacRes.ok) {
        const nuevasProximasVacunas = await proxVacRes.json();
        setProximasVacunas(nuevasProximasVacunas);
      }
      
      setVacunaSeleccionada(null);
      setModoEdicionVacuna(false);
      setIsVacunaDialogOpen(false);
      toast.success('Vacuna eliminada exitosamente');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const manejarCambioArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNuevaFoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const manejarEnvioFoto = async (e) => {
    e.preventDefault();
    if (!nuevaFoto) {
      toast.error('Por favor selecciona una foto');
      return;
    }

    setIsActualizandoFoto(true);
    try {
      const mascotaActualizada = { ...ficha.mascota, foto: nuevaFoto };
      const response = await fetch(`/api/mascotas/${mascotaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mascotaActualizada)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar la foto');
      }

      // Actualizar el estado local
      setFicha(prev => ({
        ...prev,
        mascota: { ...prev.mascota, foto: nuevaFoto }
      }));

      // Refrescar también la ficha completa para asegurar sincronización
      const fichaRes = await fetch(`/api/fichas-paciente/${mascotaId}`);
      if (fichaRes.ok) {
        const nuevaFicha = await fichaRes.json();
        setFicha(nuevaFicha);
      }

      setIsFotoDialogOpen(false);
      setNuevaFoto('');
      toast.success('Foto actualizada exitosamente');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsActualizandoFoto(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="p-4 flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => {
          try {
            router.push('/');
        } catch (error) {
          console.error('Error en navegación:', error);
          router.push('/');
        }
        }}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-purple-800">Ficha de Paciente</h1>
      </header>

      <main className="flex-1 p-4 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna principal */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-purple-800 mb-4">Historial Médico de {ficha?.mascota?.nombre}</h2>
          {/* Historial real */}
          {historial.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-800 text-2xl">No hay visitas registradas para este paciente.</p>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {historial.map((visita, idx) => {
                const isAbierta = estaCarpetaAbierta(visita.id_visita);
                return (
                  <div key={`${visita.id_visita}-${visita.fecha}-${visita.diagnostico}`} className="border rounded-lg bg-gray-50 overflow-hidden">
                    {/* Header de la carpeta - siempre visible */}
                    <div 
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors ${visitaSeleccionada?.id_visita === visita.id_visita ? 'ring-2 ring-purple-400' : ''}`}
                      onClick={() => {
                        alternarCarpeta(visita.id_visita);
                        setVisitaSeleccionada(visita);
                      }}
                    >
                      <div className="flex items-center text-lg font-semibold text-purple-600">
                        {isAbierta ? (
                          <ChevronDown className="mr-2 text-purple-600" size={20} />
                        ) : (
                          <ChevronRight className="mr-2 text-purple-600" size={20} />
                        )}
                        <FolderOpen className="mr-2 text-purple-600" size={18} />
                        {visita.fecha}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Atendió:</span> {visita.nombre && visita.apellido ? `${visita.nombre} ${visita.apellido}` : 'No registrado'}
                      </div>
                    </div>
                    
                    {/* Contenido de la carpeta - solo visible si está abierta */}
                    {isAbierta && (
                      <div className="px-4 pb-4 border-t border-gray-200 bg-white">
                        {/* Diagnóstico */}
                        <div className="mb-4 pt-3">
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">Diagnóstico:</h3>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-gray-800">
                              {visita.diagnostico ? visita.diagnostico : 'Sin diagnóstico registrado'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Signos vitales */}
                        <div className="mb-4">
                          <h3 className="text-sm font-semibold text-gray-700 mb-3">Signos Vitales:</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Frecuencia Cardíaca</span>
                                <span className="text-lg font-semibold text-gray-800">
                                  {visita.frecuencia_cardiaca ? `${visita.frecuencia_cardiaca} bpm` : 'No registrada'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Frecuencia Respiratoria</span>
                                <span className="text-lg font-semibold text-gray-800">
                                  {visita.frecuencia_respiratoria ? `${visita.frecuencia_respiratoria} rpm` : 'No registrada'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Peso</span>
                                <span className="text-lg font-semibold text-gray-800">
                                  {visita.peso ? `${visita.peso} kg` : 'No registrado'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Vacunas aplicadas */}
                        {visita.vacunas && visita.vacunas.length > 0 && (
                          <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Vacunas Aplicadas:</h3>
                            <div className="space-y-2">
                              {visita.vacunas.map(vac => (
                                <div key={`${vac.id_vacuna_aplicada}-${vac.nombre_vacuna}-${vac.fecha_aplicacion}`} 
                                  className={`bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors ${vacunaSeleccionada?.id_vacuna_aplicada === vac.id_vacuna_aplicada ? 'ring-2 ring-purple-400 bg-purple-50' : ''}`}
                                  onClick={() => setVacunaSeleccionada(vac)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <Syringe className="text-purple-600 mr-2" size={16} />
                                      <div>
                                        <p className="font-medium text-gray-800">{vac.nombre_vacuna}</p>
                                        <p className="text-xs text-gray-500">
                                          {vac.fecha_aplicacion} • {vac.duracion_meses} meses
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); abrirEdicionVacuna(vac); }} className="h-7 px-2 text-xs">
                                        Editar
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); setVacunaSeleccionada(vac); manejarEliminarVacuna(); }} className="h-7 px-2 text-xs">
                                        Eliminar
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-start space-x-2 mt-4">
            <Button onClick={() => { 
              setModoEdicion(false); 
              setVisitaSeleccionada(null); 
              setVisitaForm({
                fecha: new Date().toISOString().split('T')[0],
                diagnostico: '',
                frecuencia_cardiaca: '',
                frecuencia_respiratoria: '',
                peso: ficha?.mascota?.peso?.toString() || ''
              });
              setIsVisitaDialogOpen(true); 
            }} className="bg-purple-600 hover:bg-purple-700">Nueva Visita</Button>
            <Button variant="outline" onClick={() => visitaSeleccionada && abrirEdicionVisita(visitaSeleccionada)} disabled={!visitaSeleccionada} className="border-blue-600 text-blue-600 hover:bg-blue-50">Modificar Visita</Button>
            <Button variant="destructive" onClick={manejarEliminarVisita} disabled={!visitaSeleccionada} className="bg-red-600 hover:bg-red-700">Eliminar Visita</Button>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          <InfoCard 
            title="Info del animal"
            headerAction={
              <Button size="icon" variant="ghost" onClick={() => setIsFotoDialogOpen(true)}>
                <Camera size={20} className="text-gray-500 hover:text-purple-700"/>
              </Button>
            }
          >
            <div className="flex flex-col items-center text-center p-5">
              <ImageDisplay 
                src={mascota.foto} 
                alt="Foto mascota" 
                className="w-32 h-32 rounded-full"
                showControls={false}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 ">
              <div className="space-y-2">
                <p className="text-black"><b>Especie:</b> {mascota.especie}</p>
                <p className="text-black"><b>Raza:</b> {mascota.raza}</p>
                <p className="text-black"><b>Sexo:</b> {mascota.sexo}</p>
                <p className="text-black"><b>Esterilizado/a:</b> {mascota.estado_reproductivo? 'Si' : 'No'}</p>
              </div>
              <div className="space-y-2 max-w-48">
                <p className="text-black"><b>Edad:</b> {mascota.edad} años</p>
                <p className="text-black"><b>Último peso:</b> {historial.length > 0 && historial[0].peso ? `${historial[0].peso} kg` : mascota.peso ? `${mascota.peso} kg` : 'No registrado'}</p>
                <p className="text-black"><b>Estado:</b> <span className={`font-semibold ${mascota.estado === 'Vivo' ? 'text-green-600' : 'text-red-600'}`}>{mascota.estado || 'Vivo'}</span></p>
                <p className="text-black"><b>Dueño:</b> {owner?.nombre} {owner?.apellido}</p>
              </div>
            </div>
          </InfoCard>

          <InfoCard 
            title="Otras mascotas"
            headerAction={
              <Button size="sm" variant="outline" onClick={() => setIsNuevaMascotaDialogOpen(true)} className="border-green-600 text-green-600 hover:bg-green-50">
                <PlusCircle size={16} className="mr-1" />
                Agregar
              </Button>
            }
          >
            <ul className="space-y-2">
              {otrasMascotas.map(pet => (
                  <li key={`${pet.id_mascota}-${pet.nombre}-${pet.especie}`} className="flex items-center cursor-pointer hover:text-purple-700 p-1 rounded hover:bg-gray-100" onClick={() => router.push(`/mascota/${pet.id_mascota}`)}>
                      {getPetIcon(pet.especie)} <span className="font-semibold text-black">{pet.nombre}</span> - <span className="text-gray-700 ml-1">{pet.especie}</span>
                  </li>
              ))}
            </ul>
          </InfoCard>

          <InfoCard 
            title="Próximas Vacunas"
            headerAction={
              <Button size="icon" variant="ghost" onClick={() => setIsVacunaDialogOpen(true)}>
                <PlusCircle size={20} className="text-gray-500 hover:text-purple-700"/>
              </Button>
            }
          >
            <ul className="space-y-2">
              {proximasVacunas.length === 0 && (
                <li className="text-gray-800">No hay vacunas próximas.</li>
              )}
              {proximasVacunas.map(vac => {
                const fechaProxima = new Date(vac.fecha_proxima);
                const hoy = new Date();
                const diff = Math.ceil((fechaProxima - hoy) / (1000 * 60 * 60 * 24));
                let color = 'text-gray-800';
                let aviso = '';
                if (diff < 0) { color = 'text-red-600 font-bold'; aviso = ' (¡Vencida!)'; }
                else if (diff <= 7) { color = 'text-orange-500 font-bold'; aviso = ' (¡Muy próxima!)'; }
                else if (diff <= 30) { color = 'text-yellow-600'; aviso = ' (Próxima)'; }
                return (
                  <li key={`${vac.id_vacuna_aplicada}-${vac.nombre_vacuna}-${vac.fecha_proxima}`} className="flex items-center justify-between">
                    <div><Syringe size={16} className="inline-block mr-2 text-purple-500" /> <span className="text-gray-800">{vac.nombre_vacuna}</span></div>
                    <span className={color}>{fechaProxima.toLocaleDateString()} {aviso}</span>
                  </li>
                );
              })}
            </ul>
          </InfoCard>
        </div>
      </main>

      {/* Dialogo Nueva Visita */}
      <Dialog open={isVisitaDialogOpen} onOpenChange={setIsVisitaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-purple-800">{modoEdicion ? 'Modificar Visita' : 'Añadir Nueva Visita'}</DialogTitle>
            <DialogDescription className="text-gray-600">Complete los datos de la visita médica.</DialogDescription>
          </DialogHeader>
          <form className="space-y-6" onSubmit={manejarEnvioVisita}>
            {/* Fecha */}
            <div className="text-center">
              <Label htmlFor="fecha_visita" className="text-base font-semibold text-gray-700 block mb-2">Fecha de la Visita</Label>
              <div className="flex justify-center">
                <Input 
                  id="fecha_visita" 
                  type="date" 
                  value={visitaForm.fecha} 
                  onChange={e => setVisitaForm(f => ({ ...f, fecha: e.target.value }))} 
                  required 
                  className="w-48 text-center border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Diagnóstico prominente */}
            <div className="text-center">
              <Label htmlFor="diagnostico_visita" className="text-base font-semibold text-gray-700 block mb-2">Diagnóstico</Label>
              <textarea 
                id="diagnostico_visita" 
                rows="4" 
                className="w-full max-w-2xl mx-auto border border-gray-300 rounded-md p-4 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-left" 
                value={visitaForm.diagnostico} 
                onChange={e => setVisitaForm(f => ({ ...f, diagnostico: e.target.value }))} 
                placeholder="Describa el diagnóstico de la visita..."
                required 
              />
            </div>
            
            {/* Campos médicos en tres columnas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <Label htmlFor="fc_visita" className="text-base font-semibold text-gray-700 block mb-2">Frecuencia Cardíaca</Label>
                <Input 
                  id="fc_visita" 
                  type="number" 
                  value={visitaForm.frecuencia_cardiaca} 
                  onChange={e => setVisitaForm(f => ({ ...f, frecuencia_cardiaca: e.target.value }))} 
                  required 
                  className="w-full text-center border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: 80"
                />
              </div>
              <div className="text-center">
                <Label htmlFor="fr_visita" className="text-base font-semibold text-gray-700 block mb-2">Frecuencia Respiratoria</Label>
                <Input 
                  id="fr_visita" 
                  type="number" 
                  value={visitaForm.frecuencia_respiratoria} 
                  onChange={e => setVisitaForm(f => ({ ...f, frecuencia_respiratoria: e.target.value }))} 
                  required 
                  className="w-full text-center border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: 20"
                />
              </div>
              <div className="text-center">
                <Label htmlFor="peso_visita" className="text-base font-semibold text-gray-700 block mb-2">Peso (kg)</Label>
                <Input 
                  id="peso_visita" 
                  type="number" 
                  step="0.1" 
                  value={visitaForm.peso} 
                  onChange={e => setVisitaForm(f => ({ ...f, peso: e.target.value }))} 
                  required 
                  className="w-full text-center border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: 25.5"
                />
              </div>
            </div>
            
            {/* Botones */}
            <div className="flex justify-center space-x-6 pt-6">
              <Button type="button" variant="outline" onClick={() => setIsVisitaDialogOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2">
                Cancelar
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 px-8 py-2">
                {modoEdicion ? 'Actualizar Visita' : 'Guardar Visita'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogo Nueva Vacuna */}
      <Dialog open={isVacunaDialogOpen} onOpenChange={setIsVacunaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-purple-800">Añadir Vacuna Aplicada</DialogTitle>
            <DialogDescription className="text-gray-600">Registre una vacuna aplicada en esta visita.</DialogDescription>
          </DialogHeader>
          <form className="space-y-6" onSubmit={manejarEnvioVacuna}>
            <div className="text-center">
              <Label htmlFor="nombre_vacuna" className="text-base font-semibold text-gray-700 block mb-2">Vacuna</Label>
              {!vacunaManual ? (
                <select
                  id="nombre_vacuna"
                  value={vacunaForm.id_item || ''}
                  onChange={e => {
                    if (e.target.value === 'manual') {
                      setVacunaManual(true);
                      setDuracionEditable(true);
                      setVacunaForm(f => ({ ...f, id_item: '', nombre_vacuna: '', duracion_meses: '' }));
                    } else {
                      const item = itemsVacunas.find(i => i.id_item == e.target.value);
                      setDuracionEditable(false);
                      setVacunaForm(f => ({ 
                        ...f, 
                        id_item: item?.id_item, 
                        nombre_vacuna: item?.detalle || '',
                        duracion_meses: item?.duracion || ''
                      }));
                    }
                  }}
                  required
                  className="w-full max-w-md mx-auto border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Seleccionar vacuna...</option>
                  {itemsVacunas.map(item => (
                    <option key={item.id_item} value={item.id_item}>{item.detalle}</option>
                  ))}
                  <option value="manual">Otra (agregar manualmente)</option>
                </select>
              ) : (
                <div className="flex gap-3 items-center justify-center">
                  <Input
                    id="nombre_vacuna"
                    value={vacunaForm.nombre_vacuna}
                    onChange={e => setVacunaForm(f => ({ ...f, nombre_vacuna: e.target.value }))}
                    placeholder="Nombre de la vacuna"
                    required
                    className="max-w-md border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <Button type="button" variant="outline" onClick={() => { setVacunaManual(false); setVacunaForm(f => ({ ...f, nombre_vacuna: '', id_item: '' })); }} className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2">Volver</Button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <Label htmlFor="fecha_vacuna" className="text-base font-semibold text-gray-700 block mb-2">Fecha de Aplicación</Label>
                <Input 
                  id="fecha_vacuna" 
                  type="date" 
                  value={vacunaForm.fecha_aplicacion} 
                  onChange={e => setVacunaForm(f => ({ ...f, fecha_aplicacion: e.target.value }))} 
                  required 
                  className="w-full text-center border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="text-center">
                <Label htmlFor="duracion_meses" className="text-base font-semibold text-gray-700 block mb-2">Duración (meses)</Label>
                <Input 
                  id="duracion_meses" 
                  type="number" 
                  value={vacunaForm.duracion_meses} 
                  onChange={e => setVacunaForm(f => ({ ...f, duracion_meses: e.target.value }))} 
                  required 
                  disabled={!duracionEditable}
                  className={`w-full text-center border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${!duracionEditable ? 'bg-gray-100 text-gray-500' : ''}`}
                  placeholder="Ej: 12"
                />
                <label className="flex items-center justify-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={duracionEditable}
                    onChange={e => setDuracionEditable(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-600">Modificar manualmente</span>
                </label>
                {!duracionEditable && vacunaForm.duracion_meses && (
                  <p className="text-xs text-gray-500 mt-1">Duración cargada desde la base de datos</p>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <Label htmlFor="observaciones_vacuna" className="text-base font-semibold text-gray-700 block mb-2">Observaciones</Label>
              <textarea 
                id="observaciones_vacuna" 
                rows="3" 
                className="w-full max-w-2xl mx-auto border border-gray-300 rounded-md p-3 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-left" 
                value={vacunaForm.observaciones} 
                onChange={e => setVacunaForm(f => ({ ...f, observaciones: e.target.value }))}
                placeholder="Observaciones adicionales..."
              />
            </div>
            
            <div className="flex justify-center space-x-6 pt-6">
              <Button type="button" variant="outline" onClick={() => setIsVacunaDialogOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2">
                Finalizar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 px-8 py-2">Agregar otra vacuna</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogo Cambiar Foto */}
      <Dialog open={isFotoDialogOpen} onOpenChange={setIsFotoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-purple-800">Cambiar Foto de {mascota?.nombre}</DialogTitle>
            <DialogDescription className="text-gray-600">Selecciona una nueva foto para la mascota.</DialogDescription>
          </DialogHeader>
          <form className="space-y-6" onSubmit={manejarEnvioFoto}>
            <div className="text-center">
              <Label htmlFor="foto_mascota" className="text-base font-semibold text-gray-700 block mb-2">Foto de la mascota</Label>
              <input 
                type="file" 
                id="foto_mascota"
                accept="image/*" 
                onChange={manejarCambioArchivo}
                className="w-full max-w-md mx-auto border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              {nuevaFoto && (
                <div className="mt-6 text-center">
                  <Label className="text-base font-semibold text-gray-700 block mb-3">Vista previa:</Label>
                  <div className="flex justify-center">
                    <ImageDisplay 
                      src={nuevaFoto} 
                      alt="Vista previa" 
                      className="w-32 h-32 rounded-lg border-2 border-purple-300"
                      showControls={false}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-center space-x-6 pt-6">
              <Button type="button" variant="outline" onClick={() => { setIsFotoDialogOpen(false); setNuevaFoto(''); }} className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2">
                Cancelar
              </Button>
              <Button type="submit" disabled={isActualizandoFoto || !nuevaFoto} className="bg-purple-600 hover:bg-purple-700 px-8 py-2">
                {isActualizandoFoto ? 'Actualizando...' : 'Actualizar Foto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para agregar nueva mascota */}
      <Dialog open={isNuevaMascotaDialogOpen} onOpenChange={setIsNuevaMascotaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-purple-700">Agregar Nueva Mascota</DialogTitle>
            <DialogDescription className="text-gray-600 text-center">Complete los datos de la nueva mascota para {ficha?.owner?.nombre} {ficha?.owner?.apellido}</DialogDescription>
          </DialogHeader>
          <form onSubmit={manejarEnvioNuevaMascota} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="nombre_mascota" className="text-base font-semibold text-gray-700 block mb-2">Nombre *</Label>
                <Input
                  id="nombre_mascota"
                  value={nuevaMascotaForm.nombre}
                  onChange={e => setNuevaMascotaForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre de la mascota"
                  required
                  className="w-full border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <Label htmlFor="especie_mascota" className="text-base font-semibold text-gray-700 block mb-2">Especie *</Label>
                <select
                  id="especie_mascota"
                  value={nuevaMascotaForm.especie}
                  onChange={e => setNuevaMascotaForm(f => ({ ...f, especie: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Seleccionar especie...</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Conejo">Conejo</option>
                  <option value="Ave">Ave</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <Label htmlFor="raza_mascota" className="text-base font-semibold text-gray-700 block mb-2">Raza</Label>
                <Input
                  id="raza_mascota"
                  value={nuevaMascotaForm.raza}
                  onChange={e => setNuevaMascotaForm(f => ({ ...f, raza: e.target.value }))}
                  placeholder="Raza de la mascota"
                  className="w-full border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <Label htmlFor="sexo_mascota" className="text-base font-semibold text-gray-700 block mb-2">Sexo *</Label>
                <select
                  id="sexo_mascota"
                  value={nuevaMascotaForm.sexo}
                  onChange={e => setNuevaMascotaForm(f => ({ ...f, sexo: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Seleccionar sexo...</option>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edad_mascota" className="text-base font-semibold text-gray-700 block mb-2">Edad (años)</Label>
                <Input
                  id="edad_mascota"
                  type="number"
                  value={nuevaMascotaForm.edad}
                  onChange={e => setNuevaMascotaForm(f => ({ ...f, edad: e.target.value }))}
                  placeholder="Edad en años"
                  min="0"
                  step="0.1"
                  className="w-full border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <Label htmlFor="peso_mascota" className="text-base font-semibold text-gray-700 block mb-2">Peso (kg)</Label>
                <Input
                  id="peso_mascota"
                  type="number"
                  value={nuevaMascotaForm.peso}
                  onChange={e => setNuevaMascotaForm(f => ({ ...f, peso: e.target.value }))}
                  placeholder="Peso en kg"
                  min="0"
                  step="0.1"
                  className="w-full border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Estado reproductivo */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="estado_reproductivo_mascota"
                checked={nuevaMascotaForm.estado_reproductivo}
                onChange={e => setNuevaMascotaForm(f => ({ ...f, estado_reproductivo: e.target.checked }))}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <Label htmlFor="estado_reproductivo_mascota" className="text-base font-semibold text-gray-700">
                Esterilizado/a
              </Label>
            </div>

            {/* Estado de la mascota */}
            <div>
              <Label htmlFor="estado_mascota" className="text-base font-semibold text-gray-700 block mb-2">Estado</Label>
              <select
                id="estado_mascota"
                value={nuevaMascotaForm.estado}
                onChange={e => setNuevaMascotaForm(f => ({ ...f, estado: e.target.value }))}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="Vivo">Vivo</option>
                <option value="Fallecido">Fallecido</option>
              </select>
            </div>

            {/* Foto de la mascota */}
            <div>
              <Label htmlFor="foto_mascota" className="text-base font-semibold text-gray-700 block mb-2">Foto de la mascota</Label>
              <Input
                id="foto_mascota"
                type="file"
                accept="image/*"
                onChange={e => setNuevaMascotaForm(f => ({ ...f, foto: e.target.files[0] }))}
                className="w-full border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-center space-x-6 pt-6">
              <Button type="button" variant="outline" onClick={() => setIsNuevaMascotaDialogOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2">
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 px-8 py-2">
                Agregar Mascota
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 