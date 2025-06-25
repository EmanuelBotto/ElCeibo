"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Search, Cat, Dog, PawPrint } from 'lucide-react'; // Asumiendo que usas lucide-react para iconos
import { useRouter } from 'next/navigation';

// Función debounce para retrasar la ejecución de la búsqueda
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

export default function FichasClientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [fichas, setFichas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState({
    nombre: '',
    apellido: '',
    calle: '',
    numero: '',
    codigo_postal: ''
  });
  const router = useRouter();

  const fetchFichas = async (search) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/fichas?search=${encodeURIComponent(search)}`);
      if (!response.ok) throw new Error('Error al buscar fichas');
      const data = await response.json();
      setFichas(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useCallback(debounce(fetchFichas, 500), []);

  useEffect(() => {
    debouncedFetch(searchTerm);
  }, [searchTerm, debouncedFetch]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setSelectedClient(null);
    setFormState({ nombre: '', apellido: '', calle: '', numero: '', codigo_postal: '' });
  };
  
  const handleOpenForm = (client = null) => {
    if (client) {
      setSelectedClient(client);
      setFormState({
        nombre: client.nombre || '',
        apellido: client.apellido || '',
        calle: client.calle || '',
        numero: client.numero?.toString() || '',
        codigo_postal: client.codigo_postal?.toString() || ''
      });
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = selectedClient ? `/api/clientes/${selectedClient.id_clinete}` : '/api/clientes';
    const method = selectedClient ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al guardar cliente');
      }
      toast.success(`Cliente ${selectedClient ? 'actualizado' : 'creado'} con éxito`);
      setIsFormOpen(false);
      fetchFichas(searchTerm); // Refresh list
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  const handleDelete = async (clientId) => {
    if (!clientId) {
        toast.error("Por favor, seleccione un cliente para eliminar.");
        return;
    }

    if (!confirm('¿Seguro que quieres eliminar este cliente y todas sus mascotas? Esta acción es irreversible.')) return;
    try {
      const response = await fetch(`/api/clientes/${clientId}`, { method: 'DELETE' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al eliminar cliente');
      }
      toast.success('Cliente eliminado con éxito');
      fetchFichas(searchTerm); // Refresh
      setSelectedClient(null); // Deselect
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  const getPetIcon = (especie) => {
    switch (especie?.toLowerCase()) {
      case 'gato': return <Cat className="inline-block mr-2" size={18} />;
      case 'perro': return <Dog className="inline-block mr-2" size={18} />;
      default: return <PawPrint className="inline-block mr-2" size={18} />;
    }
  };

  const handleNavigateToPet = (petId) => {
    router.push(`/mascota/${petId}`);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Panel izquierdo */}
      <div className="w-1/3 p-4 flex flex-col space-y-4">
        <div className="relative">
          <Input 
            placeholder="Buscador de cliente"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => handleOpenForm()}>Crear</Button>
          <Button 
            onClick={() => selectedClient && handleOpenForm(selectedClient)}
            disabled={!selectedClient}
          >
            Modificar
          </Button>
          <Button 
            variant="destructive"
            onClick={() => handleDelete(selectedClient?.id_clinete)}
            disabled={!selectedClient}
          >
            Eliminar
          </Button>
        </div>
        <div className="flex-grow border rounded-lg bg-white p-2">
          <h2 className="text-lg font-semibold mb-2">Resultados</h2>
          {isLoading && <p>Buscando...</p>}
          {!isLoading && fichas.length === 0 && <p className="text-gray-500">No se encontraron clientes.</p>}
          <ul className="space-y-1">
            {fichas.map(ficha => (
              <li 
                key={ficha.id_clinete}
                onClick={() => setSelectedClient(ficha)}
                className={`p-2 rounded cursor-pointer ${selectedClient?.id_clinete === ficha.id_clinete ? 'bg-purple-200' : 'hover:bg-gray-200'}`}
              >
                {ficha.nombre} {ficha.apellido}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="w-2/3 p-4">
        <div className="h-full border rounded-lg bg-white p-4">
          <h1 className="text-xl font-bold mb-4 border-b pb-2">Fichas Clientes</h1>
          {selectedClient ? (
            <div>
              <h2 className="text-2xl font-semibold text-purple-700">{selectedClient.nombre} {selectedClient.apellido}</h2>
              <div className="text-sm text-gray-600">
                <p>{selectedClient.calle} {selectedClient.numero}, CP {selectedClient.codigo_postal}</p>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Mascotas:</h3>
                {selectedClient.mascotas && selectedClient.mascotas.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedClient.mascotas.map(pet => (
                      <li 
                        key={pet.id_mascota} 
                        className="border-l-4 border-purple-500 pl-3 py-1 cursor-pointer hover:bg-gray-200"
                        onClick={() => handleNavigateToPet(pet.id_mascota)}
                      >
                        {getPetIcon(pet.especie)}
                        <span className="font-medium">{pet.nombre}</span> ({pet.especie} - {pet.raza})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Este cliente no tiene mascotas registradas.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-lg">Seleccione un cliente para ver su ficha.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogo para Crear/Editar Cliente */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{selectedClient ? 'Modificar Cliente' : 'Crear Nuevo Cliente'}</DialogTitle>
            <DialogDescription>
              {selectedClient ? 'Actualice los datos del cliente.' : 'Complete el formulario para crear un nuevo cliente.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" value={formState.nombre} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" name="apellido" value={formState.apellido} onChange={handleFormChange} required />
              </div>
            </div>
            <div>
              <Label htmlFor="calle">Calle</Label>
              <Input id="calle" name="calle" value={formState.calle} onChange={handleFormChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" name="numero" type="number" value={formState.numero} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="codigo_postal">Código Postal</Label>
                <Input id="codigo_postal" name="codigo_postal" type="number" value={formState.codigo_postal} onChange={handleFormChange} required />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 