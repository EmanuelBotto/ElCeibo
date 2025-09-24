"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

// ========================================
// CONFIGURACIÓN DE BASE DE DATOS
// ========================================
const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({ connectionString });

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Maneja la conexión a la base de datos con try-catch
 * @param {Function} operation - Función que ejecuta la operación con la base de datos
 * @returns {Promise<NextResponse>} - Respuesta de la API
 */
async function handleDatabaseOperation(operation) {
  let client;
  try {
    client = await pool.connect();
    return await operation(client);
  } catch (err) {
    console.error('Error en operación de base de datos:', err);
    return NextResponse.json({ 
      error: 'Error en el servidor: ' + err.message 
    }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Verifica si un usuario existe en la base de datos
 * @param {Object} client - Cliente de base de datos
 * @param {string} id - ID del usuario
 * @returns {Promise<boolean>} - True si existe, false si no
 */
async function userExists(client, id) {
  const result = await client.query(
    'SELECT id_usuario FROM usuario WHERE id_usuario = $1',
    [id]
  );
  return result.rows.length > 0;
}

/**
 * Verifica si un email ya está en uso por otro usuario
 * @param {Object} client - Cliente de base de datos
 * @param {string} email - Email a verificar
 * @param {string} currentUserId - ID del usuario actual
 * @returns {Promise<boolean>} - True si está en uso, false si no
 */
async function emailInUse(client, email, currentUserId) {
  const result = await client.query(
    'SELECT id_usuario FROM usuario WHERE email = $1 AND id_usuario != $2',
    [email.trim(), currentUserId]
  );
  return result.rows.length > 0;
}

/**
 * Valida los datos requeridos para actualizar un usuario
 * @param {Object} data - Datos del usuario
 * @returns {Object|null} - Objeto con error si hay validación fallida, null si es válido
 */
function validateUserData(data) {
  const { nombre, apellido, email } = data;
  
  if (!nombre?.trim() || !apellido?.trim() || !email?.trim()) {
    return {
      error: 'Nombre, apellido y email son requeridos',
      status: 400
    };
  }
  
  return null;
}

// ========================================
// ENDPOINTS DE LA API
// ========================================

/**
 * GET /api/usuarios/[id] - Obtener usuario específico
 */
export async function GET(request, { params }) {
  return handleDatabaseOperation(async (client) => {
    const { id } = params;

    const result = await client.query(
      `SELECT id_usuario, usuario, nombre, apellido, email, telefono, 
              calle, numero, codigo_postal, tipo_usuario, foto
       FROM usuario 
       WHERE id_usuario = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado' 
      }, { status: 404 });
    }

    return NextResponse.json({
      user: result.rows[0]
    }, { status: 200 });
  });
}

/**
 * PUT /api/usuarios/[id] - Actualizar usuario
 */
export async function PUT(request, { params }) {
  return handleDatabaseOperation(async (client) => {
    const { id } = params;
    const body = await request.json();
    const { 
      nombre, 
      apellido, 
      email, 
      telefono, 
      tipo_usuario 
    } = body;

    // Validar datos requeridos
    const validationError = validateUserData(body);
    if (validationError) {
      return NextResponse.json({ 
        error: validationError.error 
      }, { status: validationError.status });
    }

    // Verificar que el usuario existe
    if (!(await userExists(client, id))) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado' 
      }, { status: 404 });
    }

    // Verificar que el email no esté en uso por otro usuario
    if (await emailInUse(client, email, id)) {
      return NextResponse.json({ 
        error: 'El email ya está registrado por otro usuario' 
      }, { status: 409 });
    }

    // Actualizar usuario
    const result = await client.query(
      `UPDATE usuario 
       SET nombre = $1, apellido = $2, email = $3, telefono = $4, tipo_usuario = $5
       WHERE id_usuario = $6
       RETURNING id_usuario, usuario, nombre, apellido, email, telefono, 
                 calle, numero, codigo_postal, tipo_usuario, foto`,
      [
        nombre.trim(),
        apellido.trim(),
        email.trim(),
        telefono?.trim() || null,
        tipo_usuario || 'asistente',
        id
      ]
    );

    const updatedUser = result.rows[0];

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser
    }, { status: 200 });
  });
}

/**
 * DELETE /api/usuarios/[id] - Eliminar usuario
 */
export async function DELETE(request, { params }) {
  return handleDatabaseOperation(async (client) => {
    const { id } = params;

    // Verificar que el usuario existe
    if (!(await userExists(client, id))) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado' 
      }, { status: 404 });
    }

    // Eliminar usuario
    await client.query(
      'DELETE FROM usuario WHERE id_usuario = $1',
      [id]
    );

    return NextResponse.json({
      message: 'Usuario eliminado exitosamente'
    }, { status: 200 });
  });
} 