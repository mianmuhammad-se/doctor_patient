import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const sqlite = new Database("hospital.db");
export const db = drizzle(sqlite, { schema });

void migrate(db, { migrationsFolder: "drizzle" });
