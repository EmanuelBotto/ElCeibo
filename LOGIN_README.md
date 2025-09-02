# Sistema de Login - El Ceibo

## Descripción

Se ha implementado un sistema completo de autenticación de usuarios para el sistema de gestión veterinaria El Ceibo. El sistema incluye:

- **Login seguro** con hash de contraseñas
- **Gestión de sesiones** con localStorage
- **Protección de rutas** basada en autenticación
- **Perfil de usuario** editable
- **Diferentes roles de usuario** (admin, veterinario, asistente)
- **Interfaz moderna** con la misma temática del sistema

## Características Implementadas

### 🔐 Autenticación
- Login con usuario y contraseña
- Hash seguro de contraseñas con bcryptjs
- Validación de credenciales en la base de datos
- Manejo de errores con mensajes informativos

### 👤 Gestión de Usuarios
- Contexto de autenticación global
- Persistencia de sesión con localStorage
- Función de logout
- Actualización de perfil de usuario

### 🛡️ Protección de Rutas
- Componente `ProtectedRoute` para proteger páginas
- Redirección automática a login si no está autenticado
- Verificación de roles de usuario
- Página de carga durante verificación

### 🎨 Interfaz de Usuario
- Página de login con diseño moderno
- Header con información del usuario logueado
- Página de perfil completa
- Botones de navegación y logout
- Misma temática y colores del sistema existente

## Usuarios Disponibles

Los siguientes usuarios están disponibles en la base de datos:

### 👨‍💼 Administradores
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Rol:** `admin`
- **Email:** admin@elceibo.com

- **Usuario:** `emanuel`
- **Contraseña:** `clave123`
- **Rol:** `admin`
- **Email:** emanuel@email.com

### 👨‍⚕️ Veterinarios
- **Usuario:** `alejandro`
- **Contraseña:** `123`
- **Rol:** `veterinario`
- **Email:** juanjoimnzomnia@gmail.com

### 👩‍💼 Asistentes
- **Usuario:** `asistente`
- **Contraseña:** `asistente123`
- **Rol:** `asistente`
- **Email:** asistente@elceibo.com

### 👥 Clientes
- **Usuario:** `CojeBurros`
- **Contraseña:** `pass456`
- **Rol:** `cliente`
- **Email:** lucia.fer@gmail.com

- **Usuario:** `Notengoidea`
- **Contraseña:** `abc789`
- **Rol:** `cliente`
- **Email:** carlos.perez@hotmail.com

## Estructura de Archivos

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.js          # API de login
│   │       ├── me/route.js             # API para obtener usuario
│   │       └── profile/route.js        # API para actualizar perfil
│   ├── login/
│   │   └── page.tsx                    # Página de login
│   ├── perfil/
│   │   └── page.tsx                    # Página de perfil
│   └── redirect/
│       └── page.tsx                    # Página de redirección
├── components/
│   ├── AuthProvider.tsx                # Contexto de autenticación
│   └── ProtectedRoute.tsx              # Componente de protección
└── scripts/
    └── create-test-users.js            # Script para crear usuarios
```

## APIs Implementadas

### POST /api/auth/login
Autentica un usuario con sus credenciales.

**Body:**
```json
{
  "usuario": "admin",
  "contrasenia": "admin123"
}
```

**Response:**
```json
{
  "message": "Login exitoso",
  "user": {
    "id_usuario": 1,
    "nombre": "Admin",
    "apellido": "Sistema",
    "email": "admin@elceibo.com",
    "tipo_usuario": "admin",
    "usuario": "admin",
    // ... otros campos
  }
}
```

### GET /api/auth/me?id={userId}
Obtiene información de un usuario específico.

### PUT /api/auth/profile
Actualiza el perfil del usuario.

**Body:**
```json
{
  "id_usuario": 1,
  "nombre": "Nuevo Nombre",
  "apellido": "Nuevo Apellido",
  "email": "nuevo@email.com",
  "calle": "Nueva Calle",
  "numero": 123,
  "codigo_postal": 12345,
  "telefono": 1234567890
}
```

## Uso del Sistema

### 1. Acceso al Login
- Navegar a `/login`
- Ingresar usuario y contraseña
- El sistema validará las credenciales

### 2. Dashboard Principal
- Después del login exitoso, se redirige a `/`
- Se muestra información del usuario en el header
- Botones para acceder al perfil y cerrar sesión

### 3. Perfil de Usuario
- Acceder desde el botón "Mi Perfil" en el header
- Ver información personal
- Editar datos del perfil
- Guardar cambios

### 4. Logout
- Hacer clic en "Cerrar Sesión"
- Se limpia la sesión y redirige a login

## Seguridad

- ✅ Contraseñas hasheadas con bcryptjs
- ✅ Validación de entrada en todas las APIs
- ✅ Manejo seguro de errores
- ✅ Protección de rutas sensibles
- ✅ Persistencia segura de sesión

## Tecnologías Utilizadas

- **Next.js 14** - Framework de React
- **PostgreSQL** - Base de datos
- **bcryptjs** - Hash de contraseñas
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos
- **Sonner** - Notificaciones toast

## Instalación y Configuración

1. **Instalar dependencias:**
```bash
npm install bcryptjs
```

2. **Crear usuarios de prueba:**
```bash
node scripts/create-test-users.js
```

3. **Ejecutar el proyecto:**
```bash
npm run dev
```

4. **Acceder al sistema:**
- Ir a `http://localhost:3000/login`
- Usar cualquiera de los usuarios de prueba

## Notas Importantes

- El sistema está completamente integrado con la base de datos existente
- Mantiene la misma temática y diseño del sistema actual
- Es compatible con los roles de usuario existentes
- Incluye manejo completo de errores y validaciones
- Está listo para producción con mejoras de seguridad adicionales si es necesario 