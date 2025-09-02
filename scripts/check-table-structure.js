const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

async function checkTableStructure() {
  try {
    const client = await pool.connect();
    
    console.log('🔍 Verificando estructura de la tabla usuario...\n');
    
    // Obtener información de las columnas
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'usuario'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Columnas de la tabla usuario:');
    console.log('='.repeat(60));
    columnsResult.rows.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default || 'N/A'}`);
    });
    
    // Obtener algunos registros de ejemplo
    const sampleResult = await client.query('SELECT * FROM usuario LIMIT 3;');
    
    console.log('\n📊 Registros de ejemplo:');
    console.log('='.repeat(60));
    sampleResult.rows.forEach((row, index) => {
      console.log(`\nRegistro ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure(); 