"use client";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Package, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Activity,
  PawPrint,
  Calendar,
  Clock
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: "Total Clientes",
      value: "1,234",
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Productos Activos",
      value: "567",
      change: "+5%",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Fichas Creadas",
      value: "89",
      change: "+23%",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Ingresos del Mes",
      value: "$45,678",
      change: "+8%",
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: "cliente",
      message: "Nuevo cliente registrado: Rosame el ano",
      time: "Hace 5 minutos",
      icon: Users
    },
    {
      id: 2,
      type: "producto",
      message: "Producto agregado: Vacuna Triple Felina",
      time: "Hace 15 minutos",
      icon: Package
    },
    {
      id: 3,
      type: "ficha",
      message: "Ficha actualizada: Mascota 'Luna'",
      time: "Hace 1 hora",
      icon: FileText
    },
    {
      id: 4,
      type: "venta",
      message: "Venta realizada: $150.00",
      time: "Hace 2 horas",
      icon: DollarSign
    }
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header del Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Bienvenido, {user?.nombre}!
          </h1>
          <p className="text-gray-600 mt-1">
            Aquí tienes un resumen de la actividad de El Ceibo
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="text-gray-400" size={20} />
          <span className="text-gray-600">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  {stat.change} desde el mes pasado
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad Reciente */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-black" />
              <span>Actividad Reciente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Icon className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Información del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PawPrint className="h-5 w-5 text-purple-600" />
              <span>Información del Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Versión del Sistema</span>
                <span className="text-sm font-medium">v2.1.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Última Actualización</span>
                <span className="text-sm font-medium">Hace 2 días</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estado del Servidor</span>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Base de Datos</span>
                <span className="text-sm font-medium text-green-600">Conectada</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mensaje de bienvenida */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <PawPrint className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Sistema El Ceibo
              </h3>
              <p className="text-gray-600 mt-1">
                Tu sistema de gestión veterinaria está funcionando correctamente. 
                Utiliza la barra lateral para navegar entre las diferentes secciones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 