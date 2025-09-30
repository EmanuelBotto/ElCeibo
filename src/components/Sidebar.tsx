"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Search, 
  Package, 
  FileText, 
  Pill, 
  Settings, 
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BarChart3,
  Database
  Users
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import ReportesModal from './ReportesModal';
import BackupModal from './BackupModal';
import { AdminOnly, VeterinarioOrAdmin, EmpleadoOrAbove } from './HiddenIfNoPermission';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReportesModalOpen, setIsReportesModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const menuItems = [
    {
      id: 'inicio',
      label: 'Inicio',
      icon: Home,
      description: 'Panel principal',
      permission: null // Acceso para todos
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: Package,
      description: 'Gestión de productos',
      permission: 'productos:buscar' // Empleados y superiores
    },
    {
      id: 'caja',
      label: 'Caja',
      icon: Search,
      description: 'Control de caja',
      permission: 'caja:gestionar' // Empleados y superiores
    },
    {
      id: 'fichas',
      label: 'Fichas',
      icon: FileText,
      description: 'Fichas de clientes',
      permission: 'fichas:gestionar' // Solo veterinarios y administradores
    },
    {
      id: 'item',
      label: 'Items',
      icon: Pill,
      description: 'Gestión de medicamentos',
      permission: 'items:gestionar' // Solo veterinarios y administradores
    },
    {
      id: 'distribuidores-deudas',
      label: 'Distribuidores',
      icon: Users,
      description: 'Distribuidores y deudas',
      permission: 'distribuidores:gestionar' // Empleados y superiores
    }
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  const handleProfileClick = () => {
    router.push('/perfil');
  };

  const handleUserManagementClick = () => {
    router.push('/usuarios');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleReportesClick = () => {
    setIsReportesModalOpen(true);
  };

  const handleBackupClick = () => {
    setIsBackupModalOpen(true);
  };

  return (
    <div className={`bg-[#a06ba5] text-white transition-all duration-500 ease-out ${
      isCollapsed ? 'w-16' : 'w-64'
    } h-screen flex flex-col`}>
      {/* Header con logo */}
       <div className="h-20 p-4 border-b border-purple-400 relative flex items-center">
         <div className="flex items-center">
           <div className={`flex items-center space-x-2 transition-all duration-300 ${
             isCollapsed ? 'opacity-0' : 'opacity-100'
           }`}>
             <Logo size="sm" />
             <span className="font-bold text-lg text-black">El Ceibo</span>
           </div>
         </div>
         <Button
           variant="ghost"
           size="sm"
           onClick={() => setIsCollapsed(!isCollapsed)}
           className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black hover:bg-purple-400 p-2 transition-transform duration-300 z-10 bg-white rounded-md shadow-sm border border-gray-200"
         >
           {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
         </Button>
       </div>

      {/* Menú principal */}
       <div className="flex-1 py-4 overflow-hidden">
         <nav className="space-y-2 px-3 h-full overflow-y-auto">
           {menuItems.map((item) => {
             const Icon = item.icon;
             
             // Si no tiene permiso específico, mostrar para todos
             if (!item.permission) {
               return (
                 <Button
                   key={item.id}
                   variant={activeTab === item.id ? "secondary" : "ghost"}
                   className={`w-full justify-start hover:bg-purple-400 ${
                     activeTab === item.id ? 'bg-white text-[#a06ba5]' : 'text-black'
                   } ${isCollapsed ? 'px-3' : 'px-3'}`}
                   onClick={() => handleTabClick(item.id)}
                 >
                   <Icon size={20} className={`${isCollapsed ? '' : 'mr-3'} ${activeTab === item.id ? 'text-[#a06ba5]' : 'text-black'}`} />
                   {!isCollapsed && (
                     <div className="flex flex-col items-start">
                       <span className="font-medium text-black">{item.label}</span>
                     </div>
                   )}
                 </Button>
               );
             }
             
            // Usar componentes de permisos para elementos restringidos
            if (item.permission === 'fichas:gestionar' || item.permission === 'items:gestionar') {
              return (
                <VeterinarioOrAdmin key={item.id}>
                  <Button
                    variant={activeTab === item.id ? "secondary" : "ghost"}
                    className={`w-full justify-start hover:bg-purple-400 ${
                      activeTab === item.id ? 'bg-white text-[#a06ba5]' : 'text-black'
                    } ${isCollapsed ? 'px-3' : 'px-3'}`}
                    onClick={() => handleTabClick(item.id)}
                  >
                    <Icon size={20} className={`${isCollapsed ? '' : 'mr-3'} ${activeTab === item.id ? 'text-[#a06ba5]' : 'text-black'}`} />
                    {!isCollapsed && (
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-black">{item.label}</span>
                      </div>
                    )}
                  </Button>
                </VeterinarioOrAdmin>
              );
            }
            
            // Para productos, caja y distribuidores (empleados y superiores)
            return (
              <EmpleadoOrAbove key={item.id}>
                <Button
                  variant={activeTab === item.id ? "secondary" : "ghost"}
                  className={`w-full justify-start hover:bg-purple-400 ${
                    activeTab === item.id ? 'bg-white text-[#a06ba5]' : 'text-black'
                  } ${isCollapsed ? 'px-3' : 'px-3'}`}
                  onClick={() => handleTabClick(item.id)}
                >
                  <Icon size={20} className={`${isCollapsed ? '' : 'mr-3'} ${activeTab === item.id ? 'text-[#a06ba5]' : 'text-black'}`} />
                  {!isCollapsed && (
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-black">{item.label}</span>
                    </div>
                  )}
                </Button>
              </EmpleadoOrAbove>
            );
           })}
         </nav>
       </div>
        {/* Footer con información del usuario */}
       <div className="flex-1 p-4 flex flex-col min-h-0">
         <div className="flex-1"></div>
         
         {/* Información del usuario y botones juntos al final */}
         <div className="space-y-3">
           <div className={`transition-all duration-300 ${
             isCollapsed ? 'opacity-0' : 'opacity-100'
           }`}>
             <div className="flex items-center space-x-3">
               <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden">
                 {user?.foto && user.foto.trim() !== '' ? (
                   <img
                     src={user.foto}
                     alt={`${user.nombre} ${user.apellido}`}
                     className="w-full h-full object-cover"
                     onError={(e) => {
                       console.error('❌ Error cargando imagen del usuario en sidebar:', user.foto);
                       e.currentTarget.style.display = 'none';
                       e.currentTarget.nextElementSibling?.classList.remove('hidden');
                     }}
                   />
                 ) : null}
                 <User size={16} className={`text-[#a06ba5] ${user?.foto && user.foto.trim() !== '' ? 'hidden' : ''}`} />
               </div>
               <div className="flex-1">
                 <p className="text-sm font-medium text-black">{user?.nombre} {user?.apellido}</p>
                 <p className="text-xs text-black opacity-75 capitalize">{user?.tipo_usuario}</p>
               </div>
             </div>
           </div>
           
           {/* Línea divisoria */}
           <div className="border-t border-purple-400 pt-3"></div>
           
           {/* Todos los botones del footer juntos */}
            <div className="space-y-1">
             <EmpleadoOrAbove>
               <Button
                 variant="ghost"
                 size="sm"
                 className={`w-full hover:bg-purple-400 h-8 min-w-[40px] ${
                   isCollapsed ? 'justify-center' : 'justify-start'
                 } text-black`}
                 onClick={handleReportesClick}
               >
                 <BarChart3 size={20} className={`${isCollapsed ? '' : 'mr-3'} text-black`} />
                 {!isCollapsed && <span className="text-black">Reportes</span>}
               </Button>
             </EmpleadoOrAbove>
             
             <AdminOnly>
               <Button
                 variant="ghost"
                 size="sm"
                 className={`w-full hover:bg-purple-400 h-8 min-w-[40px] ${
                   isCollapsed ? 'justify-center' : 'justify-start'
                 } text-black`}
                 onClick={handleBackupClick}
               >
                 <Database size={20} className={`${isCollapsed ? '' : 'mr-3'} text-black`} />
                 {!isCollapsed && <span className="text-black">Backup</span>}
               </Button>
             </AdminOnly>
             
             <AdminOnly>
               <Button
                 variant="ghost"
                 size="sm"
                 className={`w-full hover:bg-purple-400 h-8 min-w-[40px] ${
                   isCollapsed ? 'justify-center' : 'justify-start'
                 } text-black`}
                 onClick={handleUserManagementClick}
               >
                 <Settings size={20} className={`${isCollapsed ? '' : 'mr-3'} text-black`} />
                 {!isCollapsed && <span className="text-black">Modificar Usuarios</span>}
               </Button>
             </AdminOnly>
             
             <Button
               variant="ghost"
               size="sm"
               className={`w-full hover:bg-purple-400 h-8 min-w-[40px] ${
                 isCollapsed ? 'justify-center' : 'justify-start'
               } text-black`}
               onClick={handleProfileClick}
             >
               <User size={20} className={`${isCollapsed ? '' : 'mr-3'} text-black`} />
               {!isCollapsed && <span className="text-black">Mi Perfil</span>}
             </Button>
             
             <Button
               variant="ghost"
               size="sm"
               className={`w-full hover:bg-red-100 hover:text-red-700 h-8 min-w-[40px] ${
                 isCollapsed ? 'justify-center' : 'justify-start'
               } text-red-600`}
               onClick={handleLogout}
             >
               <LogOut size={20} className={`${isCollapsed ? '' : 'mr-3'} text-red-600`} />
               {!isCollapsed && <span>Cerrar Sesión</span>}
             </Button>
           </div>
         </div>
       </div>
       
       {/* Modal de Reportes */}
       <ReportesModal 
         isOpen={isReportesModalOpen} 
         onClose={() => setIsReportesModalOpen(false)} 
       />
       
       {/* Modal de Backup */}
       <BackupModal 
         isOpen={isBackupModalOpen} 
         onClose={() => setIsBackupModalOpen(false)} 
       />
    </div>
  );
} 