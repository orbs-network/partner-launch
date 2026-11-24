import { Pool } from "pg";

let pool: Pool | undefined;

/** This module is server-only. Never expose the connection string to browser bundles. */
export function requestDatabase(): Pool {
  if (pool) return pool;
  const connectionString = process.env.PORTAL_DATABASE_URL?.trim();
  if (!connectionString) throw new Error("Request storage is not configured.");
  const url = new URL(connectionString);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") throw new Error("Request storage is not configured.");
  pool = new Pool({ connectionString, max: 3, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 });
  return pool;
}
