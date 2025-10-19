# ElCeibo - Instalador Completo
# Sistema de gestión veterinaria

## 📋 Instalación Automática

### Opción 1: Instalación con Docker (RECOMENDADA)
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/elceibo.git
cd elceibo

# Ejecutar instalación automática
chmod +x install.sh
./install.sh
```

### Opción 2: Instalación Manual
```bash
# Instalar dependencias
npm install

# Configurar base de datos
npm run setup:db

# Iniciar aplicación
npm start
```

## 🐳 Docker Compose (Todo incluido)

El instalador incluye:
- ✅ Aplicación Next.js
- ✅ Base de datos PostgreSQL
- ✅ Configuración automática
- ✅ SSL opcional
- ✅ Backup automático

## 📁 Estructura del Proyecto

```
elceibo/
├── src/                    # Código fuente
├── docker/                 # Configuración Docker
├── scripts/               # Scripts de instalación
├── docs/                  # Documentación
├── install.sh            # Instalador principal
├── docker-compose.yml    # Orquestación completa
└── README.md             # Este archivo
```

## 🚀 Características del Instalador

- **Instalación en 1 comando**
- **Base de datos automática**
- **Configuración SSL opcional**
- **Backup automático**
- **Actualizaciones fáciles**
- **Soporte para Windows/Linux/Mac**

## 📞 Soporte

Para soporte técnico: soporte@elceibo.com