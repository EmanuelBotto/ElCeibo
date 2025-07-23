"use client";

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

function Modal({ open, onClose, onSubmit, form, setForm, mode }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 340, boxShadow: '0 2px 16px #0002' }}>
        <h2 style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 12 }}>{mode === 'agregar' ? 'Agregar ítem' : 'Modificar ítem'}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Input placeholder="Descripción" value={form.detalle} onChange={e => setForm(f => ({ ...f, detalle: e.target.value }))} />
          <Input placeholder="Rubro" value={form.rubro} onChange={e => setForm(f => ({ ...f, rubro: e.target.value }))} />
          <Input placeholder="Duración (en meses o años)" value={form.duracion} onChange={e => setForm(f => ({ ...f, duracion: e.target.value }))} />
          <textarea placeholder="Prospecto" value={form.prospecto} onChange={e => setForm(f => ({ ...f, prospecto: e.target.value }))} style={{ borderRadius: 8, border: '1px solid #ccc', padding: 8, minHeight: 60 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSubmit}>{mode === 'agregar' ? 'Agregar' : 'Guardar'}</Button>
        </div>
      </div>
    </div>
  );
}

export default function Item() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRubro, setSelectedRubro] = useState('Todos');
  const [searchMode, setSearchMode] = useState('todos'); // 'todos' o 'descripcion'
  const [searchText, setSearchText] = useState('');
  const [prospecto, setProspecto] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [formMode, setFormMode] = useState(null); // null, 'agregar', 'modificar'
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ detalle: '', rubro: '', duracion: '', prospecto: '' });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar items');
      }
      const data = await response.json();
      setItems(data);
    } catch (error) {
      toast.error(error.message);
      console.error('Error detallado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Rubros únicos para el dropdown
  const rubros = ['Todos', ...Array.from(new Set(items.map(i => i.rubro)))];

  // Filtrado de items
  const filteredItems = items.filter(item => {
    if (selectedRubro !== 'Todos' && item.rubro !== selectedRubro) return false;
    if (searchMode === 'descripcion' && searchText) {
      return item.detalle.toLowerCase().includes(searchText.toLowerCase());
    }
    return true;
  });

  // Selección de item para mostrar prospecto
  const handleRowClick = (item) => {
    setSelectedItem(item);
    setProspecto(item.prospecto || '');
  };

  // Handlers de botones (simples, puedes conectar a la API si lo deseas)
  const handleAgregar = () => {
    setForm({ detalle: '', rubro: '', duracion: '', prospecto: '' });
    setFormMode('agregar');
    setModalOpen(true);
  };
  const handleModificar = () => {
    if (!selectedItem) return;
    setForm({
      detalle: selectedItem.detalle || '',
      rubro: selectedItem.rubro || '',
      duracion: selectedItem.duracion || '',
      prospecto: selectedItem.prospecto || '',
    });
    setFormMode('modificar');
    setModalOpen(true);
  };
  const handleEliminar = async () => {
    if (!selectedItem) return;
    if (!window.confirm('¿Seguro que deseas eliminar este ítem?')) return;
    setIsLoading(true);
    try {
      await fetch(`/api/items/${selectedItem.id_item}`, { method: 'DELETE' });
      setSelectedItem(null);
      setProspecto('');
      await fetchItems();
    } catch (e) {}
    setIsLoading(false);
  };

  // Modal submit
  const handleModalSubmit = async () => {
    setIsLoading(true);
    try {
      if (formMode === 'agregar') {
        await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else if (formMode === 'modificar' && selectedItem) {
        await fetch(`/api/items/${selectedItem.id_item}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setModalOpen(false);
      setSelectedItem(null);
      setProspecto('');
      await fetchItems();
    } catch (e) {}
    setIsLoading(false);
  };

  return (
    <div style={{ display: 'flex', height: '90vh', background: '#fff', alignItems: 'flex-start', padding: '32px 0 0 0' }}>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleModalSubmit} form={form} setForm={setForm} mode={formMode} />
      {/* Panel izquierdo: tabla */}
      <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ margin: 0, marginBottom: 10, fontWeight: 'bold', fontSize: 22, color: '#7a3e8e', letterSpacing: 1 }}>Listado de Items</h2>
        <div style={{ width: '95%', background: '#d9d9d9', borderRadius: '18px', marginTop: 0, overflow: 'hidden', border: '1px solid #a06ba5', boxShadow: '0 2px 8px #0001' }}>
          <Table>
            <TableHeader>
              <TableRow style={{ background: '#a06ba5' }}>
                <TableHead style={{ color: '#fff', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>Descripción</TableHead>
                <TableHead style={{ color: '#fff', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>Rubro</TableHead>
                <TableHead style={{ color: '#fff', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>Duración</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} style={{ textAlign: 'center', padding: 18, color: '#888' }}>No hay datos para mostrar</TableCell>
                </TableRow>
              )}
              {filteredItems.map((item, idx) => {
                const isSelected = selectedItem?.id_item === item.id_item;
                return (
                  <TableRow
                    key={item.id_item || idx}
                    onClick={() => handleRowClick(item)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? '#e1bee7' : idx % 2 === 0 ? '#f3eaf7' : '#d9d9d9',
                      borderLeft: isSelected ? '6px solid #a06ba5' : '6px solid transparent',
                      transition: 'background 0.2s, border 0.2s',
                    }}
                  >
                    <TableCell style={{ padding: '10px 8px', fontWeight: isSelected ? 'bold' : 'normal' }}>{item.detalle}</TableCell>
                    <TableCell style={{ padding: '10px 8px', fontWeight: isSelected ? 'bold' : 'normal' }}>{item.rubro}</TableCell>
                    <TableCell style={{ padding: '10px 8px', textAlign: 'center', fontWeight: isSelected ? 'bold' : 'normal' }}>
                      {item.duracion ? `${item.duracion} ${parseInt(item.duracion) === 1 ? 'Año' : 'Meses'}` : ''}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      {/* Panel derecho: filtros, búsqueda, prospecto y botones */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 0, alignSelf: 'flex-start' }}>
        {/* Filtros y búsqueda */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '16px', marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '16px' }}>
            <input type="radio" checked={searchMode === 'todos'} onChange={() => setSearchMode('todos')} style={{ accentColor: '#a06ba5', marginRight: '4px' }} />
            Todos los rubros
          </label>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '16px' }}>
            <input type="radio" checked={searchMode === 'descripcion'} onChange={() => setSearchMode('descripcion')} style={{ accentColor: '#a06ba5', marginRight: '4px' }} />
            Buscar Descripción
          </label>
          <select value={selectedRubro} onChange={e => setSelectedRubro(e.target.value)} style={{ borderRadius: '8px', padding: '4px 12px', border: '1px solid #ccc', background: '#e5e5e5', color: '#444' }}>
            {rubros.map(rubro => <option key={rubro} value={rubro}>{rubro}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '350px', marginBottom: '10px' }}>
          <Input
            placeholder="BUSCAR"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            disabled={searchMode !== 'descripcion'}
            style={{ flex: 1, background: '#e5e5e5', fontStyle: 'italic', borderRadius: '12px', border: 'none', marginRight: '8px' }}
          />
          <span style={{ fontSize: '22px', color: '#444', cursor: 'pointer' }}>🔍</span>
        </div>
        {/* Prospecto */}
        <div style={{ width: '100%', maxWidth: '420px', background: '#f7f2fa', borderRadius: '14px', border: '1px solid #a06ba5', marginBottom: '24px', boxShadow: '0 1px 6px #0001' }}>
          <div style={{ background: '#a06ba5', color: '#fff', fontStyle: 'italic', borderTopLeftRadius: '14px', borderTopRightRadius: '14px', padding: '6px 0', textAlign: 'center', fontWeight: 'bold', letterSpacing: 1 }}>
            Prospecto
          </div>
          <textarea
            value={prospecto}
            onChange={e => setProspecto(e.target.value)}
            placeholder="Aquí iría escrito manualmente el prospecto del medicamento o vacuna"
            style={{ width: '100%', minHeight: '100px', border: 'none', borderRadius: '0 0 14px 14px', background: '#f7f2fa', padding: '12px', fontStyle: 'italic', resize: 'vertical', outline: 'none', color: '#444', fontSize: 15 }}
            disabled
          />
        </div>
        {/* Botones */}
        <div style={{ display: 'flex', gap: '28px', justifyContent: 'center', width: '100%', marginTop: 8 }}>
          <Button variant="default" onClick={handleAgregar}>Agregar</Button>
          <Button variant="default" onClick={handleModificar} disabled={!selectedItem}>Modificar</Button>
          <Button variant="destructive" onClick={handleEliminar} disabled={!selectedItem}>Eliminar</Button>
        </div>
      </div>
    </div>
  );
}