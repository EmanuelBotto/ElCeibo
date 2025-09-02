const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

async function updatePasswords() {
  const client = await pool.connect();
  
  try {
    // Obtener usuarios con contraseñas sin hash
    const result = await client.query(`
      SELECT usuario, contrasenia 
      FROM usuario 
      WHERE contrasenia NOT LIKE '$2b$%'
    `);
    
    console.log('Actualizando contraseñas sin hash...');
    console.log('=====================================');
    
    for (const user of result.rows) {
      console.log(`Usuario: ${user.usuario}`);
      console.log(`Contraseña actual: ${user.contrasenia}`);
      
      // Hash de la contraseña actual
      const hashedPassword = await bcrypt.hash(user.contrasenia, 10);
      
      // Actualizar en la base de datos
      await client.query(
        'UPDATE usuario SET contrasenia = $1 WHERE usuario = $2',
        [hashedPassword, user.usuario]
      );
      
      console.log(`Contraseña actualizada para ${user.usuario}`);
      console.log('---');
    }
    
    console.log('Todas las contraseñas han sido actualizadas');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updatePasswords(); 