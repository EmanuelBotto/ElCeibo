"use client";

import { useState } from 'react';
import Producto from './Ventana/producto';
import Item from './Ventana/item';
import FichasClientes from './Ventana/fichas-clientes';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardPage from './dashboard/page';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('inicio');

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return <DashboardPage />;
      case 'productos':
        return <Producto />;
      case 'caja':
        return <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Control de Caja</h2>
          <p className="text-gray-600">Funcionalidad de caja en desarrollo...</p>
        </div>;
      case 'fichas':
        return <FichasClientes />;
      case 'medicamentos':
        return <Item />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
