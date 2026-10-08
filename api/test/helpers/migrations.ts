import { readD1Migrations } from "@cloudflare/vitest-pool-workers";

export const migrations = await readD1Migrations({
  migrationsPath: "./migrations",
});
