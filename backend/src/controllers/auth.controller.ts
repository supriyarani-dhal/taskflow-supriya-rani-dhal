import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db/pool";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  // Validation
  const fields: Record<string, string> = {};
  if (!name) fields.name = "is required";
  if (!email) fields.email = "is required";
  if (!password || password.length < 8)
    fields.password = "must be at least 8 characters";

  if (Object.keys(fields).length > 0) {
    res.status(400).json({ error: "validation failed", fields });
    return;
  }

  try {
    const hashed = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hashed]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    res.status(201).json({ token, user });
  } catch (err: any) {
    if (err.code === "23505") {
      // unique violation
      res.status(400).json({ error: "validation failed", fields: { email: "already exists" } });
    } else {
      res.status(500).json({ error: "internal server error" });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "validation failed", fields: { email: "is required", password: "is required" } });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, password FROM users WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: "invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch {
    res.status(500).json({ error: "internal server error" });
  }
};