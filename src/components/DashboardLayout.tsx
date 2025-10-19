"use client";


import Sidebar from './Sidebar';
import ProtectedRoute from './ProtectedRoute';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={onTabChange}
        />
        
                {/* Contenido principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Contenido */}
          <main className="flex-1 overflow-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 