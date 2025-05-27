import { NextResponse } from 'next/server';
import pkg from 'pg';

const { Client } = pkg;

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

async function getClient() {
  const client = new Client({ connectionString });
  await client.connect();
  return client;
}

// DELETE: Eliminar producto por ID
export async function DELETE(_, { params }) {
  const { id } = params;

  try {
    const client = await getClient();
    await client.query('DELETE FROM productos WHERE id = $1', [id]);
    await client.end();
    return NextResponse.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
  }
}
