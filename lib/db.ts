import { attachDatabasePool } from "@vercel/functions";
import { Pool, type QueryResultRow } from "pg";

// Created lazily so `next build` doesn't need DATABASE_URL. Uses Neon's pooled connection.
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set. Run `vercel env pull .env.local --yes`.");
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    // Keeps the Vercel function alive long enough to close idle connections cleanly.
    attachDatabasePool(pool);
  }
  return pool;
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const { rows } = await getPool().query<T>(text, params);
  return rows;
}
