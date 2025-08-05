'use client'

import React, { useState } from "react";
import Caja from './Ventana/caja';
import Producto from './Ventana/producto';
import ListaPrecios from './Ventana/lista-precios';
import Distribuidor from './Ventana/distribuidor';
import Item from './Ventana/item';
import { Button } from "@/components/ui/button";
import Mascota from './Ventana/mascota';
import FichasClientes from './Ventana/fichas-clientes';

function FormaDePago() {
  const [forma, setForma] = useState("contado");

  const handleAceptar = () => {
    alert(`Forma de pago seleccionada: ${forma}`);
  };

  return (
    <div style={{
      background: "#ddd",
      padding: "10px",
      borderRadius: "5px",
      width: "150px",
      margin: "10px",
      border: "4px solid #9b59b6"
    }}>
      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Forma de pago</div>
      <div>
        <label style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
          <input
            type="radio"
            checked={forma === "contado"}
            onChange={() => setForma("contado")}
            style={{ marginRight: "6px" }}
          />
          Contado
        </label>
        <label style={{ display: "flex", alignItems: "center" }}>
          <input
            type="radio"
            checked={forma === "electronico"}
            onChange={() => setForma("electronico")}
            style={{ marginRight: "6px" }}
          />
          Electronico
        </label>
      </div>
      <button
        onClick={handleAceptar}
        style={{
          marginTop: "12px",
          width: "100%",
          padding: "6px",
          background: "#9b59b6",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        Aceptar
      </button>
    </div>
  );
}

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
      case 'caja':
        return (
          <>
            <Caja />
            <FormaDePago />
          </>
        );
      case 'mascota':
        return <Mascota />
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
          variant={activeTab === 'caja' ? 'default' : 'outline'}
          onClick={() => setActiveTab('caja')}
        >
          Caja
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
        <Button
          variant={activeTab === 'Mascota' ? 'default' : 'outline'}
          onClick={() => setActiveTab('Mascota')}
        >
          Mascota
        </Button>
      </div>
      <div>
        {renderContent()}
      </div>
    </main>
  );
}
