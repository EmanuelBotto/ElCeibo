const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_2Wd4rlvPuZGM@ep-green-base-ac7ax3c8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkFacturaData() {
  try {
    const client = await pool.connect();
    
    // Verificar datos de factura
    const result = await client.query('SELECT mes, anio, tipo_factura, monto_total FROM factura LIMIT 10');
    console.log('📊 Datos de factura:');
    console.log('============================================================');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Mes: ${row.mes}, Año: ${row.anio}, Tipo: ${row.tipo_factura}, Monto: ${row.monto_total}`);
    });
    
    // Verificar mes actual
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    console.log(`\n📅 Mes actual: ${currentMonth}, Año actual: ${currentYear}`);
    
    // Verificar ingresos del mes actual
    const ingresosResult = await client.query(`
      SELECT COALESCE(SUM(monto_total), 0) as total
      FROM factura 
      WHERE mes = $1 AND anio = $2 AND tipo_factura = 'ingreso'
    `, [currentMonth, currentYear]);
    
    console.log(`💰 Ingresos del mes actual: ${ingresosResult.rows[0].total}`);
    
    // Verificar todos los ingresos sin filtro de mes
    const todosIngresosResult = await client.query(`
      SELECT COALESCE(SUM(monto_total), 0) as total
      FROM factura 
      WHERE tipo_factura = 'ingreso'
    `);
    
    console.log(`💰 Total de ingresos (todos los meses): ${todosIngresosResult.rows[0].total}`);
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
  }
}

checkFacturaData();
