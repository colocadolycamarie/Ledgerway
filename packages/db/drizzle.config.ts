import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  // Relative to this config file. Deliberately not built with
  // path.join(__dirname, ...) — drizzle-kit's schema-file matcher expects
  // forward slashes, and path.join produces backslashes on Windows, which
  // silently fails to match ("No schema files found").
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
