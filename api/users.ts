
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
        return res.status(200).json(rows.map(r => ({
          id: r.id,
          name: r.name,
          role: r.role,
          weightHistory: typeof r.weight_history === 'string' ? JSON.parse(r.weight_history) : (r.weight_history || []),
          activePlanId: r.active_plan_id
        })));
      }
      const { rows } = await pool.query('SELECT * FROM users ORDER BY name ASC');
      return res.status(200).json(rows.map(r => ({
        id: r.id,
        name: r.name,
        role: r.role,
        weightHistory: typeof r.weight_history === 'string' ? JSON.parse(r.weight_history) : (r.weight_history || []),
        activePlanId: r.active_plan_id
      })));
    }

    if (req.method === 'POST') {
      const { name, role } = req.body;
      const { rows } = await pool.query(
        'INSERT INTO users (id, name, role, weight_history) VALUES ($1, $2, $3, $4) RETURNING *',
        [Date.now().toString(), name, role, JSON.stringify([])]
      );
      const r = rows[0];
      return res.status(201).json({
        id: r.id,
        name: r.name,
        role: r.role,
        weightHistory: [],
        activePlanId: r.active_plan_id
      });
    }

    if (req.method === 'DELETE') {
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
      return res.status(204).end();
    }

    if (req.method === 'PATCH') {
      const updates = req.body;
      // Handle camelCase to snake_case for specific fields
      if (updates.weightHistory) {
        updates.weight_history = JSON.stringify(updates.weightHistory);
        delete updates.weightHistory;
      }
      if (updates.activePlanId) {
        updates.active_plan_id = updates.activePlanId;
        delete updates.activePlanId;
      }

      const keys = Object.keys(updates);
      const fields = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
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
