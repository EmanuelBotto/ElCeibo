# 📸 Sistema de Imágenes para El Ceibo

## 🎯 Descripción

Sistema completo para manejar imágenes de usuarios y mascotas en la aplicación El Ceibo, utilizando almacenamiento BYTEA en PostgreSQL (Neon).

## 🏗️ Arquitectura

### **Base de Datos**
- **Campo `foto`**: Tipo `BYTEA` para almacenar imágenes como datos binarios
- **Conversión**: Base64 ↔ Buffer ↔ BYTEA
- **Límite**: Máximo 5MB por imagen

### **Frontend**
- **Componentes**: `ImageUpload`, `ImageDisplay`, `UserForm`, `MascotaForm`
- **Formato**: Base64 para visualización y envío
- **Funcionalidades**: Drag & Drop, vista previa, zoom, descarga

### **Backend**
- **APIs**: `/api/usuarios`, `/api/mascotas`
- **Conversión**: Base64 → Buffer → BYTEA (almacenamiento)
- **Retorno**: BYTEA → Buffer → Base64 (visualización)

## 🚀 Componentes Disponibles

### 1. **ImageUpload.tsx**
```tsx
import ImageUpload from '@/components/ImageUpload';

<ImageUpload
  onImageChange={(base64) => setFoto(base64)}
  currentImage={foto}
  label="Foto del Usuario"
/>
```

**Características:**
- ✅ Drag & Drop
- ✅ Selección de archivo
- ✅ Vista previa
- ✅ Validación de tipo de archivo
- ✅ Botón de eliminación

### 2. **ImageDisplay.tsx**
```tsx
import ImageDisplay from '@/components/ImageDisplay';

<ImageDisplay
  src={usuario.foto}
  alt={usuario.nombre}
  className="w-full"
  showControls={true}
  maxHeight="h-48"
/>
```

**Características:**
- ✅ Zoom al hover
- ✅ Vista fullscreen
- ✅ Botón de descarga
- ✅ Controles superpuestos
- ✅ Manejo de imágenes faltantes

### 3. **UserForm.tsx**
```tsx
import UserForm from '@/components/UserForm';

<UserForm
  onSubmit={handleSubmit}
  isEditing={false}
/>
```

**Campos:**
- Nombre, Apellido, Email, Teléfono, Dirección
- Tipo de Usuario (Admin, Veterinario, Asistente, Recepcionista)
- Contraseña
- Foto del Usuario

### 4. **MascotaForm.tsx**
```tsx
import MascotaForm from '@/components/MascotaForm';

<MascotaForm
  onSubmit={handleSubmit}
  clientes={listaClientes}
  isEditing={false}
/>
```

**Campos:**
- Nombre, Especie, Raza, Sexo, Edad, Peso
- Estado Reproductivo (Intacto, Esterilizado, Castrado)
- Fecha de Nacimiento (Día, Mes, Año)
- Cliente Asignado
- Foto de la Mascota

## 🔧 APIs Implementadas

### **Usuarios** - `/api/usuarios`
- `GET`: Obtener todos los usuarios con fotos
- `POST`: Crear nuevo usuario
- `PUT`: Actualizar usuario existente
- `DELETE`: Eliminar usuario

### **Mascotas** - `/api/mascotas`
- `GET`: Obtener todas las mascotas con fotos
- `POST`: Crear nueva mascota
- `PUT`: Actualizar mascota existente
- `DELETE`: Eliminar mascota

## 📊 Estructura de Base de Datos

### **Tabla `usuario`**
```sql
CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    foto BYTEA, -- Imagen almacenada como datos binarios
    tipo_usuario VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT NOW()
);
```

### **Tabla `mascota`**
```sql
CREATE TABLE mascota (
    id_mascota SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raza VARCHAR(50),
    sexo VARCHAR(20) NOT NULL,
    edad INTEGER NOT NULL,
    peso DECIMAL(5,2) NOT NULL,
    foto BYTEA, -- Imagen almacenada como datos binarios
    estado_reproductivo VARCHAR(50) NOT NULL,
    dia INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    id_cliente INTEGER REFERENCES cliente(id_cliente),
    fecha_registro TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Flujo de Datos

### **Subida de Imagen**
1. Usuario selecciona imagen → `File` object
2. `FileReader` convierte a Base64 → `data:image/jpeg;base64,...`
3. Frontend envía Base64 a API
4. API convierte Base64 → Buffer
5. Buffer se almacena como BYTEA en PostgreSQL

### **Visualización de Imagen**
1. API obtiene BYTEA de PostgreSQL
2. BYTEA se convierte a Buffer
3. Buffer se convierte a Base64
4. Frontend recibe Base64 y lo muestra en `<img>`

## ⚡ Uso Rápido

### **1. Instalar Dependencias**
```bash
npm install xlsx
```

### **2. Importar Componentes**
```tsx
import ImageUpload from '@/components/ImageUpload';
import ImageDisplay from '@/components/ImageDisplay';
import UserForm from '@/components/UserForm';
import MascotaForm from '@/components/MascotaForm';
```

### **3. Usar en Formularios**
```tsx
const [foto, setFoto] = useState('');

<ImageUpload
  onImageChange={setFoto}
  currentImage={foto}
  label="Mi Imagen"
/>

{foto && (
  <ImageDisplay
    src={foto}
    alt="Vista previa"
    className="mt-4"
  />
)}
```

## 🎨 Personalización

### **Estilos CSS**
Los componentes usan Tailwind CSS y pueden personalizarse:
```tsx
<ImageUpload
  className="custom-upload-class"
  label="Etiqueta Personalizada"
/>
```

### **Validaciones**
```tsx
// Validar tamaño antes de enviar
if (foto && foto.length > 7 * 1024 * 1024) {
  alert('Imagen demasiado grande (máximo 5MB)');
  return;
}
```

### **Tipos de Archivo**
```tsx
// En ImageUpload.tsx
accept="image/*" // Acepta todos los formatos de imagen
// O específicos:
accept="image/jpeg,image/png,image/gif"
```

## 🚨 Consideraciones

### **Rendimiento**
- **Base64**: 33% más grande que archivo original
- **Límite**: 5MB por imagen recomendado
- **Caché**: Las imágenes se cargan en memoria del navegador

### **Seguridad**
- **Validación**: Solo archivos de imagen
- **Tamaño**: Límite de tamaño en frontend y backend
- **Sanitización**: Los archivos se procesan como datos binarios

### **Escalabilidad**
- **Uso Actual**: Ideal para aplicaciones pequeñas/medianas
- **Uso Futuro**: Para muchas imágenes grandes, considerar almacenamiento externo (AWS S3, Cloudinary)

## 🔍 Troubleshooting

### **Error: "Imagen demasiado grande"**
- Verificar que la imagen sea menor a 5MB
- Comprimir la imagen antes de subir

### **Error: "No se puede mostrar la imagen"**
- Verificar que el campo `foto` en la BD no sea `null`
- Verificar que la conversión BYTEA → Base64 funcione

### **Error: "Campo foto no existe"**
- Verificar que la tabla tenga el campo `foto` de tipo `BYTEA`
- Ejecutar el SQL de creación de tablas

## 📝 Ejemplos de Uso

### **Formulario Completo de Usuario**
```tsx
const handleSubmit = async (data: UserFormData) => {
  try {
    const response = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      alert('Usuario creado exitosamente');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

<UserForm onSubmit={handleSubmit} />
```

### **Lista de Usuarios con Fotos**
```tsx
const [usuarios, setUsuarios] = useState([]);

useEffect(() => {
  fetch('/api/usuarios')
    .then(res => res.json())
    .then(data => setUsuarios(data));
}, []);

{usuarios.map(usuario => (
  <div key={usuario.id_usuario}>
    <ImageDisplay
      src={usuario.foto}
      alt={`${usuario.nombre} ${usuario.apellido}`}
      maxHeight="h-24"
      showControls={false}
    />
    <h3>{usuario.nombre} {usuario.apellido}</h3>
  </div>
))}
```

## 🎉 ¡Listo para Usar!

El sistema de imágenes está completamente implementado y listo para usar en tu aplicación El Ceibo. Los componentes son reutilizables y pueden integrarse fácilmente en cualquier parte de tu aplicación.

Para cualquier pregunta o problema, revisa los logs del servidor y la consola del navegador para obtener información de debugging detallada.
