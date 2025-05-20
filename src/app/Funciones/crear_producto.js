import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, price } = req.body;

    try {
      const result = await pool.query(
        'INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *',
        [name, price]
      );
      res.status(200).json({ message: 'Producto creado', product: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error creando producto' });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}
