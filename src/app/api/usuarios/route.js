"use server";

import { Pool } from "pg";

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

// GET - Obtener todos los usuarios
export async function GET() {
    try {
        
        // Primero verificar qué tablas existen
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%usuario%' OR table_name LIKE '%user%'
            ORDER BY table_name;
        `);
        
        // Verificar si la tabla usuario existe
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'usuario'
            );
        `);
        
        if (!tableExists.rows[0].exists) {
            // Intentar con otras posibles variaciones
            const altTables = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND (table_name = 'usuarios' OR table_name = 'users' OR table_name = 'usuario')
                ORDER BY table_name;
            `);
            throw new Error('La tabla usuario no existe. Tablas disponibles: ' + tables.rows.map(r => r.table_name).join(', '));
        }
        
        // Primero verificar las columnas de la tabla
        const columns = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'usuario' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        const result = await pool.query(`
            SELECT 
                id_usuario,
                nombre,
                apellido,
                email,
                telefono,
                calle,
                numero,
                codigo_postal,
                foto,
                tipo_usuario,
                usuario
            FROM usuario 
            ORDER BY apellido, nombre
            LIMIT 100
        `);

        
        // Procesar usuarios (la foto ya está en formato TEXT, no necesita conversión)
        const usuariosProcesados = result.rows.map(usuario => ({
            ...usuario,
            // Si la foto está en base64, agregar el prefijo data:image si no lo tiene
            foto: usuario.foto ? 
                (usuario.foto.startsWith('data:') ? usuario.foto : `data:image/jpeg;base64,${usuario.foto}`) : 
                null
        }));

        return new Response(JSON.stringify({ users: usuariosProcesados }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('❌ Error al obtener usuarios:', err);
        
        return new Response(JSON.stringify({ 
            error: 'Error interno del servidor',
            details: err.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// POST - Crear nuevo usuario
export async function POST(request) {
    try {
        const { nombre, apellido, email, telefono, direccion, foto, tipo_usuario, password } = await request.json();
        
        // Validaciones básicas
        if (!nombre || !apellido || !email || !tipo_usuario) {
            return new Response(JSON.stringify({ error: 'Nombre, apellido, email y tipo de usuario son requeridos' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validar tamaño de la foto (máximo 5MB en Base64)
        if (foto && foto.length > 7 * 1024 * 1024) { // ~5MB en Base64
            return new Response(JSON.stringify({ error: 'La imagen es demasiado grande. Máximo 5MB.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Convertir Base64 a Buffer para almacenar como BYTEA
        let fotoBuffer = null;
        if (foto) {
            // Remover el prefijo data:image/...;base64, si existe
            const base64Data = foto.includes(',') ? foto.split(',')[1] : foto;
            fotoBuffer = Buffer.from(base64Data, 'base64');
        }

        // Insertar en la base de datos
        const result = await pool.query(`
            INSERT INTO usuario (nombre, apellido, email, telefono, direccion, foto, tipo_usuario, password, fecha_registro)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id_usuario
        `, [nombre, apellido, email, telefono, direccion, fotoBuffer, tipo_usuario, password]);

        return new Response(JSON.stringify({ 
            success: true, 
            id: result.rows[0].id_usuario,
            message: 'Usuario creado exitosamente'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Error al crear usuario:', err);
        
        // Verificar si es un error de email duplicado
        if (err.code === '23505' && err.constraint?.includes('email')) {
            return new Response(JSON.stringify({ error: 'El email ya está registrado' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// PUT - Actualizar usuario existente
export async function PUT(request) {
    try {
        const { id_usuario, nombre, apellido, email, telefono, direccion, foto, tipo_usuario, password } = await request.json();
        
        if (!id_usuario) {
            return new Response(JSON.stringify({ error: 'ID de usuario es requerido' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validar tamaño de la foto
        if (foto && foto.length > 7 * 1024 * 1024) {
            return new Response(JSON.stringify({ error: 'La imagen es demasiado grande. Máximo 5MB.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Convertir Base64 a Buffer para almacenar como BYTEA
        let fotoBuffer = null;
        if (foto) {
            // Remover el prefijo data:image/...;base64, si existe
            const base64Data = foto.includes(',') ? foto.split(',')[1] : foto;
            fotoBuffer = Buffer.from(base64Data, 'base64');
        }

        // Construir query dinámico para campos opcionales
        let updateFields = [];
        let values = [];
        let paramIndex = 1;

        if (nombre !== undefined) {
            updateFields.push(`nombre = $${paramIndex++}`);
            values.push(nombre);
        }
        if (apellido !== undefined) {
            updateFields.push(`apellido = $${paramIndex++}`);
            values.push(apellido);
        }
        if (email !== undefined) {
            updateFields.push(`email = $${paramIndex++}`);
            values.push(email);
        }
        if (telefono !== undefined) {
            updateFields.push(`telefono = $${paramIndex++}`);
            values.push(telefono);
        }
        if (direccion !== undefined) {
            updateFields.push(`direccion = $${paramIndex++}`);
            values.push(direccion);
        }
        if (foto !== undefined) {
            updateFields.push(`foto = $${paramIndex++}`);
            values.push(fotoBuffer);
        }
        if (tipo_usuario !== undefined) {
            updateFields.push(`tipo_usuario = $${paramIndex++}`);
            values.push(tipo_usuario);
        }
        if (password !== undefined) {
            updateFields.push(`password = $${paramIndex++}`);
            values.push(password);
        }

        if (updateFields.length === 0) {
            return new Response(JSON.stringify({ error: 'No hay campos para actualizar' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        values.push(id_usuario);
        const query = `
            UPDATE usuario 
            SET ${updateFields.join(', ')}
            WHERE id_usuario = $${paramIndex}
            RETURNING id_usuario
        `;

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Usuario actualizado exitosamente'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE - Eliminar usuario
export async function DELETE(request) {
    try {
        const { id_usuario } = await request.json();
        
        if (!id_usuario) {
            return new Response(JSON.stringify({ error: 'ID de usuario es requerido' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await pool.query(`
            DELETE FROM usuario 
            WHERE id_usuario = $1
        `, [id_usuario]);

        if (result.rowCount === 0) {
            return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Usuario eliminado exitosamente'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Error al eliminar usuario:', err);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 