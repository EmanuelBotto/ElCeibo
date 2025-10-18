"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Search, Cat, Dog, PawPrint, Phone, Mail, MapPin, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AddPetDialog, getPetIcon } from '@/components/ficha-paciente';

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
  console.log('🚀 FichasClientes renderizado');
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
    telefono: '',
    email: '',
    codigo_postal: ''
  });
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [isNuevaMascotaDialogOpen, setIsNuevaMascotaDialogOpen] = useState(false);
  const router = useRouter();

  const fetchFichas = async (search) => {
    console.log('🔍 fetchFichas llamado con search:', search);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/fichas?search=${encodeURIComponent(search)}`);
      console.log('📡 Respuesta de API:', response.status, response.ok);
      if (!response.ok) throw new Error('Error al buscar fichas');
      const data = await response.json();
      console.log('📊 Datos recibidos:', data);
      setFichas(data);
    } catch (error) {
      console.error('❌ Error en fetchFichas:', error);
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
    setFormState({ 
      nombre: '', 
      apellido: '', 
      calle: '', 
      numero: '', 
      telefono: '',
      email: '',
      codigo_postal: '' 
    });
  };
  
  const handleOpenForm = (client = null) => {
    if (client) {
      setSelectedClient(client);
      setFormState({
        nombre: client.nombre || '',
        apellido: client.apellido || '',
        calle: client.calle || '',
        numero: client.numero?.toString() || '',
        telefono: client.telefono?.toString() || '',
        email: client.email || '',
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

    // Enviar todos los campos incluyendo teléfono y email
    const dataToSend = {
      nombre: formState.nombre,
      apellido: formState.apellido,
      calle: formState.calle,
      numero: formState.numero,
      telefono: formState.telefono,
      email: formState.email,
      codigo_postal: formState.codigo_postal
    };

    console.log('Datos a enviar:', dataToSend);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al guardar cliente');
      }
      toast.success(`Cliente ${selectedClient ? 'actualizado' : 'creado'} con éxito`);
      setIsFormOpen(false);
      
      // Refrescar la lista de fichas
      await fetchFichas(searchTerm);
      
      // Si estamos editando, actualizar el cliente seleccionado con los nuevos datos
      if (selectedClient) {
        const response = await fetch(`/api/clientes/${selectedClient.id_clinete}`);
        if (response.ok) {
          const updatedClient = await response.json();
          setSelectedClient(updatedClient);
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (clientId) => {
    if (!clientId) return;
    // Buscar el cliente para mostrar su nombre
    const cliente = fichas.find(c => c.id_clinete === clientId);
    setClienteAEliminar(cliente);
    setMostrarConfirmacionEliminar(true);
  };

  const ejecutarEliminacion = async () => {
    try {
      const response = await fetch(`/api/clientes/${clienteAEliminar.id_clinete}`, { method: 'DELETE' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al eliminar cliente');
      }
      toast.success('Cliente eliminado con éxito');
      setMostrarConfirmacionEliminar(false);
      setClienteAEliminar(null);
      setSelectedClient(null);
      fetchFichas(searchTerm);
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

  const handleAgregarMascota = async (mascotaData) => {
    try {
      const response = await fetch('/api/mascotas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mascotaData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear la mascota');
      }

      toast.success('Mascota agregada exitosamente');
      setIsNuevaMascotaDialogOpen(false);
      // Recargar los datos del cliente seleccionado
      if (selectedClient) {
        const updatedClient = await fetch(`/api/clientes/${selectedClient.id_clinete}`).then(res => res.json());
        setSelectedClient(updatedClient);
      }
    } catch (error) {
      console.error('Error al agregar mascota:', error);
      toast.error(error.message || 'Error al agregar la mascota');
    }
  };

  const handleNavigateToPet = (petId) => {
    router.push(`/mascota/${petId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-8 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 md:p-10 w-full max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold text-purple-800 tracking-tight mb-2">Fichas de Clientes</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleOpenForm()} className="px-6 py-2">
              Crear Cliente
            </Button>
            <Button 
              onClick={() => selectedClient && handleOpenForm(selectedClient)}
              disabled={!selectedClient}
              variant={selectedClient ? "default" : "outline"}
              className="px-6 py-2"
            >
              Modificar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleDelete(selectedClient?.id_clinete)}
              disabled={!selectedClient}
              className="px-6 py-2"
            >
              Eliminar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel izquierdo - Lista de clientes */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-full">
              <div className="bg-[#a06ba5] px-6 py-4">
                <h2 className="text-xl font-bold text-white">Lista de Clientes</h2>
              </div>
              
              <div className="p-6">
                <div className="relative mb-4">
                  <Input 
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 border-2 border-gray-300 focus:border-purple-400"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {isLoading && (
                    <div className="text-center py-4">
                      <p className="text-gray-600">Buscando...</p>
                    </div>
                  )}
                  {!isLoading && fichas.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No se encontraron clientes.</p>
                    </div>
                  )}
                  {fichas.map(ficha => (
                    <div 
                      key={ficha.id_clinete}
                      onClick={() => setSelectedClient(ficha)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedClient?.id_clinete === ficha.id_clinete 
                          ? 'bg-purple-100 border-l-4 border-purple-500' 
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="font-medium text-gray-800">
                        {ficha.nombre} {ficha.apellido}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {ficha.calle} {ficha.numero}, CP {ficha.codigo_postal}
                      </div>
                      {ficha.telefono && (
                        <div className="text-sm text-gray-500 mt-1 flex items-center">
                          <Phone className="inline-block mr-1" size={14} />
                          {ficha.telefono}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Panel derecho - Detalles del cliente */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-full">
              <div className="bg-[#a06ba5] px-6 py-4">
                <h2 className="text-xl font-bold text-white">Detalles del Cliente</h2>
              </div>
              
              <div className="p-6">
                {selectedClient ? (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-purple-800 mb-4">
                        {selectedClient.nombre} {selectedClient.apellido}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <MapPin className="mr-2 text-purple-600" size={18} />
                            <span className="font-medium">Dirección</span>
                          </div>
                          <p>{selectedClient.calle} {selectedClient.numero}, CP {selectedClient.codigo_postal}</p>
                        </div>
                        <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Phone className="mr-2 text-purple-600" size={18} />
                            <span className="font-medium">Teléfono</span>
                          </div>
                          <p>{selectedClient.telefono || 'No especificado'}</p>
                        </div>
                        <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Mail className="mr-2 text-purple-600" size={18} />
                            <span className="font-medium">Email</span>
                          </div>
                          <p>{selectedClient.email || 'No especificado'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-purple-800 flex items-center">
                          <PawPrint className="mr-2" size={20} />
                          Mascotas Registradas
                        </h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsNuevaMascotaDialogOpen(true)}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <PlusCircle size={16} className="mr-1" />
                          Agregar
                        </Button>
                      </div>
                      {selectedClient.mascotas && selectedClient.mascotas.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedClient.mascotas.map(pet => (
                            <div 
                              key={pet.id_mascota} 
                              className="border border-purple-200 rounded-lg p-4 cursor-pointer hover:bg-purple-50 transition-colors"
                              onClick={() => handleNavigateToPet(pet.id_mascota)}
                            >
                              <div className="flex items-center mb-2 text-black">
                                {getPetIcon(pet.especie)}
                                <span className="font-semibold text-gray-800">{pet.nombre}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>{pet.especie} - {pet.raza}</p>
                                {pet.deceso && (
                                  <p className="text-red-600 font-medium">Fallecida</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <PawPrint className="mx-auto text-gray-400 mb-2" size={32} />
                          <p className="text-gray-500">Este cliente no tiene mascotas registradas.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <PawPrint className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-500 text-lg">Selecciona un cliente para ver su información detallada</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogo para Crear/Editar Cliente - Usando el tema del popup de productos */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-purple-800">
              {selectedClient ? 'Modificar Cliente' : 'Crear Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedClient ? 'Actualiza los datos del cliente.' : 'Completa el formulario para crear un nuevo cliente.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campos principales */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre" className="text-gray-700 font-semibold">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="nombre" 
                  name="nombre" 
                  value={formState.nombre || ''} 
                  onChange={handleFormChange} 
                  required 
                  className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="apellido" className="text-gray-700 font-semibold">
                  Apellido <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="apellido" 
                  name="apellido" 
                  value={formState.apellido || ''} 
                  onChange={handleFormChange} 
                  required 
                  className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Dirección */}
            <div>
              <Label htmlFor="calle" className="text-gray-700 font-semibold">
                Calle <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="calle" 
                name="calle" 
                value={formState.calle || ''} 
                onChange={handleFormChange} 
                required 
                className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
              />
            </div>

            {/* Número y Teléfono */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero" className="text-gray-700 font-semibold">
                  Número <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="numero" 
                  name="numero" 
                  type="number" 
                  value={formState.numero || ''} 
                  onChange={handleFormChange} 
                  required 
                  className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="telefono" className="text-gray-700 font-semibold">
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="telefono" 
                  name="telefono" 
                  type="tel" 
                  value={formState.telefono || ''} 
                  onChange={handleFormChange} 
                  required 
                  className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Email y Código Postal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={formState.email || ''} 
                  onChange={handleFormChange} 
                  className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="codigo_postal" className="text-gray-700 font-semibold">Código Postal</Label>
                <Input 
                  id="codigo_postal" 
                  name="codigo_postal" 
                  type="number" 
                  value={formState.codigo_postal || ''} 
                  onChange={handleFormChange} 
                  className="mt-1 h-12 rounded-full border-2 border-purple-400 focus:ring-purple-500"
                />
              </div>
            </div>

            <DialogFooter className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                {selectedClient ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Popup de confirmación de eliminación */}
      <Dialog open={mostrarConfirmacionEliminar} onOpenChange={setMostrarConfirmacionEliminar}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              ¿Eliminar cliente?
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {clienteAEliminar && (
                <>
                  Estás a punto de eliminar el cliente <strong>"{clienteAEliminar.nombre} {clienteAEliminar.apellido}"</strong>.
                  <br />
                  Esta acción también eliminará todas las mascotas asociadas a este cliente.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setMostrarConfirmacionEliminar(false);
                setClienteAEliminar(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={ejecutarEliminacion}
              className="flex-1"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para agregar nueva mascota */}
      <AddPetDialog
        isOpen={isNuevaMascotaDialogOpen}
        onClose={() => setIsNuevaMascotaDialogOpen(false)}
        onSubmit={handleAgregarMascota}
        clienteId={selectedClient?.id_clinete}
      />
    </div>
  );
} 