"use server";
import { NextResponse } from "next/server";
import pkg from "pg";

const { Pool } = pkg;

const connectionString =
  "postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString });

export async function GET() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query("SELECT * FROM item ORDER BY detalle");
    console.log("Items obtenidos de la BD:", result.rows);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener items:", error);
    return NextResponse.json(
      { error: "Error al obtener los items: " + error.message },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

export async function POST(request) {
  let client;
  try {
    client = await pool.connect();
    const body = await request.json();
    const result = await client.query(
      `
            INSERT INTO item (rubro, detalle, prospecto, duracion_meses) 
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
      [body.rubro, body.detalle, body.prospecto, body.duracion_meses]
    );

    return NextResponse.json({
      message: "Item creado exitosamente",
      item: result.rows[0],
    });
  } catch (error) {
    console.error("Error al crear item:", error);
    return NextResponse.json(
      { error: "Error al crear el item: " + error.message },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
