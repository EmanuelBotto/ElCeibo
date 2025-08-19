"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { PawPrint, Syringe, FolderOpen, FileText, PlusCircle, Cat, Dog, ArrowLeft, Camera, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

const InfoCard = ({ title, children, className, headerAction }) => (
  <div className={`bg-white border border-gray-200 rounded-lg p-4 flex flex-col ${className}`}>
    <div className="flex justify-between items-center border-b border-purple-200 pb-2 mb-3">
      <h3 className="font-bold text-purple-700">{title}</h3>
      {headerAction}
    </div>
    <div className="flex-grow">
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

export default function FichaPaciente({ mascotaId }) {
  const [ficha, setFicha] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisitaDialogOpen, setIsVisitaDialogOpen] = useState(false);
  const [isVacunaDialogOpen, setIsVacunaDialogOpen] = useState(false);
  const [isFotoDialogOpen, setIsFotoDialogOpen] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [visitaForm, setVisitaForm] = useState({ 
    fecha: '', 
    diagnostico: '', 
    frecuencia_cardiaca: '', 
    frecuencia_respiratoria: '', 
    peso: '' 
  });
  const [nuevaVisitaId, setNuevaVisitaId] = useState(null);
  const [vacunaForm, setVacunaForm] = useState({ nombre_vacuna: '', fecha_aplicacion: '', duracion_meses: '', observaciones: '', id_item: '' });
  const [itemsVacunas, setItemsVacunas] = useState([]);
  const [vacunaManual, setVacunaManual] = useState(false);
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
      const fetchFicha = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/fichas-paciente/${mascotaId}`);
          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'No se pudo cargar la ficha');
          }
          const data = await response.json();
          setFicha(data);
        } catch (error) {
          toast.error(error.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchFicha();
      // Traer historial médico real
      const fetchHistorial = async () => {
        try {
          const res = await fetch(`/api/historial-mascota/${mascotaId}`);
          if (!res.ok) return;
          const data = await res.json();
          setHistorial(data);
        } catch (e) {}
      };
      fetchHistorial();
    }
    // Traer items de vacunas
    const fetchItemsVacunas = async () => {
      try {
        const res = await fetch('/api/items');
        if (!res.ok) return;
        const data = await res.json();
        setItemsVacunas(data.filter(i => i.rubro?.toLowerCase().includes('vacun')));
      } catch (e) {}
    };
    fetchItemsVacunas();
    // Traer próximas vacunas
    const fetchProximasVacunas = async () => {
      try {
        const res = await fetch(`/api/vacunas-aplicadas/proximas?id_mascota=${mascotaId}`);
        if (!res.ok) return;
        const data = await res.json();
        setProximasVacunas(data);
      } catch (e) {}
    };
    if (mascotaId) fetchProximasVacunas();
  }, [mascotaId]);
  
  if (isLoading) return <div className="flex justify-center items-center h-screen"><p>Cargando ficha...</p></div>;
  if (!ficha) return <div className="flex justify-center items-center h-screen"><p>No se encontró la ficha de la mascota.</p></div>;

  const { mascota, owner, otrasMascotas } = ficha;

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

  const handleVisitaSubmit = async (e) => {
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

  const handleEliminarVisita = async () => {
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
    setModoEdicionVacuna(true);
    setIsVacunaDialogOpen(true);
  };

  const handleVacunaSubmit = async (e) => {
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
      setVacunaForm({ nombre_vacuna: '', fecha_aplicacion: '', duracion_meses: '', observaciones: '', id_item: '' });
      setVacunaManual(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEliminarVacuna = async () => {
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNuevaFoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFotoSubmit = async (e) => {
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
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="p-4 flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-purple-800">Ficha de Paciente</h1>
      </header>

      <main className="flex-grow p-4 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna principal */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4 flex flex-col">
          <h2 className="text-xl font-bold text-purple-800 mb-4">Historial Médico de {ficha?.mascota?.nombre}</h2>
          {/* Historial real */}
          {historial.length === 0 ? (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-gray-800 text-2xl">No hay visitas registradas para este animal.</p>
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              {historial.map((visita, idx) => (
                <div key={`${visita.id_visita}-${visita.fecha}-${visita.diagnostico}`} className={`border rounded-lg p-4 bg-gray-50 ${visitaSeleccionada?.id_visita === visita.id_visita ? 'ring-2 ring-purple-400' : ''}`}
                  onClick={() => setVisitaSeleccionada(visita)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Fecha y veterinario */}
                  <div className="flex items-center justify-between text-lg font-semibold text-purple-600 mb-3">
                    <div className="flex items-center">
                      <FolderOpen className="mr-2 text-purple-600" />
                      {visita.fecha}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Atendió:</span> {visita.nombre && visita.apellido ? `${visita.nombre} ${visita.apellido}` : 'No registrado'}
                    </div>
                  </div>
                  
                  {/* Diagnóstico prominente */}
                  <div className="mb-3">
                    <div className="font-semibold text-gray-800 mb-2">Diagnóstico:</div>
                    <div className="bg-white border border-gray-300 rounded-md p-3 min-h-[60px] text-gray-800">
                      {visita.diagnostico ? visita.diagnostico : 'Sin diagnóstico registrado'}
                    </div>
                  </div>
                  
                  {/* Información médica en dos columnas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-800">
                        <FileText className="mr-2 text-purple-500" size={16} />
                        <span className="font-semibold">Frecuencia cardíaca: </span> {visita.frecuencia_cardiaca || 'No registrada'}
                      </div>
                      <div className="flex items-center text-gray-800">
                        <FileText className="mr-2 text-purple-500" size={16} />
                        <span className="font-semibold">Frecuencia respiratoria: </span> {visita.frecuencia_respiratoria || 'No registrada'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-800">
                        <FileText className="mr-2 text-purple-500" size={16} />
                        <span className="font-semibold">Peso: </span> {visita.peso ? `${visita.peso} kg` : 'No registrado'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Vacunas aplicadas */}
                  {visita.vacunas && visita.vacunas.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center mb-2">
                        <Syringe className="mr-2 text-purple-500" size={16} />
                        <span className="font-semibold text-gray-800">Vacunas aplicadas:</span>
                      </div>
                      <ul className="ml-4 space-y-1">
                        {visita.vacunas.map(vac => (
                          <li key={`${vac.id_vacuna_aplicada}-${vac.nombre_vacuna}-${vac.fecha_aplicacion}`} className={`flex items-center gap-2 ${vacunaSeleccionada?.id_vacuna_aplicada === vac.id_vacuna_aplicada ? 'ring-2 ring-purple-400' : ''}`}
                            onClick={() => setVacunaSeleccionada(vac)}
                            style={{ cursor: 'pointer' }}
                          >
                            <Syringe className="mr-1 text-purple-400" size={14} />
                            <span className="text-gray-800">{vac.nombre_vacuna} - {vac.fecha_aplicacion} ({vac.duracion_meses} meses)</span>
                            <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); abrirEdicionVacuna(vac); }} className="border-blue-600 text-blue-600 hover:bg-blue-50">Editar</Button>
                            <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); setVacunaSeleccionada(vac); handleEliminarVacuna(); }} className="bg-red-600 hover:bg-red-700">Eliminar</Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
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
            <Button variant="destructive" onClick={handleEliminarVisita} disabled={!visitaSeleccionada} className="bg-red-600 hover:bg-red-700">Eliminar Visita</Button>
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
            <div className="flex flex-col items-center text-center">
              <div className="relative w-32 h-32 bg-gray-200 rounded-full mb-4 flex items-center justify-center overflow-hidden group">
                {mascota.foto ? (
                  <img src={mascota.foto} alt="Foto mascota" className="w-full h-full object-cover" />
                ) : (
                  <PawPrint size={64} className="text-purple-600" />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/80 hover:bg-white"
                    onClick={() => setIsFotoDialogOpen(true)}
                  >
                    <Edit size={16} className="text-gray-700" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-black"><b>Especie:</b> {mascota.especie}</p>
                <p className="text-black"><b>Raza:</b> {mascota.raza}</p>
                <p className="text-black"><b>Sexo:</b> {mascota.sexo}</p>
                <p className="text-black"><b>Edad:</b> {mascota.edad} años</p>
                <p className="text-black"><b>Último peso:</b> {historial.length > 0 && historial[0].peso ? `${historial[0].peso} kg` : mascota.peso ? `${mascota.peso} kg` : 'No registrado'}</p>
                <p className="text-black"><b>Dueño:</b> {owner?.nombre} {owner?.apellido}</p>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Otras mascotas">
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
          <form className="space-y-6" onSubmit={handleVisitaSubmit}>
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
          <form className="space-y-6" onSubmit={handleVacunaSubmit}>
            <div className="text-center">
              <Label htmlFor="nombre_vacuna" className="text-base font-semibold text-gray-700 block mb-2">Vacuna</Label>
              {!vacunaManual ? (
                <select
                  id="nombre_vacuna"
                  value={vacunaForm.id_item || ''}
                  onChange={e => {
                    if (e.target.value === 'manual') {
                      setVacunaManual(true);
                      setVacunaForm(f => ({ ...f, id_item: '', nombre_vacuna: '' }));
                    } else {
                      const item = itemsVacunas.find(i => i.id_item == e.target.value);
                      setVacunaForm(f => ({ ...f, id_item: item?.id_item, nombre_vacuna: item?.detalle || '' }));
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
                  className="w-full text-center border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: 12"
                />
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
          <form className="space-y-6" onSubmit={handleFotoSubmit}>
            <div className="text-center">
              <Label htmlFor="foto_mascota" className="text-base font-semibold text-gray-700 block mb-2">Foto de la mascota</Label>
              <input 
                type="file" 
                id="foto_mascota"
                accept="image/*" 
                onChange={handleFileChange}
                className="w-full max-w-md mx-auto border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              {nuevaFoto && (
                <div className="mt-6 text-center">
                  <Label className="text-base font-semibold text-gray-700 block mb-3">Vista previa:</Label>
                  <div className="flex justify-center">
                    <img src={nuevaFoto} alt="Vista previa" className="rounded-lg w-32 h-32 object-cover border-2 border-purple-300" />
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
    </div>
  );
} 