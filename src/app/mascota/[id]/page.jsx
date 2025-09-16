"use client";

import FichaPaciente from '@/app/Ventana/ficha-paciente';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MascotaDetailPage() {
  const params = useParams();
  const id  = params?.id;

  if (!id) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen">Cargando...</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <FichaPaciente mascotaId={Array.isArray(id) ? id[0] : id} />
    </ProtectedRoute>
  );
} 