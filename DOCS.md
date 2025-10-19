# Documentación Técnica - ElCeibo

## Tabla de Contenidos
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Configuración del Entorno](#configuración-del-entorno)
3. [Estructura de la Base de Datos](#estructura-de-la-base-de-datos)
4. [API Endpoints](#api-endpoints)
5. [Componentes Principales](#componentes-principales)
6. [Flujos de Trabajo](#flujos-de-trabajo)
7. [Configuración de Producción](#configuración-de-producción)
8. [Troubleshooting Avanzado](#troubleshooting-avanzado)

## Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: Next.js 15 con App Router
- **Lenguaje**: TypeScript
- **Styling**: Tailwind CSS
- **Iconos**: Lucide React
- **Base de Datos**: PostgreSQL
- **Autenticación**: NextAuth.js
- **Deployment**: Vercel

### Estructura de Directorios
```
src/
├── app/                    # App Router de Next.js 15
│   ├── api/               # API Routes
│   │   ├── auth/          # Autenticación
│   │   ├── productos/     # Gestión de productos
│   │   ├── caja/          # Sistema de caja
│   │   ├── clientes/      # Gestión de clientes
│   │   ├── mascotas/      # Gestión de mascotas
│   │   └── reportes/      # Reportes y estadísticas
│   ├── Ventana/           # Componentes principales de la aplicación
│   ├── dashboard/         # Panel de control
│   └── mascota/           # Gestión de fichas de mascotas
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes de interfaz base
│   ├── DashboardLayout.tsx
│   ├── Sidebar.tsx
│   └── AuthProvider.tsx
└── lib/                   # Utilidades y configuraciones
    ├── auth.ts           # Configuración de autenticación
    ├── db.ts             # Conexión a base de datos
    └── utils.ts          # Funciones utilitarias
```

## Configuración del Entorno

### Variables de Entorno Requeridas

#### Desarrollo (.env.local)
```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/elceibo"

# Autenticación
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-clave-secreta-para-jwt"

# Configuración de la aplicación
NODE_ENV="development"
```

#### Producción (Vercel)
```env
# Base de datos (usar URL de producción)
DATABASE_URL="postgresql://usuario:password@host:5432/elceibo"

# Autenticación
NEXTAUTH_URL="https://tu-dominio.vercel.app"
NEXTAUTH_SECRET="clave-super-secreta-para-produccion"

# Configuración de la aplicación
NODE_ENV="production"
```

### Configuración de PostgreSQL

#### Crear Base de Datos
```sql
-- Conectar como superusuario
psql -U postgres

-- Crear base de datos
CREATE DATABASE elceibo;

-- Crear usuario específico (opcional)
CREATE USER elceibo_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE elceibo TO elceibo_user;
```

#### Tablas Principales (Ejemplo)
```sql
-- Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(20) DEFAULT 'veterinario',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de mascotas
CREATE TABLE mascotas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especie VARCHAR(50),
    raza VARCHAR(50),
    fecha_nacimiento DATE,
    propietario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio_costo DECIMAL(10,2),
    porcentaje_final DECIMAL(5,2),
    porcentaje_mayorista DECIMAL(5,2),
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `PUT /api/auth/profile` - Actualizar perfil

### Productos
- `GET /api/products` - Listar productos (con paginación)
- `POST /api/products` - Crear producto
- `PUT /api/products/[id]` - Actualizar producto
- `DELETE /api/products/[id]` - Eliminar producto
- `GET /api/products/[id]/percentages` - Obtener porcentajes

### Caja/Ventas
- `GET /api/caja` - Obtener ventas
- `POST /api/caja/venta` - Procesar venta
- `GET /api/caja/[id]` - Obtener venta específica
- `GET /api/caja/detalle/[id]` - Detalle de venta

### Clientes y Mascotas
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Crear cliente
- `GET /api/mascotas` - Listar mascotas
- `POST /api/mascotas` - Crear mascota
- `GET /api/fichas` - Obtener fichas de mascotas

### Reportes
- `GET /api/reportes` - Generar reportes
- `GET /api/dashboard/stats` - Estadísticas del dashboard

## Componentes Principales

### DashboardLayout
Componente principal que envuelve toda la aplicación.
- **Props**: `activeTab`, `onTabChange`
- **Funcionalidad**: Sidebar, navegación, layout responsive

### Ventana Components
- **Caja**: Sistema de ventas y facturación
- **Producto**: Gestión de inventario
- **Item**: Gestión de items/productos
- **Ingreso**: Proceso de venta
- **DistribuidoresDeudas**: Gestión de distribuidores

### AuthProvider
Maneja el estado de autenticación global.
- **Context**: Usuario actual, estado de login
- **Hooks**: `useAuth()`

## Flujos de Trabajo

### Flujo de Venta
1. Usuario selecciona productos en el módulo "Ingreso"
2. Se calculan precios según tipo de cliente
3. Se procesa el pago
4. Se genera la factura
5. Se actualiza el stock

### Flujo de Gestión de Mascotas
1. Crear/editar cliente
2. Registrar mascota asociada
3. Crear ficha médica
4. Registrar visitas y tratamientos

### Flujo de Inventario
1. Agregar productos con precios
2. Configurar porcentajes de ganancia
3. Control de stock automático
4. Reportes de inventario

## Configuración de Producción

### Vercel Deployment
1. **Conectar repositorio** en Vercel
2. **Configurar variables de entorno**:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
3. **Configurar dominio** (opcional)
4. **Configurar SSL** automático

### Optimizaciones de Producción
- **Build optimizado**: `npm run build`
- **Imágenes optimizadas**: Usar `next/image`
- **Caching**: Configurar headers de caché
- **CDN**: Vercel Edge Network

### Monitoreo
- **Vercel Analytics**: Métricas de rendimiento
- **Error tracking**: Logs de errores
- **Database monitoring**: Monitoreo de consultas

## Troubleshooting Avanzado

### Problemas de Build
```bash
# Limpiar caché completo
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Problemas de Base de Datos
```bash
# Verificar conexión
psql $DATABASE_URL -c "SELECT version();"

# Verificar tablas
psql $DATABASE_URL -c "\dt"
```

### Problemas de TypeScript
```bash
# Verificar tipos
npm run type-check

# Limpiar caché de TypeScript
rm -rf .next
```

### Problemas de Performance
- **Bundle analyzer**: `npm run analyze`
- **Lighthouse**: Auditar performance
- **Database queries**: Optimizar consultas lentas

### Logs y Debugging
```bash
# Logs de desarrollo
npm run dev

# Logs de producción (Vercel)
vercel logs

# Debug de base de datos
DEBUG=* npm run dev
```

## Mejores Prácticas

### Código
- Usar TypeScript estricto
- Componentes funcionales con hooks
- Manejo de errores consistente
- Validación de datos en API

### Base de Datos
- Índices en campos de búsqueda
- Transacciones para operaciones críticas
- Backups regulares
- Migraciones versionadas

### Seguridad
- Validar inputs del usuario
- Sanitizar datos de entrada
- Usar HTTPS en producción
- Rotar secretos regularmente

### Performance
- Lazy loading de componentes
- Optimización de imágenes
- Caching estratégico
- Minimizar bundle size

---

Para más información específica, consulta los comentarios en el código o abre un issue en GitHub.
