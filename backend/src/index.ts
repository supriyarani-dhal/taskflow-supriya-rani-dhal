import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/projects.routes";
import taskRoutes from "./routes/tasks.routes";
import { authMiddleware } from "./middleware/auth";
import pool from "./db/pool";
import { listUsers } from "./controllers/users.controller";
import { deleteTask, updateTask } from "./controllers/tasks.controller";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Public routes
app.use("/auth", authRoutes);

// Protected routes
app.use("/projects", authMiddleware, projectRoutes);
app.use("/users", authMiddleware, listUsers);
app.use("/projects/:id/tasks", authMiddleware, taskRoutes);
app.patch("/tasks/:id", authMiddleware, updateTask);
app.delete("/tasks/:id", authMiddleware, deleteTask);

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