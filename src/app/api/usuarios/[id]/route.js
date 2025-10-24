"use server";

import { NextResponse } from 'next/server';
import pkg from 'pg';
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
    'SELECT id_usuario FROM usuario WHERE id_usuario = $1 AND estado = true',
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
    'SELECT id_usuario FROM usuario WHERE email = $1 AND id_usuario != $2 AND estado = true',
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
  // Para actualizaciones, solo validar si los campos están presentes
  const { nombre, apellido, email } = data;
  
  // Solo validar si se están enviando estos campos
  if (nombre !== undefined && (!nombre?.trim())) {
    return {
      error: 'El nombre no puede estar vacío',
      status: 400
    };
  }
  
  if (apellido !== undefined && (!apellido?.trim())) {
    return {
      error: 'El apellido no puede estar vacío',
      status: 400
    };
  }
  
  if (email !== undefined && (!email?.trim())) {
    return {
      error: 'El email no puede estar vacío',
      status: 400
    };
  }
  
  // Validar formato de email si se proporciona
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return {
      error: 'El formato del email no es válido',
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
    const { id } = await params;

    const result = await client.query(
      `SELECT id_usuario, usuario, nombre, apellido, email, telefono, 
              calle, numero, codigo_postal, tipo_usuario, foto, estado
       FROM usuario 
       WHERE id_usuario = $1 AND estado = true`,
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
    const { id } = await params;
    
    // Manejar tanto FormData como JSON
    let body;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        id_usuario: formData.get('id_usuario'),
        usuario: formData.get('usuario'),
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido'),
        email: formData.get('email'),
        telefono: formData.get('telefono'),
        calle: formData.get('calle'),
        numero: formData.get('numero'),
        codigo_postal: formData.get('codigo_postal'),
        tipo_usuario: formData.get('tipo_usuario'),
        password: formData.get('contrasenia') || formData.get('password')
      };
      
      // Manejar foto
      const fotoFile = formData.get('foto');
      if (fotoFile?.size > 0) {
        const buffer = await fotoFile.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        body.foto = `data:${fotoFile.type};base64,${base64}`;
      }
    } else {
      body = await request.json();
    }
    
    const { 
      email, 
      usuario,
      password
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

    // Construir query dinámico para actualizar solo los campos proporcionados
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fields = [
      { key: 'nombre', column: 'nombre' },
      { key: 'apellido', column: 'apellido' },
      { key: 'email', column: 'email' },
      { key: 'telefono', column: 'telefono' },
      { key: 'calle', column: 'calle' },
      { key: 'numero', column: 'numero' },
      { key: 'codigo_postal', column: 'codigo_postal' },
      { key: 'foto', column: 'foto' },
      { key: 'tipo_usuario', column: 'tipo_usuario' },
      { key: 'estado', column: 'estado' }
    ];

    fields.forEach(field => {
      if (body[field.key] !== undefined) {
        updates.push(`${field.column} = $${paramIndex++}`);
        values.push(body[field.key]);
      }
    });

    // Manejar contraseña por separado para cifrarla
    if (password !== undefined && password !== null && password !== '') {
      const bcrypt = await import('bcryptjs');
      const contraseniaCifrada = await bcrypt.hash(String(password), 12);
      updates.push(`contrasenia = $${paramIndex++}`);
      values.push(contraseniaCifrada);
    }

    // Actualizar usuario si se proporciona
    if (usuario !== undefined) {
      updates.push(`usuario = $${paramIndex++}`);
      values.push(usuario);
    } else if (email !== undefined) {
      // Si no se proporciona usuario pero sí email, generar uno del email
      updates.push(`usuario = $${paramIndex++}`);
      values.push(email.split('@')[0].toLowerCase());
    }

    if (updates.length === 0) {
      return NextResponse.json({ 
        error: 'No hay campos para actualizar' 
      }, { status: 400 });
    }

    values.push(id);
    const result = await client.query(
      `UPDATE usuario 
       SET ${updates.join(', ')}
       WHERE id_usuario = $${paramIndex} AND estado = true
       RETURNING id_usuario, usuario, nombre, apellido, email, telefono, 
                 calle, numero, codigo_postal, tipo_usuario, foto, estado`,
      values
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
    const { id } = await params;

    // Verificar que el usuario existe
    if (!(await userExists(client, id))) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado' 
      }, { status: 404 });
    }

    // Proceder con el borrado lógico
    await client.query(
      'UPDATE usuario SET estado = false WHERE id_usuario = $1',
      [id]
    );

    return NextResponse.json({
      message: 'Usuario desactivado exitosamente'
    }, { status: 200 });
  });
}
