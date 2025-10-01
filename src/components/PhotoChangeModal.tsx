"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, X } from 'lucide-react';
import ImageDisplay from './ImageDisplay';
import { toast } from 'sonner';

interface PhotoChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhoto: string;
  onPhotoChange: (newPhoto: string) => void;
  title: string;
  description: string;
  entityName: string;
  onSave: (newPhoto: string) => Promise<void>;
}

export default function PhotoChangeModal({
  isOpen,
  onClose,
  currentPhoto,
  onPhotoChange,
  title,
  description,
  entityName,
  onSave
}: PhotoChangeModalProps) {
  const [nuevaFoto, setNuevaFoto] = useState('');
  const [isActualizando, setIsActualizando] = useState(false);

  const manejarCambioArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño del archivo (10MB máximo)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 10MB.');
        return;
      }
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setNuevaFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const manejarDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const manejarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // Simular el input file
        const input = document.getElementById('foto_input');
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        
        // Disparar el evento change
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      } else {
        toast.error('Por favor arrastra un archivo de imagen válido.');
      }
    }
  };

  const manejarEnvioFoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaFoto) {
      toast.error('Por favor selecciona una foto');
      return;
    }

    setIsActualizando(true);
    try {
      await onSave(nuevaFoto);
      onPhotoChange(nuevaFoto);
      setNuevaFoto('');
      onClose();
      toast.success('Foto actualizada exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar la foto');
    } finally {
      setIsActualizando(false);
    }
  };

  const handleClose = () => {
    setNuevaFoto('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-purple-800 flex items-center justify-center">
            <Camera className="mr-2" size={24} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600">{description}</DialogDescription>
        </DialogHeader>
        
        <form className="space-y-6" onSubmit={manejarEnvioFoto}>
          {/* Área de subida de archivo */}
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 cursor-pointer"
              onClick={() => document.getElementById('foto_input')?.click()}
              onDragOver={manejarDragOver}
              onDrop={manejarDrop}
            >
              <input 
                type="file" 
                id="foto_input"
                accept="image/*" 
                onChange={manejarCambioArchivo}
                className="hidden"
                required
              />
              <div className="space-y-3">
                <Camera className="mx-auto text-gray-400" size={48} />
                <div>
                  <p className="text-lg font-medium text-gray-700">Hacer click para seleccionar foto</p>
                  <p className="text-sm text-gray-500">o arrastra una imagen aquí</p>
                </div>
                <p className="text-xs text-gray-400">PNG, JPG, GIF hasta 10MB</p>
              </div>
            </div>
            
            {/* Vista previa */}
            {nuevaFoto && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-center">
                  <ImageDisplay 
                    src={nuevaFoto} 
                    alt="Vista previa" 
                    className="w-40 h-40 rounded-lg border-2 border-purple-300 shadow-md"
                    showControls={false}
                  />
                </div>
                <div className="mt-3 text-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setNuevaFoto('');
                      const input = document.getElementById('foto_input') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Cambiar foto
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Botones */}
          <div className="flex justify-center space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isActualizando}
              className="px-6"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={!nuevaFoto || isActualizando}
              className="px-6 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isActualizando ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Actualizando...</span>
                </div>
              ) : (
                'Actualizar Foto'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
