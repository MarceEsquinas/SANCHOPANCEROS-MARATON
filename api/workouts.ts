
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL + "?sslmode=require",
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { planId, userId } = req.query;
      const { rows } = await pool.query(
        `SELECT w.*, p.completed, p.skipped, p.actual_distance_km, p.duration, p.feelings, p.has_injury, p.injury_note
         FROM workouts w
         LEFT JOIN user_progress p ON w.id = p.workout_id AND p.user_id = $1
         WHERE w.plan_id = $2
         ORDER BY w.order_num ASC`,
        [userId, planId]
      );
      
      return res.status(200).json(rows.map(r => ({
        id: r.id,
        planId: r.plan_id,
        week: r.week,
        order: r.order_num,
        description: r.description,
        completed: !!r.completed,
        skipped: !!r.skipped,
        distanceKm: r.distance_km,
        actualDistanceKm: r.actual_distance_km,
        duration: r.duration,
        feelings: r.feelings,
        hasInjury: !!r.has_injury,
        injuryNote: r.injury_note
      })));
    }

    if (req.method === 'POST') {
      const { workoutId, userId, ...updates } = req.body;
      const query = `
        INSERT INTO user_progress (user_id, workout_id, completed, skipped, actual_distance_km, duration, feelings, has_injury, injury_note)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id, workout_id) DO UPDATE SET
          completed = EXCLUDED.completed,
          skipped = EXCLUDED.skipped,
          actual_distance_km = EXCLUDED.actual_distance_km,
          duration = EXCLUDED.duration,
          feelings = EXCLUDED.feelings,
          has_injury = EXCLUDED.has_injury,
          injury_note = EXCLUDED.injury_note
      `;
      const values = [
        userId, 
        workoutId, 
        updates.completed ?? false, 
        updates.skipped ?? false, 
        updates.actualDistanceKm ?? 0, 
        updates.duration ?? null, 
        updates.feelings ?? null, 
        updates.hasInjury ?? false, 
        updates.injuryNote ?? null
      ];
      await pool.query(query, values);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
