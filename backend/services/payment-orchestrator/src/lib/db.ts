import { Pool, QueryResult, QueryResultRow } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}


