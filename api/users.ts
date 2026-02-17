
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL + "?sslmode=require",
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id, name } = req.query;

  try {
    if (req.method === 'GET') {
      if (name) {
        const { rows } = await pool.query('SELECT * FROM users WHERE name = $1', [name]);
        return res.status(200).json(rows);
      }
      const { rows } = await pool.query('SELECT * FROM users ORDER BY name ASC');
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { name, role } = req.body;
      const { rows } = await pool.query(
        'INSERT INTO users (id, name, role, weight_history) VALUES ($1, $2, $3, $4) RETURNING *',
        [Date.now().toString(), name, role, JSON.stringify([])]
      );
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      // Borrado en cascada: el DB debe tener ON DELETE CASCADE en user_id
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
      return res.status(204).end();
    }

    if (req.method === 'PATCH') {
      const updates = req.body;
      const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
      const values = Object.values(updates);
      await pool.query(`UPDATE users SET ${fields} WHERE id = $1`, [id, ...values]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
