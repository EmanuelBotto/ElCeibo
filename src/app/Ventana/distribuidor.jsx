"use client";

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

export default function Distribuidor() {
  const [distribuidores, setDistribuidores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formularioDistribuidor, setFormularioDistribuidor] = useState({
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
  const [editingId, setEditingId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchDistribuidores();
  }, []);

  const fetchDistribuidores = async () => {
    try {
      const response = await fetch('/api/distribuidores');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar distribuidores');
      }
      const data = await response.json();
      setDistribuidores(data);
    } catch (error) {
      toast.error(error.message);
      console.error('Error detallado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (['numero', 'codigo_postal', 'cbu'].includes(name)) {
      setFormularioDistribuidor(prev => ({
        ...prev,
        [name]: value === '' ? '' : value.replace(/\D/g, '')
      }));
    } else if (name === 'deuda') {
      setFormularioDistribuidor(prev => ({
        ...prev,
        [name]: value === '' ? '0' : value.replace(/[^\d.-]/g, '')
      }));
    } else {
      setFormularioDistribuidor(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const resetForm = () => {
    setFormularioDistribuidor({
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
      deuda: 0
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSend = {
        ...formularioDistribuidor,
        numero: formularioDistribuidor.numero || '0',
        codigo_postal: formularioDistribuidor.codigo_postal || '0',
        cbu: formularioDistribuidor.cbu || '0',
        deuda: formularioDistribuidor.deuda || '0'
      };

      const url = editingId 
        ? `/api/distribuidores/${editingId}`
        : '/api/distribuidores';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en la operación');
      }

      toast.success(editingId ? 'Distribuidor actualizado' : 'Distribuidor creado');
      await fetchDistribuidores();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.message);
      console.error('Error detallado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (distribuidor) => {
    setFormularioDistribuidor({
      cuit: distribuidor.cuit,
      nombre: distribuidor.nombre,
      telefono: distribuidor.telefono || '',
      email: distribuidor.email,
      nombre_fantasia: distribuidor.nombre_fantasia || '',
      calle: distribuidor.calle || '',
      numero: distribuidor.numero?.toString() || '',
      codigo_postal: distribuidor.codigo_postal?.toString() || '',
      cbu: distribuidor.cbu?.toString() || '',
      alias: distribuidor.alias || '',
      deuda: distribuidor.deuda?.toString() || '0'
    });
    setEditingId(distribuidor.id_distribuidor);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de que desea eliminar este distribuidor?')) return;

    try {
      const response = await fetch(`/api/distribuidores/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      toast.success('Distribuidor eliminado');
      await fetchDistribuidores();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Distribuidores</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              Nuevo Distribuidor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Distribuidor' : 'Nuevo Distribuidor'}
              </DialogTitle>
              <DialogDescription>
                {editingId 
                  ? 'Modifique los datos del distribuidor y presione guardar para actualizar.'
                  : 'Complete los datos del nuevo distribuidor y presione guardar para crear.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cuit">CUIT *</Label>
                  <Input
                    id="cuit"
                    name="cuit"
                    value={formularioDistribuidor.cuit}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formularioDistribuidor.nombre}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formularioDistribuidor.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formularioDistribuidor.telefono}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre_fantasia">Nombre Fantasía</Label>
                  <Input
                    id="nombre_fantasia"
                    name="nombre_fantasia"
                    value={formularioDistribuidor.nombre_fantasia}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calle">Calle</Label>
                  <Input
                    id="calle"
                    name="calle"
                    value={formularioDistribuidor.calle}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    name="numero"
                    type="number"
                    value={formularioDistribuidor.numero}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo_postal">Código Postal</Label>
                  <Input
                    id="codigo_postal"
                    name="codigo_postal"
                    type="number"
                    value={formularioDistribuidor.codigo_postal}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cbu">CBU</Label>
                  <Input
                    id="cbu"
                    name="cbu"
                    type="number"
                    value={formularioDistribuidor.cbu}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alias">Alias</Label>
                  <Input
                    id="alias"
                    name="alias"
                    value={formularioDistribuidor.alias}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deuda">Deuda</Label>
                  <Input
                    id="deuda"
                    name="deuda"
                    type="number"
                    step="0.01"
                    value={formularioDistribuidor.deuda}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CUIT</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Nombre Fantasía</TableHead>
              <TableHead>Deuda</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {distribuidores.map((distribuidor) => (
              <TableRow key={distribuidor.id_distribuidor}>
                <TableCell>{distribuidor.cuit}</TableCell>
                <TableCell>{distribuidor.nombre}</TableCell>
                <TableCell>{distribuidor.email}</TableCell>
                <TableCell>{distribuidor.telefono}</TableCell>
                <TableCell>{distribuidor.nombre_fantasia}</TableCell>
                <TableCell>${Number(distribuidor.deuda)?.toFixed(2)}</TableCell>
                <TableCell>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(distribuidor)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(distribuidor.id_distribuidor)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 