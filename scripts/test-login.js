const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

async function testLogin() {
  const client = await pool.connect();
  
  try {
    // Usuarios de prueba
    const testUsers = [
      { usuario: 'admin', contrasenia: 'admin123' },
      { usuario: 'veterinario', contrasenia: 'vet123' },
      { usuario: 'asistente', contrasenia: 'asistente123' },
      { usuario: 'CojeBurros', contrasenia: 'pass456' },
      { usuario: 'Notengoidea', contrasenia: 'abc789' },
      { usuario: 'alejandro', contrasenia: '123' },
      { usuario: 'emanuel', contrasenia: 'clave123' }
    ];
    
    console.log('Probando login con diferentes usuarios:');
    console.log('======================================');
    
    for (const testUser of testUsers) {
      // Buscar usuario en la base de datos
      const result = await client.query(
        'SELECT * FROM usuario WHERE usuario = $1',
        [testUser.usuario]
      );
      
      if (result.rows.length === 0) {
        console.log(`❌ Usuario ${testUser.usuario} no encontrado`);
        continue;
      }
      
      const user = result.rows[0];
      
      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(testUser.contrasenia, user.contrasenia);
      
      if (isValidPassword) {
        console.log(`✅ ${testUser.usuario} - Login exitoso`);
        console.log(`   Nombre: ${user.nombre} ${user.apellido}`);
        console.log(`   Tipo: ${user.tipo_usuario}`);
      } else {
        console.log(`❌ ${testUser.usuario} - Contraseña incorrecta`);
      }
      
      console.log('---');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testLogin(); 