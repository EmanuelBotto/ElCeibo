"use server";

import { Pool } from "pg";

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

// GET - Obtener todas las mascotas
export async function GET() {
    try {
        const result = await pool.query(`
            SELECT 
                id_mascota,
                nombre,
                especie,
                raza,
                sexo,
                edad,
                peso,
                foto,
                estado_reproductivo,
                dia,
                mes,
                anio,
                id_cliente
            FROM mascota 
            ORDER BY nombre
            LIMIT 100
        `);

        // Convertir las fotos BYTEA a Base64 para el frontend
        const mascotasConFotos = result.rows.map((mascota, index) => {
            console.log(`Mascota ${index + 1} - nombre: ${mascota.nombre}`);
            console.log(`Mascota ${index + 1} - foto type:`, typeof mascota.foto);
            console.log(`Mascota ${index + 1} - foto is Buffer:`, Buffer.isBuffer(mascota.foto));
            
            if (mascota.foto) {
                console.log(`Mascota ${index + 1} - foto length:`, mascota.foto.length);
                
                // Verificar que la imagen no sea demasiado grande (máximo 2MB)
                if (mascota.foto.length > 2 * 1024 * 1024) {
                    console.log(`Mascota ${index + 1} - imagen demasiado grande, omitiendo`);
                    return {
                        ...mascota,
                        foto: null
                    };
                }
                
                console.log(`Mascota ${index + 1} - foto first 50 bytes:`, mascota.foto.toString('hex').substring(0, 100));
                
                const base64String = mascota.foto.toString('base64');
                console.log(`Mascota ${index + 1} - base64 length:`, base64String.length);
                console.log(`Mascota ${index + 1} - base64 first 50 chars:`, base64String.substring(0, 50));
                
                const finalString = `data:image/jpeg;base64,${base64String}`;
                console.log(`Mascota ${index + 1} - final string length:`, finalString.length);
                console.log(`Mascota ${index + 1} - final string starts with:`, finalString.substring(0, 50));
                
                return {
                    ...mascota,
                    foto: finalString
                };
            } else {
                console.log(`Mascota ${index + 1} - no foto`);
                return {
                    ...mascota,
                    foto: null
                };
            }
        });

        return new Response(JSON.stringify(mascotasConFotos), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Error al obtener mascotas:', err);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// POST - Crear nueva mascota
export async function POST(request) {
    try {
        // Detectar el tipo de contenido
        const contentType = request.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('multipart/form-data')) {
            // Manejar FormData
            const formData = await request.formData();
            data = {
                nombre: formData.get('nombre'),
                especie: formData.get('especie'),
                raza: formData.get('raza') || '',
                sexo: formData.get('sexo'),
                edad: formData.get('edad') || 0,
                peso: formData.get('peso') || 0,
                estado_reproductivo: formData.get('estado_reproductivo') === 'true',
                id_cliente: formData.get('id_cliente'),
                foto: formData.get('foto')
            };
        } else {
            // Manejar JSON
            data = await request.json();
        }
        
        const { nombre, especie, raza = '', sexo, edad = 0, peso = 0, estado_reproductivo = false, id_cliente, foto } = data;
        
        // Validaciones básicas
        if (!nombre || !especie || !sexo) {
            return new Response(JSON.stringify({ error: 'Nombre, especie y sexo son requeridos' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
      
        // Procesar la foto
        let fotoBuffer = null;
        if (foto) {
            if (typeof foto === 'string') {
                // Es Base64 (JSON)
                const base64Data = foto.includes(',') ? foto.split(',')[1] : foto;
                fotoBuffer = Buffer.from(base64Data, 'base64');
            } else {
                // Es un archivo (FormData)
                const arrayBuffer = await foto.arrayBuffer();
                fotoBuffer = Buffer.from(arrayBuffer);
            }
        }

        // Insertar en la base de datos
        const result = await pool.query(`
            INSERT INTO mascota (nombre, especie, raza, sexo, edad, peso, estado_reproductivo, foto, id_cliente, dia, mes, anio)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, EXTRACT(DAY FROM NOW()), EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()))
            RETURNING id_mascota
        `, [nombre, especie, raza, sexo, edad, peso, estado_reproductivo, fotoBuffer, id_cliente]);

        return new Response(JSON.stringify({ 
            success: true, 
            id: result.rows[0].id_mascota,
            message: 'Mascota creada exitosamente'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Error al crear mascota:', err);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            detail: err.detail,
            hint: err.hint
        });
        
        // Verificar si es un error de restricción de clave foránea
        if (err.code === '23503') {
            return new Response(JSON.stringify({ error: 'El cliente especificado no existe' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ 
            error: 'Error interno del servidor',
            details: err.message,
            code: err.code
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// PUT - Actualizar mascota existente
export async function PUT(request) {
    try {
        const { id_mascota, nombre, especie, raza, edad, peso, foto, id_cliente } = await request.json();
        
        if (!id_mascota) {
            return new Response(JSON.stringify({ error: 'ID de mascota es requerido' }), {
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

        const result = await pool.query(`
            UPDATE mascota 
            SET nombre = $1, especie = $2, raza = $3, edad = $4, peso = $5, foto = $6, id_cliente = $7
            WHERE id_mascota = $8
            RETURNING id_mascota
        `, [nombre, especie, raza, edad, peso, fotoBuffer, id_cliente, id_mascota]);

        if (result.rowCount === 0) {
            return new Response(JSON.stringify({ error: 'Mascota no encontrada' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Mascota actualizada exitosamente'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Error al actualizar mascota:', err);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE - Eliminar mascota
export async function DELETE(request) {
    try {
        const { id_mascota } = await request.json();
        
        if (!id_mascota) {
            return new Response(JSON.stringify({ error: 'ID de mascota es requerido' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await pool.query(`
            DELETE FROM mascota 
            WHERE id_mascota = $1
        `, [id_mascota]);

        if (result.rowCount === 0) {
            return new Response(JSON.stringify({ error: 'Mascota no encontrada' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Mascota eliminada exitosamente'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Error al eliminar mascota:', err);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 