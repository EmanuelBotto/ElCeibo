# ElCeibo - Sistema de Gestión Veterinaria

Sistema completo de gestión para clínicas veterinarias desarrollado con Next.js 15, TypeScript y PostgreSQL.

## Características Principales

- **Gestión de Mascotas**: Fichas completas de pacientes con historial médico
- **Inventario de Productos**: Control de stock, precios y códigos de barras
- **Sistema de Caja**: Ventas en tiempo real y facturación automática
- **Gestión de Clientes**: Base de datos de propietarios y sus mascotas
- **Reportes y Estadísticas**: Análisis de ventas y rendimiento
- **Autenticación Segura**: Sistema de usuarios con roles
- **Diseño Responsive**: Funciona perfectamente en móviles y tablets

## Instalación Rápida

### Prerrequisitos
- Node.js 18 o superior
- PostgreSQL 12 o superior
- npm o yarn

### 1. Clonar el Repositorio
```bash
git clone https://github.com/EmanuelBotto/ElCeibo.git
cd ElCeibo
```

### 2. Instalar Dependencias
```bash
npm install
# o
yarn install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/elceibo"

# JWT Secret (genera una clave segura)
JWT_SECRET="tu-clave-secreta-muy-segura"

# URL de la aplicación
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Configurar Base de Datos
```bash
# Crear la base de datos en PostgreSQL
createdb elceibo

# O usando psql
psql -U postgres -c "CREATE DATABASE elceibo;"
```

### 5. Ejecutar la Aplicación
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm run build
npm start
```

La aplicación estará disponible en: http://localhost:3000

## Instalación con Docker (Recomendada)

### Usando Docker Compose
```bash
# Clonar el repositorio
git clone https://github.com/EmanuelBotto/ElCeibo.git
cd ElCeibo

# Ejecutar con Docker Compose
docker-compose up -d
```

Esto incluye:
- Aplicación Next.js
- Base de datos PostgreSQL
- Configuración automática
- Puerto 3000 expuesto

## Estructura del Proyecto

```
ElCeibo/
├── src/
│   ├── app/                    # Páginas de Next.js 15
│   │   ├── api/               # API Routes
│   │   ├── Ventana/           # Componentes principales
│   │   ├── dashboard/         # Panel de control
│   │   └── mascota/           # Gestión de mascotas
│   ├── components/            # Componentes reutilizables
│   └── lib/                   # Utilidades y configuraciones
├── public/                    # Archivos estáticos
├── package.json              # Dependencias
├── next.config.js            # Configuración de Next.js
├── tailwind.config.js        # Configuración de Tailwind
└── README.md                 # Este archivo
```

## Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React
- **Base de Datos**: PostgreSQL
- **Autenticación**: NextAuth.js
- **ORM**: Prisma (si se implementa)
- **Deployment**: Vercel

## Funcionalidades

### Gestión de Mascotas
- Fichas completas de pacientes con toda su información
- Historial médico detallado
- Registro de vacunas y tratamientos
- Galería de fotos de mascotas

### Inventario de Productos
- Catálogo completo de productos
- Control de stock en tiempo real
- Precios diferenciados por tipo de cliente
- Soporte para códigos de barras

### Sistema de Caja
- Ventas en tiempo real con interfaz intuitiva
- Múltiples formas de pago (efectivo, tarjeta, transferencia)
- Facturación automática
- Reportes detallados de ventas

### Gestión de Clientes
- Base de datos completa de propietarios
- Historial de compras y visitas
- Información de contacto actualizada
- Asociación de múltiples mascotas por cliente

## Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Construye para producción
npm start           # Inicia servidor de producción

# Linting y Testing
npm run lint        # Ejecuta ESLint
npm run type-check  # Verifica tipos TypeScript
```

## Despliegue en Vercel

1. **Conectar con GitHub**:
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu cuenta de GitHub
   - Importa el repositorio `EmanuelBotto/ElCeibo`

2. **Configurar Variables de Entorno**:
   - `DATABASE_URL`: URL de tu base de datos PostgreSQL
   - `JWT_SECRET`: Clave secreta para JWT
   - `NEXTAUTH_URL`: URL de tu aplicación

3. **Desplegar**:
   - Vercel detectará automáticamente que es un proyecto Next.js
   - El despliegue se realizará automáticamente

## Solución de Problemas

### Error de Módulos No Encontrados
```bash
# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error de Base de Datos
- Verifica que PostgreSQL esté ejecutándose
- Confirma que la URL de conexión sea correcta
- Asegúrate de que la base de datos exista

### Error de Build en Vercel
- Verifica que todas las dependencias estén en `package.json`
- Confirma que no haya errores de TypeScript
- Revisa las variables de entorno

## Documentación

Para información técnica detallada, consulta la [documentación completa](DOCS.md) que incluye:
- Arquitectura del sistema
- Configuración avanzada
- API endpoints
- Flujos de trabajo
- Troubleshooting avanzado

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Soporte

- **Issues**: [GitHub Issues](https://github.com/EmanuelBotto/ElCeibo/issues)
- **Email**: soporte@elceibo.com

---

¿Te gusta el proyecto? Dale una estrella en GitHub para apoyar el desarrollo.
