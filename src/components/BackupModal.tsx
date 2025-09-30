'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Database, AlertCircle, CheckCircle } from 'lucide-react';
import Modal from "@/components/ui/modal";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABLAS_DISPONIBLES = [
  { 
    id: 'productos', 
    nombre: 'Productos', 
    descripcion: 'Inventario de productos y precios',
    icon: '📦'
  },
  { 
    id: 'caja', 
    nombre: 'Caja', 
    descripcion: 'Transacciones de ingresos y egresos',
    icon: '💰'
  },
  { 
    id: 'pacientes', 
    nombre: 'Pacientes', 
    descripcion: 'Fichas de mascotas y clientes',
    icon: '🐕'
  },
  { 
    id: 'usuarios', 
    nombre: 'Usuarios', 
    descripcion: 'Usuarios del sistema',
    icon: '👥'
  },
  { 
    id: 'mascotas', 
    nombre: 'Mascotas', 
    descripcion: 'Registro de mascotas',
    icon: '🐾'
  },
  { 
    id: 'facturas', 
    nombre: 'Facturas', 
    descripcion: 'Historial de ventas',
    icon: '🧾'
  }
];

export default function BackupModal({ isOpen, onClose }: BackupModalProps) {
  const [tablasSeleccionadas, setTablasSeleccionadas] = useState<string[]>([]);
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | 'info', texto: string } | null>(null);
  const [activeTab, setActiveTab] = useState('completo');

  const toggleTabla = (tablaId: string) => {
    setTablasSeleccionadas(prev => 
      prev.includes(tablaId) 
        ? prev.filter(id => id !== tablaId)
        : [...prev, tablaId]
    );
  };

  const seleccionarTodas = () => {
    setTablasSeleccionadas(TABLAS_DISPONIBLES.map(t => t.id));
  };

  const deseleccionarTodas = () => {
    setTablasSeleccionadas([]);
  };

  const generarBackup = async () => {
    if (tablasSeleccionadas.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Selecciona al menos una tabla para hacer backup' });
      return;
    }

    try {
      setGenerando(true);
      setMensaje({ tipo: 'info', texto: 'Generando backup...' });

      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tablas: tablasSeleccionadas }),
      });

      if (!response.ok) {
        throw new Error('Error al generar backup');
      }

      // Crear blob y descargar con nombre más descriptivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generar nombre de archivo más descriptivo
      const fecha = new Date().toISOString().split('T')[0];
      const hora = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const tablasStr = tablasSeleccionadas.length === TABLAS_DISPONIBLES.length 
        ? 'completo' 
        : tablasSeleccionadas.join('_');
      
      a.download = `backup_elceibo_${tablasStr}_${fecha}_${hora}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMensaje({ tipo: 'success', texto: 'Backup generado y descargado exitosamente' });
      
      // Limpiar selección después de un tiempo
      setTimeout(() => {
        setTablasSeleccionadas([]);
        setMensaje(null);
      }, 3000);

    } catch (error) {
      console.error('Error al generar backup:', error);
      setMensaje({ tipo: 'error', texto: 'Error al generar backup. Intenta nuevamente.' });
    } finally {
      setGenerando(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'completo') {
      setTablasSeleccionadas(TABLAS_DISPONIBLES.map(t => t.id));
    } else if (tab === 'personalizado') {
      setTablasSeleccionadas([]);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} contentClassName="max-w-3xl">
      <div className="text-gray-900">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">VENTANA DE BACKUP</h2>
        <div className="text-gray-900">

        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-200">
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "completo" 
                ? "text-purple-600 bg-purple-100 border-b-2 border-purple-600" 
                : "text-gray-500 hover:text-purple-600"
            }`}
            onClick={() => handleTabChange("completo")}
          >
            Backup Completo
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "personalizado" 
                ? "text-purple-600 bg-purple-100 border-b-2 border-purple-600" 
                : "text-gray-500 hover:text-purple-600"
            }`}
            onClick={() => handleTabChange("personalizado")}
          >
            Selección Personalizada
          </button>
        </div>

        {/* Contenido según la pestaña activa */}
        {activeTab === "completo" ? (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-purple-800">Backup Completo del Sistema</h3>
                  <p className="text-sm text-purple-600">
                    Se incluirán todas las tablas: Productos, Caja, Pacientes, Usuarios, Mascotas y Facturas
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Button
                onClick={generarBackup}
                disabled={generando}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
              >
                {generando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando Backup Completo...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generar Backup Completo
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-4">
              <p className="text-gray-600 mb-4">
                Selecciona las tablas que deseas incluir en el backup. Los datos se exportarán en formato Excel.
              </p>
              
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  onClick={seleccionarTodas}
                  className="text-sm"
                >
                  Seleccionar Todas
                </Button>
                <Button
                  variant="outline"
                  onClick={deseleccionarTodas}
                  className="text-sm"
                >
                  Deseleccionar Todas
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {TABLAS_DISPONIBLES.map((tabla) => (
                <div
                  key={tabla.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    tablasSeleccionadas.includes(tabla.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleTabla(tabla.id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={tablasSeleccionadas.includes(tabla.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleTabla(tabla.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-2xl">{tabla.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{tabla.nombre}</h3>
                      <p className="text-sm text-gray-600">{tabla.descripcion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                onClick={generarBackup}
                disabled={generando || tablasSeleccionadas.length === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
              >
                {generando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generar Backup
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {mensaje && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
            mensaje.tipo === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : mensaje.tipo === 'error'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {mensaje.tipo === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : mensaje.tipo === 'error' ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Database className="h-5 w-5" />
            )}
            <span className="font-medium">{mensaje.texto}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={generando}
            className="px-6 py-2"
          >
            Cancelar
          </Button>
        </div>
        </div>
      </div>
    </Modal>
  );
}
