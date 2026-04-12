import { Request, Response } from "express";
import pool from "../db/pool";

export const listProjects = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const result = await pool.query(
    `SELECT DISTINCT p.* FROM projects p
     LEFT JOIN tasks t ON t.project_id = p.id
     WHERE p.owner_id = $1 OR t.assignee_id = $1
     ORDER BY p.created_at DESC`,
    [userId]
  );
  res.json({ projects: result.rows });
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: "validation failed", fields: { name: "is required" } });
    return;
  }
  const result = await pool.query(
    `INSERT INTO projects (name, description, owner_id)
     VALUES ($1, $2, $3) RETURNING *`,
    [name, description || null, req.user!.id]
  );
  res.status(201).json(result.rows[0]);
};

export const getProject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const project = await pool.query(`SELECT * FROM projects WHERE id = $1`, [id]);
  if (!project.rows[0]) {
    res.status(404).json({ error: "not found" });
    return;
  }
  const tasks = await pool.query(
    `SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC`, [id]
  );
  res.json({ ...project.rows[0], tasks: tasks.rows });
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description } = req.body;
  const project = await pool.query(`SELECT * FROM projects WHERE id = $1`, [id]);
  if (!project.rows[0]) { res.status(404).json({ error: "not found" }); return; }
  if (project.rows[0].owner_id !== req.user!.id) { res.status(403).json({ error: "forbidden" }); return; }

  const result = await pool.query(
    `UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description)
     WHERE id = $3 RETURNING *`,
    [name, description, id]
  );
  res.json(result.rows[0]);
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const project = await pool.query(`SELECT * FROM projects WHERE id = $1`, [id]);
  if (!project.rows[0]) { res.status(404).json({ error: "not found" }); return; }
  if (project.rows[0].owner_id !== req.user!.id) { res.status(403).json({ error: "forbidden" }); return; }
  await pool.query(`DELETE FROM projects WHERE id = $1`, [id]);
  res.status(204).send();
};