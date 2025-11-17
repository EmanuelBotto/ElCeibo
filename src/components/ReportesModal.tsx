"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Download, 
  AlertCircle
} from 'lucide-react';
import Modal from "@/components/ui/modal";

interface ReportesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportesModal({ isOpen, onClose }: ReportesModalProps) {
  const [tipoReporte, setTipoReporte] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const tiposReporte = [
    { id: 'ventas', label: 'Reporte de Ventas', description: 'Facturas de venta con detalles de clientes y productos (CSV)' },
    { id: 'compras', label: 'Reporte de Compras', description: 'Facturas de compra con detalles de proveedores (CSV)' },
    { id: 'productos', label: 'Reporte de Productos', description: 'Inventario completo de productos (CSV)' },
    { id: 'clientes', label: 'Reporte de Clientes', description: 'Lista completa de clientes registrados (CSV)' },
    { id: 'mascotas', label: 'Reporte de Mascotas', description: 'Registro de todas las mascotas (CSV)' }
  ];

  const handleGenerarReporte = async () => {
    if (!tipoReporte) {
      setError('Por favor selecciona un tipo de reporte');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/reportes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipoReporte,
          fechaInicio: fechaInicio || null,
          fechaFin: fechaFin || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el reporte');
      }

      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'reporte.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Limpiar el formulario
      setTipoReporte('');
      setFechaInicio('');
      setFechaFin('');
      onClose();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el reporte');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setTipoReporte('');
    setFechaInicio('');
    setFechaFin('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} contentClassName="max-w-md">
      <div className="text-gray-900">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">VENTANA DE REPORTES</h2>
        <div className="text-gray-900">

        {/* Contenido */}
        <div className="space-y-4">
          {/* Selección de tipo de reporte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Reporte
            </label>
            <div className="space-y-2">
              {tiposReporte.map((tipo) => (
                <label key={tipo.id} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoReporte"
                    value={tipo.id}
                    checked={tipoReporte === tipo.id}
                    onChange={(e) => setTipoReporte(e.target.value)}
                    className="mt-1 text-[#a06ba5] focus:ring-[#a06ba5]"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{tipo.label}</div>
                    <div className="text-xs text-gray-500">{tipo.description} (Excel)</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Fechas (solo para ventas y compras) */}
          {(tipoReporte === 'ventas' || tipoReporte === 'compras') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#a06ba5] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#a06ba5] focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isGenerating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerarReporte}
              disabled={!tipoReporte || isGenerating}
              className="flex-1 bg-[#a06ba5] hover:bg-[#8a5a8f] text-white"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Generar Reporte Excel</span>
                </div>
              )}
            </Button>
          </div>
        </div>
        </div>
      </div>
    </Modal>
  );
}
