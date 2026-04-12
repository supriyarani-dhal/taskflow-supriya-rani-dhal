import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/projects.routes";
import taskRoutes from "./routes/tasks.routes";
import { authMiddleware } from "./middleware/auth";
import pool from "./db/pool";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Public routes
app.use("/auth", authRoutes);

// Protected routes
app.use("/projects", authMiddleware, projectRoutes);
app.use("/projects/:id/tasks", authMiddleware, taskRoutes);
app.patch("/tasks/:id", authMiddleware, (req, res) => {
  import("./controllers/tasks.controller").then(m => m.updateTask(req, res));
});
app.delete("/tasks/:id", authMiddleware, (req, res) => {
  import("./controllers/tasks.controller").then(m => m.deleteTask(req, res));
});

// Graceful shutdown
const server = app.listen(process.env.PORT || 8080, () => {
  console.log(`Server running on port ${process.env.PORT || 8080}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});