'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from 'lucide-react';
import Modal from "@/components/ui/modal";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABLAS_DISPONIBLES = [
  { 
    id: 'productos', 
    nombre: 'Productos', 
    descripcion: 'Inventario de productos y precios'
  },
  { 
    id: 'caja', 
    nombre: 'Caja', 
    descripcion: 'Transacciones de ingresos y egresos'
  },
  { 
    id: 'pacientes', 
    nombre: 'Pacientes', 
    descripcion: 'Fichas de mascotas y clientes'
  },
  { 
    id: 'usuarios', 
    nombre: 'Usuarios', 
    descripcion: 'Usuarios del sistema'
  },
  { 
    id: 'mascotas', 
    nombre: 'Mascotas', 
    descripcion: 'Registro de mascotas'
  },
  { 
    id: 'facturas', 
    nombre: 'Facturas', 
    descripcion: 'Historial de ventas'
  },
  { 
    id: 'detalle_factura', 
    nombre: 'Detalle Facturas', 
    descripcion: 'Productos vendidos en cada factura'
  }
];

export default function BackupModal({ isOpen, onClose }: BackupModalProps) {
  const [tablasSeleccionadas, setTablasSeleccionadas] = useState<string[]>(TABLAS_DISPONIBLES.map(t => t.id));
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | 'info', texto: string } | null>(null);
  const [activeTab, setActiveTab] = useState('completo');
  
  // Estados para importación
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [previewData, setPreviewData] = useState<Array<Record<string, unknown>>>([]);
  const [tablaImportacion, setTablaImportacion] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Para backup completo, usar todas las tablas si no hay selección específica
    const tablasParaBackup = activeTab === 'completo' && tablasSeleccionadas.length === 0 
      ? TABLAS_DISPONIBLES.map(t => t.id)
      : tablasSeleccionadas;
    
    if (tablasParaBackup.length === 0) {
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
        body: JSON.stringify({ tablas: tablasParaBackup }),
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
      const tablasStr = tablasParaBackup.length === TABLAS_DISPONIBLES.length 
        ? 'completo' 
        : tablasParaBackup.join('_');
      
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
    setMensaje(null); // Limpiar mensajes al cambiar de pestaña
    if (tab === 'completo') {
      setTablasSeleccionadas(TABLAS_DISPONIBLES.map(t => t.id));
    } else if (tab === 'personalizado') {
      setTablasSeleccionadas([]);
    } else if (tab === 'importar') {
      // Limpiar datos de importación al cambiar a esta pestaña
      setArchivoSeleccionado(null);
      setPreviewData([]);
      setTablaImportacion('');
    }
  };

  // Funciones para importación
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if ((file && file.type.includes('sheet')) || file?.name.endsWith('.xlsx') || file?.name.endsWith('.xls')) {
      setArchivoSeleccionado(file);
      setMensaje({ tipo: 'info', texto: 'Archivo seleccionado. Ahora elige la tabla de destino.' });
    } else {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona un archivo Excel válido (.xlsx o .xls)' });
    }
  };

  const procesarArchivo = async () => {
    if (!archivoSeleccionado) {
      setMensaje({ tipo: 'error', texto: 'Selecciona un archivo para importar' });
      return;
    }

    try {
      setImportando(true);
      setMensaje({ tipo: 'info', texto: 'Procesando archivo...' });

      const formData = new FormData();
      formData.append('archivo', archivoSeleccionado);
      // Solo agregar tabla si se especificó una (si está vacío, se detecta automáticamente)
      if (tablaImportacion) {
        formData.append('tabla', tablaImportacion);
      }
      
      const response = await fetch('/api/backup/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar el archivo');
      }

      const result = await response.json();
      
      // Construir mensaje de éxito más detallado
      let mensajeExito = `Archivo procesado exitosamente. ${result.registrosInsertados} registros importados.`;
      
      if (result.resultadosPorTabla && Object.keys(result.resultadosPorTabla).length > 1) {
        const detalles = Object.entries(result.resultadosPorTabla)
          .map(([tabla, datos]) => {
            const datosTyped = datos as { registrosInsertados: number };
            return `${tabla}: ${datosTyped.registrosInsertados} registros`;
          })
          .join(', ');
        mensajeExito += ` (${detalles})`;
      }
      
      if (result.totalErrores && result.totalErrores.length > 0) {
        mensajeExito += ` Advertencia: ${result.totalErrores.length} error(es) encontrado(s).`;
      }
      
      setMensaje({ 
        tipo: 'success', 
        texto: mensajeExito
      });

      // Limpiar después del éxito
      setTimeout(() => {
        setArchivoSeleccionado(null);
        setPreviewData([]);
        setTablaImportacion('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);

    } catch (error) {
      console.error('Error al procesar archivo:', error);
      setMensaje({ 
        tipo: 'error', 
        texto: `Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
    } finally {
      setImportando(false);
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
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "importar" 
                ? "text-purple-600 bg-purple-100 border-b-2 border-purple-600" 
                : "text-gray-500 hover:text-purple-600"
            }`}
            onClick={() => handleTabChange("importar")}
          >
            Importar Datos
          </button>
        </div>

        {/* Contenido según la pestaña activa */}
        {activeTab === "completo" ? (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Backup Completo del Sistema</h3>
              <p className="text-sm text-gray-600">
                Se incluirán todas las tablas: Productos, Caja, Pacientes, Usuarios, Mascotas, Facturas y Detalle Facturas
              </p>
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
                  'Generar Backup Completo'
                )}
              </Button>
            </div>
          </div>
        ) : activeTab === "personalizado" ? (
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
                  'Generar Backup'
                )}
              </Button>
            </div>
          </div>
        ) : activeTab === "importar" ? (
          <div className="space-y-6">
            {/* Selección de archivo */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Seleccionar Archivo Excel
                </Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Seleccionar Archivo
                  </Button>
                  {archivoSeleccionado && (
                    <span className="text-sm text-gray-600">
                      {archivoSeleccionado.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Selección de tabla de destino */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tabla de Destino (Opcional)
                </Label>
                <select
                  value={tablaImportacion}
                  onChange={(e) => setTablaImportacion(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Detección automática (recomendado para backups completos)</option>
                  {TABLAS_DISPONIBLES.map((tabla) => (
                    <option key={tabla.id} value={tabla.id}>
                      {tabla.nombre} - {tabla.descripcion}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Si dejas en blanco, el sistema detectará automáticamente las tablas según el nombre de las hojas del Excel
                </p>
              </div>

              {/* Información sobre el formato */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Formato Requerido</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• El archivo debe ser un Excel (.xlsx o .xls)</li>
                  <li>• La primera fila debe contener los nombres de las columnas</li>
                  <li>• <strong>Para backups completos:</strong> Las hojas deben tener nombres como &quot;productos&quot;, &quot;usuarios&quot;, &quot;pacientes&quot;, &quot;mascotas&quot;</li>
                  <li>• <strong>Para una tabla específica:</strong> Selecciona la tabla de destino arriba</li>
                  <li>• Los nombres de columnas deben coincidir con la estructura de la tabla</li>
                  <li>• Los datos se importarán respetando las validaciones del sistema</li>
                  <li>• <strong>Tip:</strong> Puedes usar directamente un archivo exportado desde esta misma ventana de backup</li>
                </ul>
              </div>

              {/* Botón de procesar */}
              <div className="flex justify-center">
                <Button
                  onClick={procesarArchivo}
                  disabled={!archivoSeleccionado || importando}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                >
                  {importando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando Archivo...
                    </>
                  ) : (
                    'Importar Datos'
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

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
              <div className="h-5 w-5 rounded-full bg-blue-500"></div>
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
