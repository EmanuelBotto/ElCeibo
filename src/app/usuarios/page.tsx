"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useAuth } from '../../components/AuthProvider';
import { AdminOnly } from '../../components/HiddenIfNoPermission';
import { ModalConfirmacion, useModalConfirmacion } from '../../lib/modales';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Users,
  Shield,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  // Camera,
  // Upload,
  User
} from 'lucide-react';
import ImageDisplay from '@/components/ImageDisplay';
import PhotoChangeModal from '@/components/PhotoChangeModal';
import ProtectedRoute from '@/components/ProtectedRoute';
import DialogoNuevoUsuario from '@/components/DialogoNuevoUsuario';
import DialogoEditarUsuario from '@/components/DialogoEditarUsuario';
import { useRouter } from 'next/navigation';

interface User {
  id_usuario: number;
  usuario: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  calle: string;
  numero: number;
  codigo_postal: number;
  tipo_usuario: string;
  foto?: string;
  estado: boolean;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNuevoUsuarioDialogOpen, setIsNuevoUsuarioDialogOpen] = useState(false);
  const [isEditarUsuarioDialogOpen, setIsEditarUsuarioDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedUserForPhoto, setSelectedUserForPhoto] = useState<User | null>(null);
  const { user: currentUser } = useAuth();
  const router = useRouter();
  
  // Hook para el modal de confirmación
  const { isModalOpen, modalData, isLoading, showConfirmModal, closeModal, handleConfirm } = useModalConfirmacion();


  useEffect(() => {
    if (currentUser?.tipo_usuario === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

  // Verificar si el usuario actual es administrador
  if (currentUser?.tipo_usuario !== 'admin') {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50" style={{ backgroundColor: '#f9fafb' }}>
          <div className="p-8">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
              <p className="text-gray-600">Solo los administradores pueden acceder a esta página.</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/usuarios');
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      toast.error('Error al cargar usuarios');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarUsuario = async (usuarioData: any) => {
    try {
      const formDataToSend = new FormData();
      
      // Agregar datos del formulario
      Object.entries(usuarioData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          formDataToSend.append(key, value as string | Blob);
        }
      });
      
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el usuario');
      }

      toast.success('Usuario creado exitosamente');
      setIsNuevoUsuarioDialogOpen(false);
      fetchUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errorMessage);
    }
  };

  const handleEditarUsuario = async (usuarioData: any) => {
    try {
      const formDataToSend = new FormData();
      
      // Agregar datos del formulario
      Object.entries(usuarioData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          formDataToSend.append(key, value as string | Blob);
        }
      });
      
      const response = await fetch(`/api/usuarios/${usuarioData.id_usuario}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el usuario');
      }

      toast.success('Usuario actualizado exitosamente');
      setIsEditarUsuarioDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditarUsuarioDialogOpen(true);
  };

  const handleDelete = (userId: number) => {
    const user = users.find(u => u.id_usuario === userId);
    const userName = user ? `${user.nombre} ${user.apellido}` : 'este usuario';
    
    showConfirmModal({
      title: 'Confirmar Desactivación',
      message: `¿Estás seguro de que quieres desactivar a ${userName}? El usuario será desactivado pero sus datos se mantendrán en el sistema.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/usuarios/${userId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar usuario');
          }

          toast.success('Usuario desactivado exitosamente');
          fetchUsers();
        } catch (err) {
          console.error('Error al eliminar usuario:', err);
          const errorMessage = err instanceof Error ? err.message : 'Error al desactivar usuario';
          toast.error(errorMessage);
          throw err; // Re-throw para que el modal maneje el estado de loading
        }
      }
    });
  };


  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     setSelectedFile(file);
  //     const url = URL.createObjectURL(file);
  //     setPreviewUrl(url);
  //   }
  // };

  const handleBackClick = () => {
    router.push('/');
  };

  const handlePhotoChange = async (newPhoto: string) => {
    if (!selectedUserForPhoto) return;
    
    try {
      const response = await fetch(`/api/usuarios/${selectedUserForPhoto.id_usuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto: newPhoto })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar la foto');
      }

      // Actualizar la lista de usuarios
      setUsers(prev => prev.map(user => 
        user.id_usuario === selectedUserForPhoto.id_usuario 
          ? { ...user, foto: newPhoto }
          : user
      ));

      toast.success('Foto actualizada exitosamente');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar la foto';
      toast.error(errorMessage);
    }
  };

  const openPhotoModal = (user: User) => {
    setSelectedUserForPhoto(user);
    setIsPhotoModalOpen(true);
  };

  const filteredUsers = users.filter(user =>
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-700">Cargando usuarios...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50" style={{ backgroundColor: '#f9fafb' }}>
        <div className="flex flex-col items-center justify-start py-8 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-10 w-full max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleBackClick}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsNuevoUsuarioDialogOpen(true)}
                  className="px-6 py-2"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </div>
            </div>

            {/* Barra de búsqueda */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>


            {/* Lista de usuarios */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredUsers.map((user) => (
                <div key={user.id_usuario} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-[#a06ba5] px-6 py-4">
                    <h3 className="text-lg font-bold text-white">
                      {user.nombre} {user.apellido}
                    </h3>
                    <p className="text-purple-100">@{user.usuario}</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Foto de perfil */}
                      <div className="relative group">
                        <div 
                          className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer group-hover:shadow-lg transition-all duration-200"
                          onClick={() => openPhotoModal(user)}
                          title="Hacer click para cambiar la foto"
                        >
                          {user.foto && user.foto.trim() !== '' ? (
                            <ImageDisplay
                              src={user.foto}
                              alt={`${user.nombre} ${user.apellido}`}
                              className="w-full h-full rounded-full object-cover"
                              showControls={false}
                            />
                          ) : (
                            <User className="h-8 w-8 text-purple-600" />
                          )}
                        </div>
                      </div>
                      
                      {/* Información del usuario */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Shield className="text-purple-600" size={16} />
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                            {user.tipo_usuario}
                          </span>
                        </div>
                        
                        {user.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="text-purple-600" size={16} />
                            <span className="text-sm text-gray-700">{user.email}</span>
                          </div>
                        )}
                        
                        {user.telefono && (
                          <div className="flex items-center space-x-2">
                            <Phone className="text-purple-600" size={16} />
                            <span className="text-sm text-gray-700">{user.telefono}</span>
                          </div>
                        )}
                        
                        {(user.calle && user.numero) && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="text-purple-600" size={16} />
                            <span className="text-sm text-gray-700">
                              {user.calle} {user.numero}{user.codigo_postal && `, CP ${user.codigo_postal}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <AdminOnly>
                      <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        {user.id_usuario !== currentUser?.id_usuario ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(user.id_usuario)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Desactivar
                          </Button>
                        ) : (
                          <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            <Shield className="h-3 w-3 mr-1" />
                            No se puede auto-eliminar
                          </div>
                        )}
                      </div>
                    </AdminOnly>
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Crea el primer usuario del sistema'}
                </p>
                <AdminOnly>
                  {!searchTerm && (
                    <Button
                      onClick={() => {
                        setIsNuevoUsuarioDialogOpen(true);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Crear Usuario
                    </Button>
                  )}
                </AdminOnly>
              </div>
            )}
          </div>
        </div>

        {/* Modal de cambio de foto */}
        {selectedUserForPhoto && (
          <PhotoChangeModal
            isOpen={isPhotoModalOpen}
            onClose={() => {
              setIsPhotoModalOpen(false);
              setSelectedUserForPhoto(null);
            }}
            currentPhoto={selectedUserForPhoto.foto || ''}
            onPhotoChange={handlePhotoChange}
            title={`Cambiar Foto de ${selectedUserForPhoto.nombre} ${selectedUserForPhoto.apellido}`}
            description="Selecciona una nueva foto para el usuario."
            entityName={`${selectedUserForPhoto.nombre} ${selectedUserForPhoto.apellido}`}
            onSave={handlePhotoChange}
          />
        )}
        {/* Modales */}
        <DialogoNuevoUsuario
          isOpen={isNuevoUsuarioDialogOpen}
          onClose={() => setIsNuevoUsuarioDialogOpen(false)}
          onSubmit={handleAgregarUsuario}
        />

        <DialogoEditarUsuario
          isOpen={isEditarUsuarioDialogOpen}
          onClose={() => {
            setIsEditarUsuarioDialogOpen(false);
            setEditingUser(null);
          }}
          onSubmit={handleEditarUsuario}
          usuarioData={editingUser}
        />
      </div>
    </ProtectedRoute>
  );
}

