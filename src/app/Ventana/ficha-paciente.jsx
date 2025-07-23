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
  const [visitaForm, setVisitaForm] = useState({ fecha: '', diagnostico: '', frecuencia_cardiaca: '', frecuencia_respiratoria: '', peso: '' });
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
      peso: ficha?.mascota?.peso?.toString() || ''
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
        setModoEdicion(false);
        setVisitaSeleccionada(null);
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
      }
      setIsVisitaDialogOpen(false);
      setVisitaForm({ fecha: '', diagnostico: '', frecuencia_cardiaca: '', frecuencia_respiratoria: '', peso: '' });
      // Refrescar historial
      const histRes = await fetch(`/api/historial-mascota/${mascotaId}`);
      if (histRes.ok) setHistorial(await histRes.json());
      toast.success(modoEdicion ? 'Visita modificada' : 'Visita guardada. Ahora puedes registrar vacunas.');
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
      setVisitaSeleccionada(null);
      setModoEdicion(false);
      setIsVisitaDialogOpen(false);
      // Refrescar historial
      const histRes = await fetch(`/api/historial-mascota/${mascotaId}`);
      if (histRes.ok) setHistorial(await histRes.json());
      toast.success('Visita eliminada');
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
        setModoEdicionVacuna(false);
        setVacunaSeleccionada(null);
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
      }
      setVacunaForm({ nombre_vacuna: '', fecha_aplicacion: '', duracion_meses: '', observaciones: '', id_item: '' });
      setVacunaManual(false);
      setIsVacunaDialogOpen(false);
      // Refrescar historial
      const histRes = await fetch(`/api/historial-mascota/${mascotaId}`);
      if (histRes.ok) setHistorial(await histRes.json());
      toast.success(modoEdicionVacuna ? 'Vacuna modificada' : 'Vacuna registrada');
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
      setVacunaSeleccionada(null);
      setModoEdicionVacuna(false);
      setIsVacunaDialogOpen(false);
      // Refrescar historial
      const histRes = await fetch(`/api/historial-mascota/${mascotaId}`);
      if (histRes.ok) setHistorial(await histRes.json());
      toast.success('Vacuna eliminada');
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
        <h1 className="text-2xl font-bold">Ficha de Paciente</h1>
      </header>

      <main className="flex-grow p-4 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna principal */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4 flex flex-col">
          <h2 className="text-xl font-bold text-purple-800 mb-4">Historial Médico de {ficha?.mascota?.nombre}</h2>
          {/* Historial real */}
          {historial.length === 0 ? (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-gray-400 text-2xl">No hay visitas registradas para este animal.</p>
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              {historial.map((visita, idx) => (
                <div key={visita.id_visita} className={`border rounded-lg p-3 bg-gray-50 ${visitaSeleccionada?.id_visita === visita.id_visita ? 'ring-2 ring-purple-400' : ''}`}
                  onClick={() => setVisitaSeleccionada(visita)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="flex items-center text-lg font-semibold">
                    <FolderOpen className="mr-2 text-purple-600" />
                    {visita.fecha}
                  </div>
                  <ul className="ml-8 mt-2 space-y-1 text-gray-700">
                    <li className="flex items-center"><FileText className="mr-2 text-purple-500" size={16} /> Diagnóstico: {visita.diagnostico}</li>
                    <li className="flex items-center"><FileText className="mr-2 text-purple-500" size={16} /> Frecuencia cardíaca: {visita.frecuencia_cardiaca}</li>
                    <li className="flex items-center"><FileText className="mr-2 text-purple-500" size={16} /> Frecuencia respiratoria: {visita.frecuencia_respiratoria}</li>
                    {visita.vacunas && visita.vacunas.length > 0 && (
                      <li className="flex items-center">
                        <Syringe className="mr-2 text-purple-500" size={16} />
                        <span>Vacunas aplicadas:</span>
                        <ul className="ml-4">
                          {visita.vacunas.map(vac => (
                            <li key={vac.id_vacuna_aplicada} className={`flex items-center gap-2 ${vacunaSeleccionada?.id_vacuna_aplicada === vac.id_vacuna_aplicada ? 'ring-2 ring-purple-400' : ''}`}
                              onClick={() => setVacunaSeleccionada(vac)}
                              style={{ cursor: 'pointer' }}
                            >
                              <Syringe className="mr-1 text-purple-400" size={14} />
                              {vac.nombre_vacuna} - {vac.fecha_aplicacion} ({vac.duracion_meses} meses)
                              <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); abrirEdicionVacuna(vac); }}>Editar</Button>
                              <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); setVacunaSeleccionada(vac); handleEliminarVacuna(); }}>Eliminar</Button>
                            </li>
                          ))}
                        </ul>
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-start space-x-2 mt-4">
            <Button onClick={() => { setModoEdicion(false); setVisitaSeleccionada(null); setIsVisitaDialogOpen(true); }}>Nueva Visita</Button>
            <Button variant="outline" onClick={() => visitaSeleccionada && abrirEdicionVisita(visitaSeleccionada)} disabled={!visitaSeleccionada}>Modificar Visita</Button>
            <Button variant="destructive" onClick={handleEliminarVisita} disabled={!visitaSeleccionada}>Eliminar Visita</Button>
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
                  <PawPrint size={64} className="text-gray-400" />
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
              <p><b>Especie:</b> {mascota.especie}</p>
              <p><b>Raza:</b> {mascota.raza}</p>
              <p><b>Sexo:</b> {mascota.sexo}</p>
              <p><b>Edad:</b> {mascota.edad} años</p>
              <p><b>Dueño:</b> {owner?.nombre} {owner?.apellido}</p>
            </div>
          </InfoCard>

          <InfoCard title="Otras mascotas">
            <ul className="space-y-2">
              {otrasMascotas.map(pet => (
                  <li key={pet.id_mascota} className="flex items-center cursor-pointer hover:text-purple-700 p-1 rounded hover:bg-gray-100" onClick={() => router.push(`/mascota/${pet.id_mascota}`)}>
                      {getPetIcon(pet.especie)} {pet.nombre} - <span className="text-gray-500 ml-1">{pet.especie}</span>
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
                <li className="text-gray-400">No hay vacunas próximas.</li>
              )}
              {proximasVacunas.map(vac => {
                const fechaProxima = new Date(vac.fecha_proxima);
                const hoy = new Date();
                const diff = Math.ceil((fechaProxima - hoy) / (1000 * 60 * 60 * 24));
                let color = 'text-gray-600';
                let aviso = '';
                if (diff < 0) { color = 'text-red-600 font-bold'; aviso = ' (¡Vencida!)'; }
                else if (diff <= 7) { color = 'text-orange-500 font-bold'; aviso = ' (¡Muy próxima!)'; }
                else if (diff <= 30) { color = 'text-yellow-600'; aviso = ' (Próxima)'; }
                return (
                  <li key={vac.id_vacuna_aplicada} className="flex items-center justify-between">
                    <div><Syringe size={16} className="inline-block mr-2 text-purple-500" /> {vac.nombre_vacuna}</div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Nueva Visita</DialogTitle>
            <DialogDescription>Complete los datos de la visita médica.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleVisitaSubmit}>
            <div>
              <Label htmlFor="fecha_visita">Fecha de la Visita</Label>
              <Input id="fecha_visita" type="date" value={visitaForm.fecha} onChange={e => setVisitaForm(f => ({ ...f, fecha: e.target.value }))} required />
            </div>
            <div>
              <Label htmlFor="diagnostico_visita">Diagnóstico</Label>
              <textarea id="diagnostico_visita" rows="2" className="w-full border rounded-md p-2" value={visitaForm.diagnostico} onChange={e => setVisitaForm(f => ({ ...f, diagnostico: e.target.value }))} required></textarea>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="fc_visita">Frecuencia Cardíaca</Label>
                <Input id="fc_visita" type="number" value={visitaForm.frecuencia_cardiaca} onChange={e => setVisitaForm(f => ({ ...f, frecuencia_cardiaca: e.target.value }))} required />
              </div>
              <div className="flex-1">
                <Label htmlFor="fr_visita">Frecuencia Respiratoria</Label>
                <Input id="fr_visita" type="number" value={visitaForm.frecuencia_respiratoria} onChange={e => setVisitaForm(f => ({ ...f, frecuencia_respiratoria: e.target.value }))} required />
              </div>
              <div className="flex-1">
                <Label htmlFor="peso_visita">Peso (kg)</Label>
                <Input id="peso_visita" type="number" value={visitaForm.peso} onChange={e => setVisitaForm(f => ({ ...f, peso: e.target.value }))} required />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsVisitaDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar Visita</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogo Nueva Vacuna */}
      <Dialog open={isVacunaDialogOpen} onOpenChange={setIsVacunaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Vacuna Aplicada</DialogTitle>
            <DialogDescription>Registre una vacuna aplicada en esta visita.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleVacunaSubmit}>
            <div>
              <Label htmlFor="nombre_vacuna">Vacuna</Label>
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
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Seleccionar vacuna...</option>
                  {itemsVacunas.map(item => (
                    <option key={item.id_item} value={item.id_item}>{item.detalle}</option>
                  ))}
                  <option value="manual">Otra (agregar manualmente)</option>
                </select>
              ) : (
                <div className="flex gap-2 items-center">
                  <Input
                    id="nombre_vacuna"
                    value={vacunaForm.nombre_vacuna}
                    onChange={e => setVacunaForm(f => ({ ...f, nombre_vacuna: e.target.value }))}
                    placeholder="Nombre de la vacuna"
                    required
                  />
                  <Button type="button" variant="outline" onClick={() => { setVacunaManual(false); setVacunaForm(f => ({ ...f, nombre_vacuna: '', id_item: '' })); }}>Volver</Button>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="fecha_vacuna">Fecha de Aplicación</Label>
              <Input id="fecha_vacuna" type="date" value={vacunaForm.fecha_aplicacion} onChange={e => setVacunaForm(f => ({ ...f, fecha_aplicacion: e.target.value }))} required />
            </div>
            <div>
              <Label htmlFor="duracion_meses">Duración (meses)</Label>
              <Input id="duracion_meses" type="number" value={vacunaForm.duracion_meses} onChange={e => setVacunaForm(f => ({ ...f, duracion_meses: e.target.value }))} required />
            </div>
            <div>
              <Label htmlFor="observaciones_vacuna">Observaciones</Label>
              <textarea id="observaciones_vacuna" rows="2" className="w-full border rounded-md p-2" value={vacunaForm.observaciones} onChange={e => setVacunaForm(f => ({ ...f, observaciones: e.target.value }))}></textarea>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsVacunaDialogOpen(false)}>Finalizar</Button>
              <Button type="submit">Agregar otra vacuna</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogo Cambiar Foto */}
      <Dialog open={isFotoDialogOpen} onOpenChange={setIsFotoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Foto de {mascota?.nombre}</DialogTitle>
            <DialogDescription>Selecciona una nueva foto para la mascota.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleFotoSubmit}>
            <div>
              <Label htmlFor="foto_mascota">Foto de la mascota</Label>
              <input 
                type="file" 
                id="foto_mascota"
                accept="image/*" 
                onChange={handleFileChange}
                className="w-full border rounded-md p-2"
                required
              />
              {nuevaFoto && (
                <div className="mt-2">
                  <Label>Vista previa:</Label>
                  <img src={nuevaFoto} alt="Vista previa" className="mt-2 rounded w-32 h-32 object-cover border" />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => { setIsFotoDialogOpen(false); setNuevaFoto(''); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isActualizandoFoto || !nuevaFoto}>
                {isActualizandoFoto ? 'Actualizando...' : 'Actualizar Foto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 