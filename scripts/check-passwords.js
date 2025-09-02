const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

async function checkPasswords() {
  const client = await pool.connect();
  
  try {
    // Obtener todos los usuarios
    const result = await client.query('SELECT usuario, contrasenia FROM usuario');
    
    console.log('Usuarios en la base de datos:');
    console.log('==============================');
    
    for (const user of result.rows) {
      console.log(`Usuario: ${user.usuario}`);
      console.log(`Contraseña hash: ${user.contrasenia}`);
      console.log(`Longitud del hash: ${user.contrasenia?.length || 0}`);
      console.log('---');
    }
    
    // Probar hash de contraseñas conocidas
    console.log('\nProbando hash de contraseñas:');
    console.log('=============================');
    
    const testPasswords = ['admin123', 'vet123', 'asistente123'];
    
    for (const password of testPasswords) {
      const hash = await bcrypt.hash(password, 10);
      console.log(`Contraseña: ${password}`);
      console.log(`Hash generado: ${hash}`);
      console.log(`Longitud: ${hash.length}`);
      console.log('---');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPasswords(); 