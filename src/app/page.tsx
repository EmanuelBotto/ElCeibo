'use client'

import React, { useState } from "react";
import Caja from './Ventana/caja';
import Producto from './Ventana/producto';
import FichasClientes from './mascota/fichas-clientes';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardPage from './dashboard/page';
import Item from './Ventana/item';
import Ingreso from './Ventana/ingreso';
import DistribuidoresDeudas from './Ventana/distribuidores-deudas';
// import ProtectedRoute from '@/components/ProtectedRoute';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('inicio');

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return <DashboardPage />;
      case 'productos':
        return <Producto />;
      case 'caja':
        return <Caja onTabChange={setActiveTab} />;
      case 'fichas':
        return <FichasClientes />;
      case 'item':
        return <Item />;
      case 'ingreso':
        return <Ingreso onVolver={() => setActiveTab('caja')} />;
      case 'distribuidores-deudas':
        return <DistribuidoresDeudas onTabChange={setActiveTab} />;
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