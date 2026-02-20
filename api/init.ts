
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL + "?sslmode=require",
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Create Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          weight_history JSONB DEFAULT '[]',
          active_plan_id TEXT
      );
      CREATE TABLE IF NOT EXISTS workouts (
          id TEXT PRIMARY KEY,
          plan_id TEXT NOT NULL,
          week INTEGER NOT NULL,
          order_num INTEGER NOT NULL,
          description TEXT NOT NULL,
          distance_km NUMERIC NOT NULL
      );
      CREATE TABLE IF NOT EXISTS user_progress (
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          workout_id TEXT REFERENCES workouts(id) ON DELETE CASCADE,
          completed BOOLEAN DEFAULT FALSE,
          skipped BOOLEAN DEFAULT FALSE,
          actual_distance_km NUMERIC,
          duration TEXT,
          feelings TEXT,
          has_injury BOOLEAN DEFAULT FALSE,
          injury_note TEXT,
          PRIMARY KEY (user_id, workout_id)
      );
    `);

    // 2. Insert Default Workouts if empty
    const { rowCount } = await pool.query('SELECT id FROM workouts LIMIT 1');
    if (rowCount === 0) {
      const plans = [
        { id: 'bcn', weeks: 12 },
        { id: 'mad', weeks: 12 }
      ];

      for (const plan of plans) {
        for (let w = 1; w <= plan.weeks; w++) {
          for (let d = 1; d <= 4; d++) {
            const id = `${plan.id}-w${w}-d${d}`;
            const orderNum = (w - 1) * 4 + d;
            const dist = d === 4 ? (10 + w) : (5 + Math.floor(w/2)); // Mock logic
            await pool.query(
              'INSERT INTO workouts (id, plan_id, week, order_num, description, distance_km) VALUES ($1, $2, $3, $4, $5, $6)',
              [id, plan.id, w, orderNum, `Entrenamiento Intensivo ${d}`, dist]
            );
          }
        }
      }
    }

    return res.status(200).json({ message: 'Database initialized successfully' });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
