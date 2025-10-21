"use server";

import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { hasPermission } from "../../../lib/permisos";

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

// Función para cifrar contraseñas
const hashPassword = async (password) => {
    const saltRounds = 12; // Nivel de seguridad alto
    return await bcrypt.hash(password, saltRounds);
};

// Función para verificar contraseñas (para uso futuro)
// const verifyPassword = async (password, hashedPassword) => {
//     return await bcrypt.compare(password, hashedPassword);
// };

// Función para verificar credenciales de login (para uso futuro)
// const verifyCredentials = async (email, password) => {
//     try {
//         const result = await pool.query(`
//             SELECT id_usuario, nombre, apellido, email, contrasenia, tipo_usuario, usuario
//             FROM usuario 
//             WHERE email = $1
//         `, [email]);

//         if (result.rows.length === 0) {
//             return { success: false, message: 'Usuario no encontrado' };
//         }

//         const user = result.rows[0];
//         const isValidPassword = await verifyPassword(password, user.contrasenia);

//         if (!isValidPassword) {
//             return { success: false, message: 'Contraseña incorrecta' };
//         }

//         // No devolver la contraseña cifrada
//         const { contrasenia, ...userWithoutPassword } = user;
//         return { success: true, user: userWithoutPassword };
//     } catch (err) {
//         console.error('Error al verificar credenciales:', err);
//         return { success: false, message: 'Error interno del servidor' };
//     }
// };

// Funciones auxiliares
const createResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
};

// Función para verificar permisos (simplificada para este ejemplo)
const checkUserPermission = (userType, permission) => {
    if (!userType) {
        return { error: 'Usuario no autenticado', status: 401 };
    }
    
    if (!hasPermission(userType, permission)) {
        return { error: 'No tienes permisos para realizar esta acción', status: 403 };
    }
    
    return null;
};

const parseRequestData = async (request) => {
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
        const formData = await request.formData();
        const data = {
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
            data.foto = `data:${fotoFile.type};base64,${base64}`;
        }
        
        return data;
    }
    
    return await request.json();
};

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validateUserData = (data, isUpdate = false) => {
    if (!isUpdate && (!data.nombre || !data.apellido || !data.email || !data.tipo_usuario)) {
        return 'Nombre, apellido, email y tipo de usuario son requeridos';
    }
    
    if (!isUpdate && !data.password) {
        return 'La contraseña es requerida';
    }
    
    if (isUpdate && !data.id_usuario) {
        return 'ID de usuario es requerido';
    }
    
    if (data.email && !validateEmail(data.email)) {
        return 'El formato del email no es válido';
    }
    
    if (data.password && data.password.length < 6) {
        return 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (data.telefono && isNaN(data.telefono)) {
        return 'El teléfono debe ser un número válido';
    }
    
    if (data.numero && isNaN(data.numero)) {
        return 'El número de dirección debe ser un número válido';
    }
    
    if (data.codigo_postal && isNaN(data.codigo_postal)) {
        return 'El código postal debe ser un número válido';
    }
    
    if (data.foto && data.foto.length > 7 * 1024 * 1024) {
        return 'La imagen es demasiado grande. Máximo 5MB.';
    }
    
    return null;
};

const checkUserExists = async (email, usuario, excludeId = null) => {
    try {
        let query = 'SELECT id_usuario, email, usuario FROM usuario WHERE email = $1 OR usuario = $2';
        let params = [email, usuario];
        
        if (excludeId) {
            query += ' AND id_usuario != $3';
            params.push(excludeId);
        }
        
        const result = await pool.query(query, params);
        
        if (result.rows.length > 0) {
            const existingUser = result.rows[0];
            if (existingUser.email === email) {
                return 'El email ya está registrado';
            }
            if (existingUser.usuario === usuario) {
                return 'El nombre de usuario ya está en uso';
            }
        }
        
        return null;
    } catch (err) {
        console.error('Error al verificar usuario existente:', err);
        return 'Error al verificar datos del usuario';
    }
};

// GET - Obtener todos los usuarios
export async function GET(request) {
    try {
        // Obtener el tipo de usuario desde los headers (implementar según tu sistema de auth)
        const userType = request.headers.get('x-user-type') || 'admin'; // Temporal para testing
        
        // Verificar permisos - solo admin puede ver todos los usuarios
        const permissionCheck = checkUserPermission(userType, 'usuarios:gestionar');
        if (permissionCheck) {
            return createResponse({ error: permissionCheck.error }, permissionCheck.status);
        }
        
        const result = await pool.query(`
            SELECT id_usuario, nombre, apellido, email, telefono, calle, numero, codigo_postal, foto, tipo_usuario, usuario, estado
            FROM usuario 
            WHERE estado = true
            ORDER BY apellido, nombre
            LIMIT 100
        `);

        const usuarios = result.rows.map(usuario => ({
            ...usuario,
            foto: usuario.foto?.startsWith('data:') ? usuario.foto : 
                  usuario.foto ? `data:image/jpeg;base64,${usuario.foto}` : null
        }));

        return createResponse({ users: usuarios });
    } catch (err) {
        console.error('Error al obtener usuarios:', err);
        return createResponse({ 
            error: 'Error interno del servidor',
            details: err.message 
        }, 500);
    }
}

// POST - Crear nuevo usuario
export async function POST(request) {
    try {
        // Obtener el tipo de usuario desde los headers
        const userType = request.headers.get('x-user-type') || 'admin'; // Temporal para testing
        
        // Verificar permisos - solo admin puede crear usuarios
        const permissionCheck = checkUserPermission(userType, 'usuarios:gestionar');
        if (permissionCheck) {
            return createResponse({ error: permissionCheck.error }, permissionCheck.status);
        }

        const data = await parseRequestData(request);
        
        const error = validateUserData(data);
        
        if (error) {
            return createResponse({ error }, 400);
        }

        const { nombre, apellido, email, telefono, calle, numero, codigo_postal, foto, tipo_usuario, password, usuario: usuarioIngresado } = data;
        // Usar el usuario ingresado exactamente como se escribió o generar uno del email
        const usuario = usuarioIngresado || email.split('@')[0];

        // Verificar si el usuario ya existe
        const userExistsError = await checkUserExists(email, usuario);
        if (userExistsError) {
            return createResponse({ error: userExistsError }, 400);
        }
        
        // Cifrar la contraseña
        const contraseniaCifrada = await hashPassword(password);

        const result = await pool.query(`
            INSERT INTO usuario (nombre, apellido, email, telefono, calle, numero, codigo_postal, foto, tipo_usuario, contrasenia, usuario, estado)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id_usuario
        `, [nombre, apellido, email, telefono, calle || '', numero || 0, codigo_postal || 0, foto, tipo_usuario, contraseniaCifrada, usuario, true]);

        return createResponse({ 
            success: true, 
            id: result.rows[0].id_usuario,
            message: 'Usuario creado exitosamente'
        }, 201);

    } catch (err) {
        console.error('Error al crear usuario:', err);
        
        if (err.code === '23505' && err.constraint?.includes('email')) {
            return createResponse({ error: 'El email ya está registrado' }, 400);
        }

        return createResponse({ 
            error: 'Error interno del servidor',
            details: err.message 
        }, 500);
    }
}

// PUT - Actualizar usuario existente
export async function PUT(request) {
    try {
        // Obtener el tipo de usuario desde los headers
        const userType = request.headers.get('x-user-type') || 'admin'; // Temporal para testing
        
        // Verificar permisos - solo admin puede actualizar usuarios
        const permissionCheck = checkUserPermission(userType, 'usuarios:gestionar');
        if (permissionCheck) {
            return createResponse({ error: permissionCheck.error }, permissionCheck.status);
        }

        const data = await parseRequestData(request);
        const error = validateUserData(data, true);
        
        if (error) {
            return createResponse({ error }, 400);
        }

        const { id_usuario, email } = data;

        // Verificar si el email o usuario ya existen (excluyendo el usuario actual)
        if (email) {
            const usuario = email.split('@')[0].toLowerCase();
            const userExistsError = await checkUserExists(email, usuario, id_usuario);
            if (userExistsError) {
                return createResponse({ error: userExistsError }, 400);
            }
        }

        // Construir query dinámico
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
            if (data[field.key] !== undefined) {
                updates.push(`${field.column} = $${paramIndex++}`);
                values.push(data[field.key]);
            }
        });

        // Manejar contraseña por separado para cifrarla
        if (data.password !== undefined) {
            const contraseniaCifrada = await hashPassword(data.password);
            updates.push(`contrasenia = $${paramIndex++}`);
            values.push(contraseniaCifrada);
        }

        // Actualizar usuario si cambia email o se proporciona un usuario
        if (email !== undefined || data.usuario !== undefined) {
            updates.push(`usuario = $${paramIndex++}`);
            const nuevoUsuario = data.usuario || email.split('@')[0].toLowerCase();
            values.push(nuevoUsuario);
        }

        if (updates.length === 0) {
            return createResponse({ error: 'No hay campos para actualizar' }, 400);
        }

        values.push(id_usuario);
        const result = await pool.query(`
            UPDATE usuario 
            SET ${updates.join(', ')}
            WHERE id_usuario = $${paramIndex} AND estado = true
            RETURNING id_usuario
        `, values);

        if (result.rowCount === 0) {
            return createResponse({ error: 'Usuario no encontrado' }, 404);
        }

        return createResponse({ 
            success: true, 
            message: 'Usuario actualizado exitosamente'
        });

    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        return createResponse({ 
            error: 'Error interno del servidor',
            details: err.message 
        }, 500);
    }
}

// DELETE - Eliminar usuario
export async function DELETE(request) {
    try {
        // Obtener el tipo de usuario desde los headers
        const userType = request.headers.get('x-user-type') || 'admin'; // Temporal para testing
        
        // Verificar permisos - solo admin puede eliminar usuarios
        const permissionCheck = checkUserPermission(userType, 'usuarios:gestionar');
        if (permissionCheck) {
            return createResponse({ error: permissionCheck.error }, permissionCheck.status);
        }

        const { id_usuario } = await request.json();
        
        if (!id_usuario) {
            return createResponse({ error: 'ID de usuario es requerido' }, 400);
        }

        const result = await pool.query(`
            UPDATE usuario 
            SET estado = false 
            WHERE id_usuario = $1 AND estado = true
        `, [id_usuario]);

        if (result.rowCount === 0) {
            return createResponse({ error: 'Usuario no encontrado' }, 404);
        }

        return createResponse({ 
            success: true, 
            message: 'Usuario desactivado exitosamente'
        });

    } catch (err) {
        console.error('Error al eliminar usuario:', err);
        return createResponse({ error: 'Error interno del servidor' }, 500);
    }
} 