"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Search, Cat, Dog, PawPrint, PlusCircle } from 'lucide-react';
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
  const [isNuevaMascotaDialogOpen, setIsNuevaMascotaDialogOpen] = useState(false);
  const [formState, setFormState] = useState({
    nombre: '',
    apellido: '',
    calle: '',
    numero: '',
    codigo_postal: '',
    celular: ''
  });
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
        codigo_postal: client.codigo_postal?.toString() || '',
        celular: client.celular?.toString() || ''
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
    if (!clientId) return;
    if (!confirm('¿Está seguro de que desea eliminar este cliente?')) return;

    try {
      const response = await fetch(`/api/clientes/${clientId}`, { method: 'DELETE' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al eliminar cliente');
      }
      toast.success('Cliente eliminado con éxito');
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

  const handleNavigateToPet = (petId) => {
    router.push(`/mascota/${petId}`);
  };

  // Función para manejar el envío del formulario de nueva mascota
  const handleNuevaMascotaSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que hay un cliente seleccionado
    if (!selectedClient || !selectedClient.id_clinete) {
      toast.error('Debe seleccionar un cliente primero');
      return;
    }
    
    try {
      const formData = new FormData();
      
      // Agregar datos del formulario
      Object.entries(nuevaMascotaForm).forEach(([key, value]) => {
        if (key !== 'foto' && value !== null && value !== '') {
          formData.append(key, value);
        }
      });
      
      // Agregar ID del cliente
      formData.append('id_cliente', selectedClient?.id_clinete);
      
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
        console.error('Error del servidor:', errorData);
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
      
      // Recargar la lista de fichas para mostrar la nueva mascota
      fetchFichas(searchTerm);
      
    } catch (error) {
      console.error('Error al crear mascota:', error);
      toast.error(error.message || 'Error al crear la mascota');
    }
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
                      <h3 className="text-2xl font-bold text-purple-800 mb-2">
                        {selectedClient.nombre} {selectedClient.apellido}
                      </h3>
                      <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium">
                          Dirección: {selectedClient.calle} {selectedClient.numero}, CP {selectedClient.codigo_postal}
                        </p>
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
                          Agregar Mascota
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

      {/* Dialogo para Crear/Editar Cliente */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-hidden">
          <DialogHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mb-3">
              <PawPrint className="text-white" size={24} />
            </div>
            <DialogTitle className="text-xl font-bold text-purple-800">
              {selectedClient ? 'Modificar Cliente' : 'Crear Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              {selectedClient ? 'Actualiza los datos del cliente.' : 'Completa el formulario para crear un nuevo cliente.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Información Personal */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg">
              <h3 className="text-base font-semibold text-purple-800 mb-3 flex items-center">
                <PawPrint className="mr-2" size={16} />
                Información Personal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="nombre" className="text-gray-700 font-semibold text-sm">Nombre *</Label>
                  <Input 
                    id="nombre" 
                    name="nombre" 
                    value={formState.nombre} 
                    onChange={handleFormChange} 
                    required 
                    placeholder="Ingrese el nombre"
                    className="h-10 border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="apellido" className="text-gray-700 font-semibold text-sm">Apellido *</Label>
                  <Input 
                    id="apellido" 
                    name="apellido" 
                    value={formState.apellido} 
                    onChange={handleFormChange} 
                    required 
                    placeholder="Ingrese el apellido"
                    className="h-10 border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
              <h3 className="text-base font-semibold text-blue-800 mb-3 flex items-center">
                <Search className="mr-2" size={16} />
                Información de Contacto
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="calle" className="text-gray-700 font-semibold text-sm">Calle</Label>
                  <Input 
                    id="calle" 
                    name="calle" 
                    value={formState.calle} 
                    onChange={handleFormChange} 
                    placeholder="Nombre de la calle"
                    className="h-10 border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="numero" className="text-gray-700 font-semibold text-sm">Número</Label>
                    <Input 
                      id="numero" 
                      name="numero" 
                      type="number" 
                      value={formState.numero} 
                      onChange={handleFormChange} 
                      placeholder="Número"
                      className="h-10 border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="codigo_postal" className="text-gray-700 font-semibold text-sm">Código Postal</Label>
                    <Input 
                      id="codigo_postal" 
                      name="codigo_postal" 
                      type="number" 
                      value={formState.codigo_postal} 
                      onChange={handleFormChange} 
                      placeholder="CP"
                      className="h-10 border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="celular" className="text-gray-700 font-semibold text-sm">Celular</Label>
                    <Input 
                      id="celular" 
                      name="celular" 
                      value={formState.celular} 
                      onChange={handleFormChange} 
                      placeholder="Celular"
                      className="h-10 border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormOpen(false)}
                className="h-10 px-6 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="h-10 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {selectedClient ? 'Actualizar' : 'Crear'}
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
            <DialogDescription className="text-gray-600 text-center">Complete los datos de la nueva mascota para {selectedClient?.nombre} {selectedClient?.apellido}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNuevaMascotaSubmit} className="space-y-6">
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