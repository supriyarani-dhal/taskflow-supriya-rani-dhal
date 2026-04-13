import { Request, Response } from "express";
import pool from "../db/pool";

export const listUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT id, name, email FROM users ORDER BY name");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
