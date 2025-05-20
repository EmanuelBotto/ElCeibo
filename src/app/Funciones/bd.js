// lib/db.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Pon tu URL de Neon en .env
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
