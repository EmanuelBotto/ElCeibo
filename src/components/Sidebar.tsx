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
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import Logo from './Logo';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const router = useRouter();



  const menuItems = [
    {
      id: 'inicio',
      label: 'Inicio',
      icon: Home,
      description: 'Panel principal'
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: Package,
      description: 'Gestión de productos'
    },
    {
      id: 'caja',
      label: 'Caja',
      icon: Search,
      description: 'Control de caja'
    },
    {
      id: 'fichas',
      label: 'Fichas',
      icon: FileText,
      description: 'Fichas de clientes'
    },
    {
      id: 'medicamentos',
      label: 'Medicamentos',
      icon: Pill,
      description: 'Gestión de medicamentos'
    },
    {
      id: 'ListaPrecios',
      label: 'lista',
      icon: Users,
      description: 'Gestión de listas'
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

  return (
    <div className={`bg-[#a06ba5] text-white transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64'
    } h-screen flex flex-col`}>
      
      {/* Header con logo */}
      <div className="p-4 border-b border-purple-400">
        <div className="flex items-center justify-between">
                     {!isCollapsed && (
             <div className="flex items-center space-x-2">
               <Logo size="sm" />
               <span className="font-bold text-lg text-black">El Ceibo</span>
             </div>
           )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-black hover:bg-purple-400 p-1"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
      </div>

      {/* Menú principal */}
      <div className="flex-1 py-4">
        <nav className="space-y-2 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                                 className={`w-full justify-start hover:bg-purple-400 ${
                   activeTab === item.id ? 'bg-white text-[#a06ba5]' : 'text-black'
                 } ${isCollapsed ? 'px-2' : 'px-3'}`}
                onClick={() => handleTabClick(item.id)}
              >
                                 <Icon size={20} className={`mr-3 ${activeTab === item.id ? 'text-[#a06ba5]' : 'text-black'}`} />
                {!isCollapsed && (
                                     <div className="flex flex-col items-start">
                                           <span className="font-medium text-black">{item.label}</span>
                      <span className="text-xs text-black opacity-75">{item.description}</span>
                   </div>
                )}
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Footer con información del usuario */}
      <div className="p-4 border-t border-purple-400">
        {!isCollapsed && (
          <div className="mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <User size={16} className="text-[#a06ba5]" />
              </div>
              <div className="flex-1">
                                 <p className="text-sm font-medium text-black">{user?.nombre} {user?.apellido}</p>
                 <p className="text-xs text-black opacity-75 capitalize">{user?.tipo_usuario}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-black hover:bg-purple-400"
            onClick={handleUserManagementClick}
          >
            <Settings size={16} className="mr-3 text-black" />
            {!isCollapsed && <span className="text-black">Modificar Usuarios</span>}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-black hover:bg-purple-400"
            onClick={handleProfileClick}
          >
            <User size={16} className="mr-3 text-black" />
            {!isCollapsed && <span className="text-black">Mi Perfil</span>}
          </Button>
        </div>
      </div>
    </div>
  );
} 