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


export default function Item() {
    const [item, setItem] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formularioItem, setFormularioItem] = useState({
        rubro: '',
        detalle: '',
        descripcion: '',
        prospecto: '',
        duracion: ''
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await fetch('/api/items');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al cargar items');
            }
            const data = await response.json();
            setItem(data);
        } catch (error) {
            toast.error(error.message);
            console.error('Error detallado:', error);
        } finally {
            setIsLoading(false);
        }
    }
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'duracion') {
            setFormularioItem(prev => ({
                ...prev,
                [name]: value === '' ? '0' : value.replace(/[^\d.-]/g, '')
            }));
        } else {
            setFormularioItem(prev => ({
                ...prev,
                [name]: value
            }));
        }
    }
    const resetForm = () => {
        setFormularioItem({
            rubro: '',
            detalle: '',
            descripcion: '',
            prospecto: '',
            duracion: ''
        });
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const dataToSend = {
                ...formularioItem,
                detalle: formularioItem.detalle || '0',
                descripcion: formularioItem.descripcion || '0',
                prospecto: formularioItem.prospecto || '0',
                rubro: formularioItem.rubro || '0',
                duracion: formularioItem.duracion || '0'
            };
            const url = editingId ? `/api/items/${editingId}` : '/api/items';
            const method = editingId ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error en la operación');
            }
            toast.success(editingId ? 'Item actualizado' : 'Item creado');
            await fetchItems();
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }
    const handleEdit = (item) => {
        setFormularioItem({
            rubro: item.rubro,
            detalle: item.detalle,
            descripcion: item.descripcion,
            prospecto: item.prospecto,
            duracion: item.duracion || '0'
        });
        setEditingId(item.id_item);
        setIsDialogOpen(true);
    }
    const handleDelete = async (id) => {
        try {
            const response = await fetch(`/api/items/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al eliminar el item');
            }
            toast.success('Item eliminado');
            await fetchItems();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }
    return (
    <div>
        <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Items</h1>
        <div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger>
                <Button 
                onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                }}
                >Agregar Item
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {editingId ? 'Editar item' : 'Nuevo Item'}
                    </DialogTitle>
            <DialogDescription>
                {editingId 
                ? 'Modifique los datos del item y presione guardar para actualizar.'
                : 'Complete los datos del nuevo item y presione guardar para crear.'}
            </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <div>
                        <Label htmlFor="rubro">Rubro</Label>
                        <Input 
                        id="rubro" 
                        name="rubro" 
                        value={formularioItem.rubro} 
                        onChange={handleInputChange}
                        required />
                    </div>
                    <div>
                        <Label htmlFor="detalle">Detalle</Label>
                        <Input 
                        id="detalle" 
                        name="detalle" 
                        value={formularioItem.detalle} 
                        onChange={handleInputChange}
                        required />
                    </div>
                    <div>
                        <Label htmlFor="descripcion">Descripcion</Label>
                        <Input 
                        id="descripcion" 
                        name="descripcion" 
                        value={formularioItem.descripcion} 
                        onChange={handleInputChange}
                        required />
                    </div>
                    <div>
                        <Label htmlFor="prospecto">Prospecto</Label>
                        <Input 
                        id="prospecto" 
                        name="prospecto" 
                        value={formularioItem.prospecto} 
                        onChange={handleInputChange}
                        required />
                    </div>
                    <div>
                        <Label htmlFor="duracion">Duracion</Label>
                        <Input 
                        id="duracion" 
                        name="duracion" 
                        value={formularioItem.duracion} 
                        onChange={handleInputChange}
                        required />
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
                </div>
            </form>
            
            </DialogContent>
        </Dialog>
    </div>
    <div>
        <Table>
            <TableHeader>
                    <TableRow>
                        <TableHead>Rubro</TableHead>
                        <TableHead>Detalle</TableHead>
                        <TableHead>Descripcion</TableHead>
                        <TableHead>Prospecto</TableHead>
                        <TableHead>Duracion</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {item.map((item) => (
                        <TableRow key={item.id_item}>
                            <TableCell>{item.rubro}</TableCell>
                            <TableCell>{item.detalle}</TableCell>
                            <TableCell>{item.detalle}</TableCell>
                            <TableCell>{item.prospecto}</TableCell>
                            <TableCell>{item.duracion}</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button variant="outline"
                                    size="sm" 
                                    onClick={() => handleEdit(item)}>
                                        Editar
                                    </Button>
                                    <Button variant="destructive"
                                    size="sm" 
                                    onClick={() => handleDelete(item.id_item)}>
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
    </div>
  );
}