import type { D1Database } from "@cloudflare/workers-types";
import { D1AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";


export function createAuthService(
  db: D1Database,
  jwtSecret: string
){

  const repository = new D1AuthRepository(db);

  return new AuthService(
    repository,
    jwtSecret
  );

}
