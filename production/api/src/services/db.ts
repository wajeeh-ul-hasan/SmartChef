import pg from "pg";

const { Pool } = pg;
type QueryResultRow = pg.QueryResultRow;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase.co") ? { rejectUnauthorized: false } : undefined
});

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for PostgreSQL persistence.");
  }
  return pool.query<T>(text, params);
}
