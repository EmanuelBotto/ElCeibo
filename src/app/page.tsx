'use client'

import React, { useState } from "react";
import Caja from './Ventana/caja';
import Producto from './Ventana/producto';
import FichasClientes from './Ventana/fichas-clientes';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardPage from './dashboard/page';
import Mascota from './Ventana/mascota';
import ListaPrecios from './Ventana/lista-precios';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('inicio');

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return <DashboardPage />;
      case 'productos':
        return <Producto />;
      case 'caja':
        return <Caja />;
      case 'fichas':
        return <FichasClientes />;
      case 'mascota':
        return <Mascota />;
      case 'ListaPrecios':
        return <ListaPrecios />;
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
