const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

async function listUsers() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT usuario, nombre, apellido, tipo_usuario, email 
      FROM usuario 
      ORDER BY usuario
    `);
    
    console.log('Usuarios disponibles en la base de datos:');
    console.log('==========================================');
    
    for (const user of result.rows) {
      console.log(`👤 Usuario: ${user.usuario}`);
      console.log(`   Nombre: ${user.nombre} ${user.apellido}`);
      console.log(`   Tipo: ${user.tipo_usuario}`);
      console.log(`   Email: ${user.email}`);
      console.log('---');
    }
    
    console.log(`Total de usuarios: ${result.rows.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

listUsers(); 