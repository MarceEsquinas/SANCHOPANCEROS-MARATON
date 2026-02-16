
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { planId, userId } = req.query;
    // Lógica SELECT de entrenos dinámicos
    return res.status(200).json([]);
  }

  if (req.method === 'POST') {
    // Lógica INSERT/UPDATE de progreso
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}
