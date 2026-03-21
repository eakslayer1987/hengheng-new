// @ts-nocheck
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const SECRET = process.env.JWT_SECRET || "taladpang-secret-2026";

export function hashPassword(pw: string) { return bcrypt.hashSync(pw, 10); }
export function comparePassword(pw: string, hash: string) { return bcrypt.compareSync(pw, hash); }
export function signToken(payload: object) { return jwt.sign(payload, SECRET, { expiresIn: "7d" }); }
export function verifyToken(token: string) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}
