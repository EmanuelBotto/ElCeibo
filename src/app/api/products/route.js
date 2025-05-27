import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

// Crear pool global para reutilizar conexiones entre requests
const pool = new Pool({ connectionString });

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM producto');
      return NextResponse.json(result.rows);
    } finally {
      client.release(); // liberar conexión al pool
    }
  } catch (err) {
    console.error('Error en API /products:', err);
    return NextResponse.json({ error: 'Error en la base de datos' }, { status: 500 });
  }
}
