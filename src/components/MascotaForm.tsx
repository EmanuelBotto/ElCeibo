"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUpload from './ImageUpload';
import ImageDisplay from './ImageDisplay';

interface MascotaFormData {
  nombre: string;
  especie: string;
  raza: string;
  sexo: string;
  edad: string;
  peso: string;
  foto: string;
  estado_reproductivo: string;
  dia: string;
  mes: string;
  anio: string;
  id_cliente: string;
  deceso: boolean;
  fecha_seceso: string;
}

interface MascotaFormProps {
  initialData?: Partial<MascotaFormData>;
  onSubmit: (data: MascotaFormData) => Promise<void>;
  isEditing?: boolean;
  clientes?: Array<{ id_cliente: number; nombre: string; apellido: string }>;
}

export default function MascotaForm({ 
  initialData, 
  onSubmit, 
  isEditing = false,
  clientes = []
}: MascotaFormProps) {
  const [formData, setFormData] = useState<MascotaFormData>({
    nombre: initialData?.nombre || '',
    especie: initialData?.especie || '',
    raza: initialData?.raza || '',
    sexo: initialData?.sexo || '',
    edad: initialData?.edad || '',
    peso: initialData?.peso || '',
    foto: initialData?.foto || '',
    estado_reproductivo: initialData?.estado_reproductivo || '',
    dia: initialData?.dia || '',
    mes: initialData?.mes || '',
    anio: initialData?.anio || '',
    id_cliente: initialData?.id_cliente || '',
    deceso: initialData?.deceso || false,
    fecha_seceso: initialData?.fecha_seceso || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof MascotaFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Mascota' : 'Registrar Nueva Mascota'}
        </h2>
        <p className="text-gray-600">
          {isEditing ? 'Modifica la información de la mascota' : 'Completa la información de la mascota'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              placeholder="Nombre de la mascota"
              required
            />
          </div>
          <div>
            <Label htmlFor="especie">Especie *</Label>
            <Select
              value={formData.especie}
              onValueChange={(value: string) => handleInputChange('especie', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la especie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Perro">Perro</SelectItem>
                <SelectItem value="Gato">Gato</SelectItem>
                <SelectItem value="Ave">Ave</SelectItem>
                <SelectItem value="Reptil">Reptil</SelectItem>
                <SelectItem value="Roedor">Roedor</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="raza">Raza</Label>
            <Input
              id="raza"
              value={formData.raza}
              onChange={(e) => handleInputChange('raza', e.target.value)}
              placeholder="Raza de la mascota"
            />
          </div>
          <div>
            <Label htmlFor="sexo">Sexo *</Label>
            <Select
              value={formData.sexo}
              onValueChange={(value: string) => handleInputChange('sexo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Macho">Macho</SelectItem>
                <SelectItem value="Hembra">Hembra</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edad">Edad (años) *</Label>
            <Input
              id="edad"
              type="number"
              value={formData.edad}
              onChange={(e) => handleInputChange('edad', e.target.value)}
              placeholder="0"
              min="0"
              required
            />
          </div>
          <div>
            <Label htmlFor="peso">Peso (kg) *</Label>
            <Input
              id="peso"
              type="number"
              step="0.1"
              value={formData.peso}
              onChange={(e) => handleInputChange('peso', e.target.value)}
              placeholder="0.0"
              min="0"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="estado_reproductivo">Estado Reproductivo *</Label>
            <Select
              value={formData.estado_reproductivo}
              onValueChange={(value: string) => handleInputChange('estado_reproductivo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Intacto">Intacto</SelectItem>
                <SelectItem value="Esterilizado">Esterilizado</SelectItem>
                <SelectItem value="Castrado">Castrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="id_cliente">Cliente *</Label>
            <Select
              value={formData.id_cliente.toString()}
              onValueChange={(value: string) => handleInputChange('id_cliente', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id_cliente} value={cliente.id_cliente.toString()}>
                    {cliente.nombre} {cliente.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Fecha de nacimiento */}
        <div>
          <Label>Fecha de Nacimiento *</Label>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div>
              <Label htmlFor="dia">Día</Label>
              <Input
                id="dia"
                type="number"
                value={formData.dia}
                onChange={(e) => handleInputChange('dia', e.target.value)}
                placeholder="1"
                min="1"
                max="31"
                required
              />
            </div>
            <div>
              <Label htmlFor="mes">Mes</Label>
              <Select
                value={formData.mes}
                onValueChange={(value: string) => handleInputChange('mes', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="anio">Año</Label>
              <Input
                id="anio"
                type="number"
                value={formData.anio}
                onChange={(e) => handleInputChange('anio', e.target.value)}
                placeholder="2020"
                min="1900"
                max={new Date().getFullYear()}
                required
              />
            </div>
          </div>
        </div>

        {/* Estado de deceso */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="deceso"
              checked={formData.deceso}
              onChange={(e) => handleInputChange('deceso', e.target.checked)}
              className="h-4 w-4 text-[#a06ba5] focus:ring-[#a06ba5] border-gray-300 rounded"
            />
            <Label htmlFor="deceso" className="text-sm font-medium text-gray-700">
              Marcar como fallecida
            </Label>
          </div>
          
          {formData.deceso && (
            <div>
              <Label htmlFor="fecha_seceso">Fecha de deceso *</Label>
              <Input
                id="fecha_seceso"
                type="date"
                value={formData.fecha_seceso}
                onChange={(e) => handleInputChange('fecha_seceso', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required={formData.deceso}
                className="mt-1"
              />
            </div>
          )}
        </div>

        {/* Subida de imagen */}
        <ImageUpload
          onImageChange={(base64) => handleInputChange('foto', base64)}
          currentImage={formData.foto}
          label="Foto de la Mascota"
        />

        {/* Vista previa de la imagen */}
        {formData.foto && (
          <div>
            <Label>Vista Previa</Label>
            <ImageDisplay
              src={formData.foto}
              alt="Foto de la mascota"
              className="mt-2"
            />
          </div>
        )}

        {/* Botón de envío */}
        <Button 
          type="submit" 
          className="w-full bg-[#a06ba5] hover:bg-[#8a5a8f]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Guardando...</span>
            </div>
          ) : (
            <span>{isEditing ? 'Actualizar Mascota' : 'Guardar Mascota'}</span>
          )}
        </Button>
      </form>
    </div>
  );
}
