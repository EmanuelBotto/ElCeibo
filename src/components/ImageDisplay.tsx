"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ZoomIn, Download, X } from 'lucide-react';

interface ImageDisplayProps {
  src: string;
  alt: string;
  className?: string;
  showControls?: boolean;
}

export default function ImageDisplay({ 
  src, 
  alt, 
  className = "",
  showControls = true
}: ImageDisplayProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Función para limpiar y normalizar el src
  const normalizeSrc = (imageSrc: string): string => {
    if (!imageSrc) return '';
    
    // Si contiene múltiples prefijos data:image, limpiar duplicados
    // Patrón 1: con espacio entre prefijos
    if (imageSrc.includes('data:image/jpeg;base64, data:image/jpeg;base64,')) {
      const cleanSrc = imageSrc.replace('data:image/jpeg;base64, data:image/jpeg;base64,', 'data:image/jpeg;base64,');
      return cleanSrc;
    }
    
    // Patrón 2: sin espacio entre prefijos (tu caso específico)
    if (imageSrc.includes('data:image/jpeg;base64,data:image/jpeg;base64,')) {
      const cleanSrc = imageSrc.replace('data:image/jpeg;base64,data:image/jpeg;base64,', 'data:image/jpeg;base64,');
      return cleanSrc;
    }
    
    // Si ya es una data URL válida, devolverla tal como está
    if (imageSrc.startsWith('data:image/')) {
      return imageSrc;
    }
    
    // Si es solo base64 sin prefijo, agregar el prefijo
    if (!imageSrc.startsWith('data:')) {
      return `data:image/jpeg;base64,${imageSrc}`;
    }
    
    return imageSrc;
  };

  const normalizedSrc = normalizeSrc(src);

  // Reset error state when src changes
  useEffect(() => {
    setImageError(false);
  }, [src]);

  // Normalizar la fuente de la imagen

  // Si no hay src o hay error, mostrar placeholder
  if (!normalizedSrc || imageError) {
    return (
      <div className={`w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Sin imagen</span>
      </div>
    );
  }

  return (
    <>
      <div className={`relative ${className}`}>
        <img
          src={normalizedSrc}
          alt={alt}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            console.error('Error loading image:', e);
            setImageError(true);
          }}
          onLoad={() => {
            setImageError(false);
          }}
        />
        
        {/* Controles superpuestos */}
        {showControls && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-full flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowFullscreen(true)}
                className="bg-white/90 hover:bg-white text-gray-800"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = normalizedSrc;
                  link.download = `${alt}_${new Date().toISOString().split('T')[0]}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-white/90 hover:bg-white text-gray-800"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Vista fullscreen */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={normalizedSrc}
              alt={alt}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Botón cerrar */}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4"
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Botón descargar */}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const link = document.createElement('a');
                link.href = normalizedSrc;
                link.download = `${alt}_${new Date().toISOString().split('T')[0]}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="absolute top-4 left-4 bg-white/90 hover:bg-white text-gray-800"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
