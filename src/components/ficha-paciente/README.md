# Componentes de Ficha de Paciente

Este directorio contiene los componentes refactorizados para la ficha de paciente, organizados de manera modular y reutilizable.

## Estructura

```
src/components/ficha-paciente/
├── index.js                    # Exportaciones centralizadas
├── utils.js                    # Funciones utilitarias
├── useFichaPaciente.js         # Hook personalizado para lógica de estado
├── PetInfoCard.jsx            # Tarjeta de información de la mascota
├── MedicalHistory.jsx         # Historial médico
├── VaccinationSection.jsx     # Sección de vacunas
├── AddPetDialog.jsx           # Diálogo para agregar mascota
├── VisitDialog.jsx            # Diálogo para visitas médicas
└── README.md                  # Este archivo
```

## Componentes

### PetInfoCard
Muestra la información básica de la mascota incluyendo foto, datos personales y información del propietario.

**Props:**
- `ficha`: Objeto con datos de la mascota y cliente
- `onEditPhoto`: Función para editar foto
- `onDeletePet`: Función para eliminar mascota
- `onAddNewPet`: Función para agregar nueva mascota

### HistorialMedico
Componente para mostrar y gestionar el historial médico del paciente.

**Props:**
- `historial`: Array de visitas médicas
- `onAddVisit`: Función para agregar nueva visita
- `onEditVisit`: Función para editar visita
- `onDeleteVisit`: Función para eliminar visita
- `mascotaNombre`: Nombre de la mascota

### SeccionVacunas
Sección completa para la gestión de vacunas con alertas y próximas vacunas.

**Props:**
- `proximasVacunas`: Array de próximas vacunas
- `alertasVacunas`: Array de alertas de vacunas
- `itemsVacunas`: Array de items de vacunas disponibles
- `onAddVaccination`: Función para agregar vacuna
- `onEditVaccination`: Función para editar vacuna
- `onDeleteVaccination`: Función para eliminar vacuna
- `mascotaId`: ID de la mascota

### DialogoNuevaMascota
Diálogo modal para agregar una nueva mascota con formulario completo.

**Props:**
- `isOpen`: Estado de apertura del diálogo
- `onClose`: Función para cerrar el diálogo
- `onSubmit`: Función para enviar el formulario
- `clienteId`: ID del cliente propietario

### DialogoVisita
Diálogo modal para crear o editar visitas médicas.

**Props:**
- `isOpen`: Estado de apertura del diálogo
- `onClose`: Función para cerrar el diálogo
- `onSubmit`: Función para enviar el formulario
- `mascotaId`: ID de la mascota
- `visitaData`: Datos de la visita (para edición)
- `isEditing`: Indica si está en modo edición

## Hooks

### useFichaPaciente
Hook personalizado que maneja toda la lógica de estado y operaciones de la ficha del paciente.

**Parámetros:**
- `mascotaId`: ID de la mascota

**Retorna:**
- Estado: `ficha`, `isLoading`, `historial`, `itemsVacunas`, `proximasVacunas`, `alertasVacunas`
- Acciones: `cargarDatosMascota`, `agregarVisita`, `actualizarVisita`, `eliminarVisita`, `agregarMascota`, `eliminarMascota`, `actualizarFotoMascota`

## Utilidades

### Funciones principales:
- `getPetIcon(especie)`: Obtiene el ícono según la especie
- `calcularAlertasVacunas(vacunas)`: Calcula alertas de vacunas
- `obtenerItemsVacunas()`: Obtiene items de vacunas con caché
- `formatearFecha(fecha)`: Formatea fechas
- `formatearFechaCorta(fecha)`: Formatea fechas cortas
- `calcularEdad(fechaNacimiento)`: Calcula la edad de la mascota
- `validarFormularioVisita(formData)`: Valida formulario de visita
- `validarFormularioVacuna(formData)`: Valida formulario de vacuna
- `validarFormularioMascota(formData)`: Valida formulario de mascota

## Uso

```jsx
import {
  TarjetaInfoMascota,
  HistorialMedico,
  SeccionVacunas,
  DialogoNuevaMascota,
  DialogoVisita,
  useFichaPaciente
} from '@/components/ficha-paciente';

function FichaPaciente({ mascotaId }) {
  const {
    ficha,
    isLoading,
    historial,
    // ... otros estados y funciones
  } = useFichaPaciente(mascotaId);

  return (
    <div>
      <TarjetaInfoMascota ficha={ficha} onEditPhoto={handleEditPhoto} />
      <HistorialMedico historial={historial} onAddVisit={handleAddVisit} />
      <SeccionVacunas proximasVacunas={proximasVacunas} />
    </div>
  );
}
```

## Beneficios de la Refactorización

1. **Modularidad**: Cada componente tiene una responsabilidad específica
2. **Reutilización**: Los componentes pueden ser reutilizados en otras partes de la aplicación
3. **Mantenibilidad**: Código más fácil de mantener y debuggear
4. **Testabilidad**: Componentes más pequeños son más fáciles de testear
5. **Legibilidad**: Código más limpio y organizado
6. **Separación de responsabilidades**: Lógica de estado separada de la presentación
7. **Hooks personalizados**: Lógica reutilizable encapsulada en hooks
8. **Utilidades centralizadas**: Funciones comunes en un solo lugar

## Migración

Para migrar del archivo original `ficha-paciente.jsx` al nuevo sistema:

1. Reemplazar el import del componente original
2. Usar los nuevos componentes modulares
3. Implementar los handlers necesarios
4. Aprovechar el hook `useFichaPaciente` para la lógica de estado

El archivo `ficha-paciente-refactored.jsx` muestra un ejemplo completo de cómo usar todos los componentes juntos.
