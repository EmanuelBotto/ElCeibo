const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

async function createTestUsers() {
  const client = await pool.connect();
  
  try {
    // Crear usuarios de prueba
    const testUsers = [
      {
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@elceibo.com',
        contrasenia: 'admin123',
        tipo_usuario: 'admin',
        calle: 'Av. Principal',
        numero: 123,
        codigo_postal: 12345,
        telefono: 1234567890,
        usuario: 'admin'
      },
      {
        nombre: 'Veterinario',
        apellido: 'Principal',
        email: 'vet@elceibo.com',
        contrasenia: 'vet123',
        tipo_usuario: 'veterinario',
        calle: 'Calle Veterinaria',
        numero: 456,
        codigo_postal: 54321,
        telefono: 9876543210,
        usuario: 'veterinario'
      },
      {
        nombre: 'Asistente',
        apellido: 'Clínica',
        email: 'asistente@elceibo.com',
        contrasenia: 'asistente123',
        tipo_usuario: 'asistente',
        calle: 'Calle Asistente',
        numero: 789,
        codigo_postal: 67890,
        telefono: 5555555555,
        usuario: 'asistente'
      }
    ];

    for (const user of testUsers) {
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(user.contrasenia, 10);
      
      // Verificar si el usuario ya existe
      const existingUser = await client.query(
        'SELECT id_usuario FROM usuario WHERE usuario = $1',
        [user.usuario]
      );

      if (existingUser.rows.length > 0) {
        // Actualizar usuario existente
        await client.query(
          `UPDATE usuario 
           SET nombre = $1, apellido = $2, email = $3, contrasenia = $4, 
               tipo_usuario = $5, calle = $6, numero = $7, codigo_postal = $8, 
               telefono = $9
           WHERE usuario = $10`,
          [
            user.nombre,
            user.apellido,
            user.email,
            hashedPassword,
            user.tipo_usuario,
            user.calle,
            user.numero,
            user.codigo_postal,
            user.telefono,
            user.usuario
          ]
        );
      } else {
        // Insertar nuevo usuario
        await client.query(
          `INSERT INTO usuario (nombre, apellido, email, contrasenia, tipo_usuario, calle, numero, codigo_postal, telefono, usuario)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            user.nombre,
            user.apellido,
            user.email,
            hashedPassword,
            user.tipo_usuario,
            user.calle,
            user.numero,
            user.codigo_postal,
            user.telefono,
            user.usuario
          ]
        );
      }
      
      console.log(`Usuario ${user.usuario} creado/actualizado exitosamente`);
    }
    
    console.log('Todos los usuarios de prueba han sido creados');
    
  } catch (error) {
    console.error('Error al crear usuarios:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestUsers(); 