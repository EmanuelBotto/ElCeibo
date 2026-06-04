import { NextResponse } from "next/server";
import pkg from "pg";

const { Pool } = pkg;

const connectionString =
  "postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({ connectionString });

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT id_tipo, nombre, porcentaje_final, porcentaje_mayorista
        FROM tipo
        ORDER BY id_tipo
      `);

      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error en GET /product-types:", err);
    return NextResponse.json(
      { error: "Error al obtener tipos de producto: " + err.message },
      { status: 500 }
    );
  }
}
