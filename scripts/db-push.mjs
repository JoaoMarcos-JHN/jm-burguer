// Applies supabase/migrations and supabase/seed.sql to the database in
// SUPABASE_DB_URL (.env.local). Already applied migrations are skipped.
// Run with: pnpm db:push

import { spawnSync } from "node:child_process"

const dbUrl = process.env.SUPABASE_DB_URL
if (!dbUrl || dbUrl.includes("[SENHA]")) {
  console.error("Fill SUPABASE_DB_URL in .env.local first (Supabase > Connect > Session pooler).")
  process.exit(1)
}

const result = spawnSync(
  "pnpm",
  ["exec", "supabase", "db", "push", "--db-url", dbUrl, "--include-seed", "--yes"],
  { stdio: "inherit", shell: process.platform === "win32" },
)
process.exit(result.status ?? 1)
