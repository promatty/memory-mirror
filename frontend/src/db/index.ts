import { drizzle } from "drizzle-orm/postgres-js";
import { loadEnvConfig } from "@next/env";
import postgres from "postgres";
import * as schema from "@/db/schema";

loadEnvConfig(process.cwd());

const DATABASE_URL="postgresql://postgres.pxyanfsmmepaqqwnzrce:YlGbhzphnhJBEtMY@aws-1-ca-central-1.pooler.supabase.com:6543/postgres"
// if (DATABASE_URL) {
//   throw new Error("DATABASE_URL must be a Neon postgres connection string");
// }

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(DATABASE_URL);
if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, {
  schema: {
    ...schema,
  },
});
