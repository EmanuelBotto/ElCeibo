# ElCeibo - Sistema de Gestión Veterinaria

Sistema completo de gestión para clínicas veterinarias desarrollado con Next.js 15 y TypeScript.

## Características Principales

- **Gestión de Mascotas**: Fichas completas de pacientes
- **Inventario de Productos**: Control de stock y precios
- **Sistema de Caja**: Ventas y facturación
- **Gestión de Clientes**: Base de datos de propietarios
- **Reportes**: Estadísticas y análisis
- **Autenticación**: Sistema de usuarios seguro

## Instalación

### Prerrequisitos
- Node.js 18 o superior
- Cuenta en [Neon](https://neon.tech) (base de datos gratuita)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/EmanuelBotto/ElCeibo.git
cd ElCeibo
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Base de datos Neon
DATABASE_URL="tu-url-de-neon"

# JWT Secret
JWT_SECRET="tu-clave-secreta"

# URL de la aplicación
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Ejecutar la Aplicación
```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:3000

## Tecnologías

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Base de Datos**: Neon (PostgreSQL)
- **Autenticación**: NextAuth.js

## Funcionalidades

- **Gestión de Mascotas**: Fichas completas de pacientes
- **Inventario**: Control de productos y stock
- **Caja**: Sistema de ventas y facturación
- **Clientes**: Base de datos de propietarios
- **Reportes**: Estadísticas y análisis

## Solución de Problemas

### Error de Módulos No Encontrados
```bash
# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error de Base de Datos
- Verifica que la URL de Neon sea correcta
- Confirma que la base de datos esté activa

## Documentación

Para información técnica detallada, consulta la [documentación completa](DOCS.md).

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Abre un Pull Request

## Soporte

- **Issues**: [GitHub Issues](https://github.com/EmanuelBotto/ElCeibo/issues)
