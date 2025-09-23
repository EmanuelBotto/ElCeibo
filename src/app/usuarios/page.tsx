"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
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
  Camera,
  Upload,
  User
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
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
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    usuario: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    calle: '',
    numero: '',
    codigo_postal: '',
    tipo_usuario: 'asistente',
    contrasenia: ''
  });

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

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const url = editingUser ? `/api/usuarios/${editingUser.id_usuario}` : '/api/usuarios';
      const method = editingUser ? 'PUT' : 'POST';
      
      // Crear FormData para enviar archivos
      const formDataToSend = new FormData();
      
      // Agregar datos del formulario
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') {
          formDataToSend.append(key, value);
        }
      });
      
      // Agregar archivo si existe
      if (selectedFile) {
        formDataToSend.append('foto', selectedFile);
      }
      
      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar la solicitud');
      }

      toast.success(editingUser ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
      setShowCreateForm(false);
      setEditingUser(null);
      resetForm();
      setSelectedFile(null);
      setPreviewUrl('');
      fetchUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      usuario: user.usuario,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      telefono: user.telefono,
      calle: user.calle,
      numero: user.numero.toString(),
      codigo_postal: user.codigo_postal.toString(),
      tipo_usuario: user.tipo_usuario,
      contrasenia: ''
    });
    setPreviewUrl(user.foto || '');
    setSelectedFile(null);
    setShowCreateForm(true);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar usuario');
      }

      toast.success('Usuario eliminado exitosamente');
      fetchUsers();
    } catch (error) {
      toast.error('Error al eliminar usuario');
    }
  };

  const resetForm = () => {
    setFormData({
      usuario: '',
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      calle: '',
      numero: '',
      codigo_postal: '',
      tipo_usuario: 'asistente',
      contrasenia: ''
    });
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleBackClick = () => {
    router.push('/');
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
                  onClick={() => {
                    setShowCreateForm(true);
                    setEditingUser(null);
                    resetForm();
                  }}
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

            {/* Formulario de creación/edición */}
            {showCreateForm && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="bg-[#a06ba5] px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Edit className="h-5 w-5" />
                    <span>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</span>
                  </h2>
                </div>
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="usuario" className="text-gray-700 font-semibold">Usuario *</Label>
                        <Input
                          id="usuario"
                          name="usuario"
                          value={formData.usuario}
                          onChange={handleInputChange}
                          required
                          disabled={!!editingUser}
                          className="mt-1 h-12"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tipo_usuario" className="text-gray-700 font-semibold">Tipo de Usuario *</Label>
                        <select
                          id="tipo_usuario"
                          name="tipo_usuario"
                          value={formData.tipo_usuario}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 h-12 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        >
                          <option value="admin">Administrador</option>
                          <option value="veterinario">Veterinario</option>
                          <option value="asistente">Asistente</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="nombre" className="text-gray-700 font-semibold">Nombre *</Label>
                        <Input
                          id="nombre"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-12"
                        />
                      </div>
                      <div>
                        <Label htmlFor="apellido" className="text-gray-700 font-semibold">Apellido *</Label>
                        <Input
                          id="apellido"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-12"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-gray-700 font-semibold">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-12"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefono" className="text-gray-700 font-semibold">Teléfono</Label>
                        <Input
                          id="telefono"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleInputChange}
                          className="mt-1 h-12"
                        />
                      </div>
                      <div>
                        <Label htmlFor="calle" className="text-gray-700 font-semibold">Calle</Label>
                        <Input
                          id="calle"
                          name="calle"
                          value={formData.calle}
                          onChange={handleInputChange}
                          className="mt-1 h-12"
                        />
                      </div>
                      <div>
                        <Label htmlFor="numero" className="text-gray-700 font-semibold">Número</Label>
                        <Input
                          id="numero"
                          name="numero"
                          type="number"
                          value={formData.numero}
                          onChange={handleInputChange}
                          className="mt-1 h-12"
                        />
                      </div>
                      <div>
                        <Label htmlFor="codigo_postal" className="text-gray-700 font-semibold">Código Postal</Label>
                        <Input
                          id="codigo_postal"
                          name="codigo_postal"
                          type="number"
                          value={formData.codigo_postal}
                          onChange={handleInputChange}
                          className="mt-1 h-12"
                        />
                      </div>
                      {!editingUser && (
                        <div className="md:col-span-2">
                          <Label htmlFor="contrasenia" className="text-gray-700 font-semibold">Contraseña *</Label>
                          <Input
                            id="contrasenia"
                            name="contrasenia"
                            type="password"
                            value={formData.contrasenia}
                            onChange={handleInputChange}
                            required={!editingUser}
                            className="mt-1 h-12"
                          />
                        </div>
                      )}
                      
                      {/* Sección de foto de perfil */}
                      <div className="md:col-span-2">
                        <Label className="text-gray-700 font-semibold">Foto de Perfil</Label>
                        <div className="mt-2 flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                              {previewUrl ? (
                                <img
                                  src={previewUrl}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Camera className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                            <label
                              htmlFor="foto-upload"
                              className="absolute bottom-0 right-0 bg-purple-600 text-white rounded-full p-1 cursor-pointer hover:bg-purple-700"
                            >
                              <Upload className="h-4 w-4" />
                            </label>
                          </div>
                          <div className="flex-1">
                            <input
                              id="foto-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                            <div className="text-sm text-gray-600">
                              <p>Haz clic en el ícono para subir una foto</p>
                              <p className="text-xs">Formatos: JPG, PNG, GIF (máx. 5MB)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => {
                        setShowCreateForm(false);
                        setEditingUser(null);
                        resetForm();
                      }}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

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
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.foto ? (
                          <img
                            src={user.foto}
                            alt={`${user.nombre} ${user.apellido}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-purple-600" />
                        )}
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
                    <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      {user.id_usuario !== currentUser?.id_usuario && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user.id_usuario)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
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
                {!searchTerm && (
                  <Button
                    onClick={() => {
                      setShowCreateForm(true);
                      setEditingUser(null);
                      resetForm();
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear Usuario
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

