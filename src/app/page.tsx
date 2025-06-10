"use client";

import { useState } from 'react';
import Producto from './Ventana/producto';
import ListaPrecios from './Ventana/lista-precios';
import Distribuidor from './Ventana/distribuidor';
import Item from './Ventana/item';
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('productos');

  const renderContent = () => {
    switch (activeTab) {
      case 'productos':
        return <Producto />;
      case 'listaPrecios':
        return <ListaPrecios />;
      case 'distribuidores':
        return <Distribuidor />;
      case 'items':
        return <Item />;
      default:
        return <Producto />;
    }
  };

  return (
    <main className="p-4">
      <div className="mb-4 flex space-x-4 border-b pb-4">
        <Button
          variant={activeTab === 'productos' ? 'default' : 'outline'}
          onClick={() => setActiveTab('productos')}
        >
          Productos
        </Button>
        <Button
          variant={activeTab === 'listaPrecios' ? 'default' : 'outline'}
          onClick={() => setActiveTab('listaPrecios')}
        >
          Lista de Precios
        </Button>
        <Button
          variant={activeTab === 'distribuidores' ? 'default' : 'outline'}
          onClick={() => setActiveTab('distribuidores')}
        >
          Distribuidores
        </Button>
        <Button
          variant={activeTab === 'items' ? 'default' : 'outline'}
          onClick={() => setActiveTab('items')}
        >
          Items
        </Button>
      </div>
      <div>
        {renderContent()}
      </div>
    </main>
  );
}
