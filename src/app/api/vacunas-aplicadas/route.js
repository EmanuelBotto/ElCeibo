"use server";
import { NextResponse } from "next/server";
import pkg from "pg";
const { Pool } = pkg;
const connectionString =
  "postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString });

export async function GET(request) {
  let client;
  try {
    client = await pool.connect();
    const { searchParams } = new URL(request.url);
    const id_mascota = searchParams.get("id_mascota");
    let result;
    if (id_mascota) {
      result = await client.query(
        "SELECT * FROM vacuna_aplicada WHERE id_mascota = $1 ORDER BY fecha_aplicacion DESC",
        [id_mascota]
      );
    } else {
      result = await client.query(
        "SELECT * FROM vacuna_aplicada ORDER BY fecha_aplicacion DESC"
      );
    }
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

export async function POST(request) {
  let client;
  try {
    client = await pool.connect();
    const body = await request.json();
    console.log("Datos recibidos en POST /api/vacunas-aplicadas:", body);

    const {
      id_mascota,
      id_visita,
      nombre_vacuna,
      fecha_aplicacion,
      duracion_meses,
      observaciones,
    } = body;

    // Validar campos requeridos
    if (!id_mascota || !nombre_vacuna || !fecha_aplicacion || !duracion_meses) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Convertir tipos de datos para asegurar compatibilidad
    const idMascotaNum = parseInt(id_mascota);
    const duracionMesesNum = parseInt(duracion_meses);

    console.log(
      "Buscando visita existente para fecha:",
      fecha_aplicacion,
      "mascota:",
      idMascotaNum
    );

    // Buscar si ya existe una visita para esta mascota en esta fecha
    let visitaResult = await client.query(
      "SELECT id_visita FROM visita WHERE id_mascota = $1 AND fecha = $2 LIMIT 1",
      [idMascotaNum, fecha_aplicacion]
    );

    let idVisitaFinal;

    if (visitaResult.rows.length > 0) {
      // Usar la visita existente
      idVisitaFinal = visitaResult.rows[0].id_visita;
      console.log("Usando visita existente con ID:", idVisitaFinal);
    } else {
      // Crear nueva visita para esta fecha
      console.log("Creando nueva visita para fecha:", fecha_aplicacion);
      const nuevaVisitaResult = await client.query(
        `INSERT INTO visita (id_mascota, fecha, diagnostico, frecuencia_cardiaca, frecuencia_respiratoria, peso, id_usuario)
          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_visita`,
        [
          idMascotaNum,
          fecha_aplicacion,
          `Visita médica - ${fecha_aplicacion}`,
          0, // Valores por defecto
          0,
          null, // Peso no disponible
          1, // Usuario por defecto
        ]
      );
      idVisitaFinal = nuevaVisitaResult.rows[0].id_visita;
      console.log("Nueva visita creada con ID:", idVisitaFinal);
    }

    console.log("Ejecutando consulta de vacuna con id_visita:", idVisitaFinal);

    const result = await client.query(
      `INSERT INTO vacuna_aplicada (id_mascota, id_visita, nombre_vacuna, fecha_aplicacion, duracion_meses, observaciones)
              VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        idMascotaNum,
        idVisitaFinal,
        nombre_vacuna,
        fecha_aplicacion,
        duracionMesesNum,
        observaciones || "",
      ]
    );

    console.log("Vacuna insertada exitosamente:", result.rows[0]);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error detallado en POST /api/vacunas-aplicadas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
