
import express from "express";
import { createServer as createViteServer } from "vite";
import initHandler from "./api/init";
import usersHandler from "./api/users";
import workoutsHandler from "./api/workouts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.all("/api/init", async (req, res) => {
    try {
      await initHandler(req as any, res as any);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.all("/api/users", async (req, res) => {
    try {
      await usersHandler(req as any, res as any);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.all("/api/workouts", async (req, res) => {
    try {
      await workoutsHandler(req as any, res as any);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
