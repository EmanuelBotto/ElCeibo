"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Plus,
  Users,
  Shield,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  Camera,
  Upload
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
        <div className="p-8">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600">Solo los administradores pueden acceder a esta página.</p>
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
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2">Cargando usuarios...</span>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleBackClick}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Users className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-gray-600">Administra los usuarios del sistema</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setShowCreateForm(true);
              setEditingUser(null);
              resetForm();
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Barra de búsqueda */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Formulario de creación/edición */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Edit className="h-5 w-5" />
                <span>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="usuario">Usuario *</Label>
                    <Input
                      id="usuario"
                      name="usuario"
                      value={formData.usuario}
                      onChange={handleInputChange}
                      required
                      disabled={!!editingUser}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo_usuario">Tipo de Usuario *</Label>
                    <select
                      id="tipo_usuario"
                      name="tipo_usuario"
                      value={formData.tipo_usuario}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="admin">Administrador</option>
                      <option value="veterinario">Veterinario</option>
                      <option value="asistente">Asistente</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="calle">Calle</Label>
                    <Input
                      id="calle"
                      name="calle"
                      value={formData.calle}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      name="numero"
                      type="number"
                      value={formData.numero}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="codigo_postal">Código Postal</Label>
                    <Input
                      id="codigo_postal"
                      name="codigo_postal"
                      type="number"
                      value={formData.codigo_postal}
                      onChange={handleInputChange}
                    />
                  </div>
                                     {!editingUser && (
                     <div className="md:col-span-2">
                       <Label htmlFor="contrasenia">Contraseña *</Label>
                       <Input
                         id="contrasenia"
                         name="contrasenia"
                         type="password"
                         value={formData.contrasenia}
                         onChange={handleInputChange}
                         required={!editingUser}
                       />
                     </div>
                   )}
                   
                   {/* Sección de foto de perfil */}
                   <div className="md:col-span-2">
                     <Label>Foto de Perfil</Label>
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
                <div className="flex space-x-2">
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingUser(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de usuarios */}
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-4">
                     <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                       {user.foto ? (
                         <img
                           src={user.foto}
                           alt={`${user.nombre} ${user.apellido}`}
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <User className="h-6 w-6 text-purple-600" />
                       )}
                     </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {user.nombre} {user.apellido}
                      </h3>
                      <p className="text-gray-600">@{user.usuario}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {user.tipo_usuario}
                        </span>
                        {user.email && (
                          <span className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </span>
                        )}
                        {user.telefono && (
                          <span className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {user.telefono}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                                         {user.id_usuario !== currentUser?.id_usuario && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user.id_usuario)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Crea el primer usuario del sistema'}
            </p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 