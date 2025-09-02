"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

export async function GET(request, { params }) {
  const { id } = await params; // id de la mascota

  try {
    const client = await pool.connect();
    try {
      // 1. Obtener datos de la mascota
      const mascotaRes = await client.query('SELECT * FROM mascota WHERE id_mascota = $1', [id]);
      if (mascotaRes.rows.length === 0) {
        return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404 });
      }
      const mascota = mascotaRes.rows[0];
      const id_cliente = mascota.id_cliente;

      // 2. Obtener datos del cliente (dueño)
      const clienteRes = await client.query('SELECT * FROM cliente WHERE id_clinete = $1', [id_cliente]);
      const owner = clienteRes.rows.length > 0 ? clienteRes.rows[0] : null;

      // 3. Obtener otras mascotas del mismo cliente
      const otrasMascotasRes = await client.query(
        'SELECT id_mascota, nombre, especie, raza FROM mascota WHERE id_cliente = $1 AND id_mascota != $2 ORDER BY nombre',
        [id_cliente, id]
      );
      const otrasMascotas = otrasMascotasRes.rows;
      
      // 4. (Placeholder) Obtener historial médico y vacunas
      // Esto se implementará cuando tengamos las tablas correspondientes
      const historialMedico = [];
      const proximasVacunas = [];

      // 5. Combinar todo en una respuesta
      const fichaCompleta = {
        mascota,
        owner,
        otrasMascotas,
        historialMedico,
        proximasVacunas,
      };

      return NextResponse.json(fichaCompleta);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`Error en API /fichas-paciente/${id}:`, err);
    return NextResponse.json({ error: 'Error en la base de datos: ' + err.message }, { status: 500 });
  }
} 