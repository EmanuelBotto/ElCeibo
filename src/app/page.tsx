<<<<<<< HEAD
import Caja from './Ventana/caja';
=======
"use client";

import { useState } from 'react';
>>>>>>> 9c35a8acd41a77913987a45f3efc291be1dd65ee
import Producto from './Ventana/producto';
import ListaPrecios from './Ventana/lista-precios';
import Distribuidor from './Ventana/distribuidor';
import Item from './Ventana/item';
import { Button } from "@/components/ui/button";
import Mascota from './Ventana/mascota';
import FichasClientes from './Ventana/fichas-clientes';

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
      case 'fichasClientes':
        return <FichasClientes />;
      default:
        return <Producto />;
    }
  };

  return (
    <main className="p-4">
<<<<<<< HEAD
      <div className="space-y-8">
        <ListaPrecios />
        <Caja />
        <Producto />
=======
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
        <Button
          variant={activeTab === 'fichasClientes' ? 'default' : 'outline'}
          onClick={() => setActiveTab('fichasClientes')}
        >
          Fichas Clientes
        </Button>
      </div>
      <div>
        {renderContent()}
>>>>>>> 9c35a8acd41a77913987a45f3efc291be1dd65ee
      </div>
    </main>
  );
}
