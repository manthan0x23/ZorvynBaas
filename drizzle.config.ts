import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({
  quiet: false,
  debug: true,
});

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/*.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL! as string,
  },
  verbose: true,
  strict: true,
});
