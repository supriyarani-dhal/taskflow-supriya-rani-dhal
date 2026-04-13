import { Request, Response } from "express";
import pool from "../db/pool";

export const listTasks = async (req: Request, res: Response): Promise<void> => {
  const { id: projectId } = req.params;
  const { status, assignee } = req.query;

  let query = `SELECT * FROM tasks WHERE project_id = $1`;
  const params: any[] = [projectId];

  if (status) { params.push(status); query += ` AND status = $${params.length}`; }
  if (assignee) { params.push(assignee); query += ` AND assignee_id = $${params.length}`; }

  query += ` ORDER BY created_at DESC`;
  const result = await pool.query(query, params);
  res.json({ tasks: result.rows });
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  const { id: projectId } = req.params;
  const { title, description, priority, status, assignee_id, due_date } = req.body;

  if (!title) {
    res.status(400).json({ error: "validation failed", fields: { title: "is required" } });
    return;
  }

  const result = await pool.query(
    `INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, due_date)
     VALUES ($1, $2, COALESCE($3, 'todo'), $4, $5, $6, $7) RETURNING *`,
    [title, description || null, status || "todo", priority || "medium", projectId, assignee_id || null, due_date || null]
  );
  res.status(201).json(result.rows[0]);
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, status, priority, assignee_id, due_date } = req.body;

  const task = await pool.query(`SELECT * FROM tasks WHERE id = $1`, [id]);
  if (!task.rows[0]) { res.status(404).json({ error: "not found" }); return; }

  const result = await pool.query(
    `UPDATE tasks SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      status = COALESCE($3, status),
      priority = COALESCE($4, priority),
      assignee_id = COALESCE($5, assignee_id),
      due_date = COALESCE($6, due_date),
      updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [title, description, status, priority, assignee_id, due_date, id]
  );
  res.json(result.rows[0]);
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const task = await pool.query(
    `SELECT t.*, p.owner_id FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = $1`, [id]
  );
  if (!task.rows[0]) { res.status(404).json({ error: "not found" }); return; }
  if (task.rows[0].owner_id !== req.user!.id) { res.status(403).json({ error: "forbidden" }); return; }
  await pool.query(`DELETE FROM tasks WHERE id = $1`, [id]);
  res.status(204).send();
};