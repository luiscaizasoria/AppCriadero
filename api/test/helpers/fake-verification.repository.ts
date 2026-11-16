import type {
  StoredCode,
  VerificationRepository
} from "../../src/auth/verification.repository";
import type {
  RateLimitHit,
  RateLimitRepository
} from "../../src/auth/rate-limit.repository";
import type { FakeAuthRepository } from "./fake-auth.repository";


type CodeRow = {
  userId: string;
  codeHash: string;
  salt: string;
  expiresAt: number;
  attempts: number;
};


export class FakeVerificationRepository implements VerificationRepository {


  codes = new Map<string, CodeRow>();


  constructor(private users: FakeAuthRepository){}


  async upsertCode(data: {
    id: string;
    userId: string;
    codeHash: string;
    salt: string;
    expiresAt: number;
    sentAt: number;
  }): Promise<void> {

    this.codes.set(data.userId, {
      userId: data.userId,
      codeHash: data.codeHash,
      salt: data.salt,
      expiresAt: data.expiresAt,
      attempts: 0
    });

  }


  async hasActiveCode(userId: string, now: number): Promise<boolean> {

    const row = this.codes.get(userId);

    return !!row && row.expiresAt > now;

  }


  async registerAttempt(
    userId: string,
    now: number
  ): Promise<StoredCode | null> {

    const row = this.codes.get(userId);

    if(!row || row.attempts >= 5 || row.expiresAt <= now){
      return null;
    }

    row.attempts += 1;

    return {
      codeHash: row.codeHash,
      salt: row.salt,
      attempts: row.attempts
    };

  }


  async completeVerification(userId: string): Promise<void> {

    const user = this.users.users.find(x => x.id === userId);

    if(user && user.email_verified_at === null){
      user.email_verified_at = "2026-01-01 00:00:00";
    }

    this.codes.delete(userId);

  }


}


export class FakeRateLimitRepository implements RateLimitRepository {


  rows = new Map<string, { windowStart: number; count: number }>();


  async hit(
    bucket: string,
    key: string,
    now: number,
    windowMs: number
  ): Promise<RateLimitHit> {

    const id = `${bucket}|${key}`;

    const row = this.rows.get(id);

    if(!row || row.windowStart <= now - windowMs){
      this.rows.set(id, { windowStart: now, count: 1 });
    } else {
      row.count += 1;
    }

    const current = this.rows.get(id)!;

    return { count: current.count, windowStart: current.windowStart };

  }


  async purgeExpired(olderThan: number): Promise<void> {

    for(const [id, row] of this.rows){
      if(row.windowStart < olderThan){
        this.rows.delete(id);
      }
    }

  }


}
