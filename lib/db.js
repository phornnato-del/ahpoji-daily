import mysql from "mysql2/promise";

// Reuse a single pool across hot reloads in dev.
const globalForDb = globalThis;

export const pool =
  globalForDb.__ahpojiPool ||
  mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "my_schedule",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__ahpojiPool = pool;
}

// The single user this personal instance acts as (see users table, ID=1 by default).
export const APP_USER_ID = Number(process.env.APP_USER_ID || 1);

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
