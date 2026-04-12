import { Router } from "express";
import { listTasks, createTask, updateTask, deleteTask } from "../controllers/tasks.controller";
const router = Router({ mergeParams: true });
router.get("/", listTasks);
router.post("/", createTask);
export default router;