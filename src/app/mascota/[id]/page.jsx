"use client";

import FichaPaciente from '@/app/mascota/ficha-paciente';
import { useParams } from 'next/navigation';

export default function MascotaDetailPage() {
  const params = useParams();
  const id  = params?.id;

  if (!id) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return <FichaPaciente mascotaId={Array.isArray(id) ? id[0] : id} />;
} 