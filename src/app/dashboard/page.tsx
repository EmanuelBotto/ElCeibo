"use client";

import { useState, useEffect } from 'react';
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

interface StatItem {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  time: string;
  icon: React.ComponentType<any>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener estadísticas
        const statsResponse = await fetch('/api/dashboard/stats');
        const statsData = await statsResponse.json();
        
        // Obtener actividades recientes
        const activitiesResponse = await fetch('/api/dashboard/activities');
        const activitiesData = await activitiesResponse.json();
        const activitiesArray = Array.isArray(activitiesData) ? activitiesData : [];
        
        // Mapear estadísticas con iconos
        const statsWithIcons: StatItem[] = [
          {
            title: "Total Clientes",
            value: statsData.totalClientes?.valor?.toLocaleString() || "0",
            change: "Registrados",
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-100"
          },
          {
            title: "Productos Activos",
            value: statsData.totalProductos?.valor?.toLocaleString() || "0",
            change: "En inventario",
            icon: Package,
            color: "text-green-600",
            bgColor: "bg-green-100"
          },
          {
            title: "Fichas Creadas",
            value: statsData.totalMascotas?.valor?.toLocaleString() || "0",
            change: "Mascotas atendidas",
            icon: FileText,
            color: "text-purple-600",
            bgColor: "bg-purple-100"
          },
          {
            title: "Ingresos del Mes",
            value: `$${statsData.ingresosMes?.valor?.toLocaleString() || "0"}`,
            change: statsData.ingresosMes?.cambio !== undefined ? 
              `${statsData.ingresosMes.cambio >= 0 ? '+' : ''}${statsData.ingresosMes.cambio}%` : 
              "Sin datos previos",
            icon: DollarSign,
            color: "text-orange-600",
            bgColor: "bg-orange-100"
          }
        ];

        // Mapear actividades con iconos
        const activitiesWithIcons: ActivityItem[] = activitiesArray.map((activity: any) => {
          const iconMap: { [key: string]: React.ComponentType<any> } = {
            'Users': Users,
            'Package': Package,
            'FileText': FileText,
            'DollarSign': DollarSign
          };
          
          return {
            ...activity,
            icon: iconMap[activity.icon] || Activity
          };
        });

        setStats(statsWithIcons);
        setRecentActivities(activitiesWithIcons);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        // En caso de error, usar datos por defecto
        setStats([
          {
            title: "Total Clientes",
            value: "0",
            change: "Registrados",
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-100"
          },
          {
            title: "Productos Activos",
            value: "0",
            change: "En inventario",
            icon: Package,
            color: "text-green-600",
            bgColor: "bg-green-100"
          },
          {
            title: "Fichas Creadas",
            value: "0",
            change: "Mascotas atendidas",
            icon: FileText,
            color: "text-purple-600",
            bgColor: "bg-purple-100"
          },
          {
            title: "Ingresos del Mes",
            value: "$0",
            change: "Sin datos previos",
            icon: DollarSign,
            color: "text-orange-600",
            bgColor: "bg-orange-100"
          }
        ]);
        setRecentActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos del dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header del Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl text-black mt-1">
            Resumen de actividades
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="text-black" size={20} />
          <span className="text-black">
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
                {stat.title === "Ingresos del Mes" ? (
                  <p className={`text-xs mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    {stat.change} desde el mes pasado
                  </p>
                ) : (
                  <p className="text-xs mt-1 text-gray-500">
                    {stat.change}
                  </p>
                )}
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
              <Activity className="h-5 w-5 text-purple-600" />
              <span className="text-black">Actividad Reciente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => {
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
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay actividades recientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PawPrint className="h-5 w-5 text-purple-600" />
              <span className="text-black">Información del Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-black">Versión del Sistema</span>
                <span className="text-sm font-medium text-black">v1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-black">Estado del Servidor</span>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-black">Base de Datos</span>
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
                Sistema de gestión veterinaria creado como proyecto final de la carrera
                desarrollador de software en Instituto Tecnologico el Molino (ITEC).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 