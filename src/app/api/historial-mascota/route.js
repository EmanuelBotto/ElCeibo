"use server";
import { NextResponse } from "next/server";
import pkg from "pg";
const { Pool } = pkg;
const connectionString =
  "postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString });

export async function POST(request) {
  let client;
  try {
    client = await pool.connect();
    const body = await request.json();

    const {
      id_mascota,
      fecha,
      diagnostico,
      frecuencia_cardiaca,
      frecuencia_respiratoria,
      peso,
      id_usuario = 1, // Por defecto, se puede obtener del contexto de autenticación
    } = body;

    // Validar datos requeridos
    if (!id_mascota || !fecha) {
      return NextResponse.json(
        { error: "ID de mascota y fecha son requeridos" },
        { status: 400 }
      );
    }

    // Convertir cadenas vacías a valores por defecto para campos requeridos
    const frecuenciaCardiaca =
      frecuencia_cardiaca && String(frecuencia_cardiaca).trim() !== ""
        ? parseInt(frecuencia_cardiaca)
        : 0; // Valor por defecto para frecuencia cardíaca
    const frecuenciaRespiratoria =
      frecuencia_respiratoria && String(frecuencia_respiratoria).trim() !== ""
        ? parseInt(frecuencia_respiratoria)
        : 0; // Valor por defecto para frecuencia respiratoria

    // Si no se proporciona peso, obtener el último peso registrado
    let pesoNumero = null;
    if (peso && String(peso).trim() !== "") {
      pesoNumero = parseFloat(peso);
    } else {
      // Buscar el último peso registrado para esta mascota
      const ultimoPesoResult = await client.query(
        "SELECT peso FROM visita WHERE id_mascota = $1 AND peso IS NOT NULL ORDER BY fecha DESC LIMIT 1",
        [id_mascota]
      );
      if (ultimoPesoResult.rows.length > 0) {
        pesoNumero = ultimoPesoResult.rows[0].peso;
      }
    }

    // Insertar nueva visita
    const result = await client.query(
      `
            INSERT INTO visita (
                id_mascota, 
                fecha, 
                diagnostico, 
                frecuencia_cardiaca, 
                frecuencia_respiratoria, 
                peso,
                id_usuario
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `,
      [
        id_mascota,
        fecha,
        diagnostico,
        frecuenciaCardiaca,
        frecuenciaRespiratoria,
        pesoNumero,
        id_usuario,
      ]
    );

    const nuevaVisita = result.rows[0];

    // Obtener información del usuario que atendió
    const usuarioResult = await client.query(
      "SELECT nombre, apellido FROM usuario WHERE id_usuario = $1",
      [id_usuario]
    );

    const usuario = usuarioResult.rows[0];
    const visitaCompleta = {
      ...nuevaVisita,
      nombre: usuario?.nombre || "",
      apellido: usuario?.apellido || "",
      vacunas: [], // Las vacunas se agregan por separado
    };

    return NextResponse.json(visitaCompleta, { status: 201 });
  } catch (error) {
    console.error("Error al crear visita:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

export async function PUT(request) {
  let client;
  try {
    client = await pool.connect();
    const body = await request.json();

    const {
      id_visita,
      fecha,
      diagnostico,
      frecuencia_cardiaca,
      frecuencia_respiratoria,
      peso,
    } = body;

    // Validar datos requeridos
    if (!id_visita || !fecha) {
      return NextResponse.json(
        { error: "ID de visita y fecha son requeridos" },
        { status: 400 }
      );
    }

    // Convertir cadenas vacías a valores por defecto para campos requeridos
    const frecuenciaCardiaca =
      frecuencia_cardiaca && String(frecuencia_cardiaca).trim() !== ""
        ? parseInt(frecuencia_cardiaca)
        : 0; // Valor por defecto para frecuencia cardíaca
    const frecuenciaRespiratoria =
      frecuencia_respiratoria && String(frecuencia_respiratoria).trim() !== ""
        ? parseInt(frecuencia_respiratoria)
        : 0; // Valor por defecto para frecuencia respiratoria
    const pesoNumero =
      peso && String(peso).trim() !== "" ? parseFloat(peso) : null;

    // Actualizar visita
    const result = await client.query(
      `
            UPDATE visita SET
                fecha = $1,
                diagnostico = $2,
                frecuencia_cardiaca = $3,
                frecuencia_respiratoria = $4,
                peso = $5
            WHERE id_visita = $6
            RETURNING *
        `,
      [
        fecha,
        diagnostico,
        frecuenciaCardiaca,
        frecuenciaRespiratoria,
        pesoNumero,
        id_visita,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Visita no encontrada" },
        { status: 404 }
      );
    }

    const visitaActualizada = result.rows[0];

    // Obtener información del usuario que atendió
    const usuarioResult = await client.query(
      "SELECT nombre, apellido FROM usuario WHERE id_usuario = $1",
      [visitaActualizada.id_usuario]
    );

    const usuario = usuarioResult.rows[0];
    const visitaCompleta = {
      ...visitaActualizada,
      nombre: usuario?.nombre || "",
      apellido: usuario?.apellido || "",
      vacunas: [], // Las vacunas se obtienen por separado
    };

    return NextResponse.json(visitaCompleta);
  } catch (error) {
    console.error("Error al actualizar visita:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
