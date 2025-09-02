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

export default function Mascota() {
  const [mascotas, setMascotas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formularioMascota, setFormularioMascota] = useState({
    nombre: '',
    especie: '',
    raza: '',
    sexo: '',
    edad: '',
    peso: '',
    foto: '',
    estado_reproductivo: false,
    dia: '',
    mes: '',
    anio: '',
    id_cliente: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchMascotas();
  }, []);

  const fetchMascotas = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/mascotas');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar mascotas');
      }
      const data = await response.json();
      setMascotas(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormularioMascota(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormularioMascota(prev => ({ ...prev, foto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormularioMascota({
      nombre: '',
      especie: '',
      raza: '',
      sexo: '',
      edad: '',
      peso: '',
      foto: '',
      estado_reproductivo: false,
      dia: '',
      mes: '',
      anio: '',
      id_cliente: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingId 
        ? `/api/mascotas/${editingId}`
        : '/api/mascotas';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formularioMascota),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en la operación');
      }

      toast.success(editingId ? 'Mascota actualizada' : 'Mascota creada');
      await fetchMascotas();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (mascota) => {
    setFormularioMascota({
      nombre: mascota.nombre || '',
      especie: mascota.especie || '',
      raza: mascota.raza || '',
      sexo: mascota.sexo || '',
      edad: mascota.edad?.toString() || '',
      peso: mascota.peso?.toString() || '',
      foto: mascota.foto || '',
      estado_reproductivo: mascota.estado_reproductivo || false,
      dia: mascota.dia?.toString() || '',
      mes: mascota.mes || '',
      anio: mascota.anio?.toString() || '',
      id_cliente: mascota.id_cliente?.toString() || ''
    });
    setEditingId(mascota.id_mascota);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de que desea eliminar esta mascota?')) return;

    try {
      const response = await fetch(`/api/mascotas/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      toast.success('Mascota eliminada');
      await fetchMascotas();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Mascotas</h1>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
          if (!isOpen) resetForm();
          setIsDialogOpen(isOpen);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>Nueva Mascota</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Mascota' : 'Nueva Mascota'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Modifique los datos y guarde los cambios.' : 'Complete el formulario para añadir una nueva mascota.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <Input name="nombre" value={formularioMascota.nombre} onChange={handleInputChange} placeholder="Nombre" required />
              <Input name="especie" value={formularioMascota.especie} onChange={handleInputChange} placeholder="Especie" required />
              <Input name="raza" value={formularioMascota.raza} onChange={handleInputChange} placeholder="Raza" required />
              <Input name="sexo" value={formularioMascota.sexo} onChange={handleInputChange} placeholder="Sexo" required />
              <Input name="edad" type="number" value={formularioMascota.edad} onChange={handleInputChange} placeholder="Edad" required />
              <Input name="peso" type="number" value={formularioMascota.peso} onChange={handleInputChange} placeholder="Peso (kg)" required />
              <div>
                <Label>Foto de la mascota</Label>
                <input type="file" accept="image/*" onChange={handleFileChange} />
                {formularioMascota.foto && (
                  <img src={formularioMascota.foto} alt="Vista previa" className="mt-2 rounded w-32 h-32 object-cover border" />
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="estado_reproductivo" name="estado_reproductivo" checked={formularioMascota.estado_reproductivo} onChange={handleInputChange} />
                <Label htmlFor="estado_reproductivo">Estado Reproductivo</Label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input name="dia" type="number" value={formularioMascota.dia} onChange={handleInputChange} placeholder="Día" required />
                <Input name="mes" value={formularioMascota.mes} onChange={handleInputChange} placeholder="Mes" required />
                <Input name="anio" type="number" value={formularioMascota.anio} onChange={handleInputChange} placeholder="Año" required />
              </div>
              <Input name="id_cliente" type="number" value={formularioMascota.id_cliente} onChange={handleInputChange} placeholder="ID Cliente" required />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/*
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Especie</TableHead>
              <TableHead>Raza</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan="6" className="text-center">Cargando...</TableCell></TableRow>
            ) : mascotas.map((mascota) => (
              <TableRow key={mascota.id_mascota}>
                <TableCell>{mascota.nombre}</TableCell>
                <TableCell>{mascota.especie}</TableCell>
                <TableCell>{mascota.raza}</TableCell>
                <TableCell>{mascota.edad}</TableCell>
                <TableCell>{mascota.peso}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(mascota)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(mascota.id_mascota)}>Eliminar</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>*/}
    </div>
  );
} 