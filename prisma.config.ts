import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 config — connection URLs live here, not in schema.prisma.
// Migrations need a DIRECT (session) connection to Supabase, NOT the transaction pooler.
// DIRECT_URL = postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:5432/postgres
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
