import type {
  AuthRepository,
  UserInfo
} from "../../src/auth/auth.repository";


export class FakeAuthRepository implements AuthRepository {


  users: (UserInfo & { created_at?: string })[] = [];


  async findUserByEmail(email: string): Promise<UserInfo | null> {

    return this.users.find(
      x => x.email === email
    ) ?? null;

  }


  /** Ids de usuario cuyo codigo pendiente se borro al vincular Google. */
  codigosBorrados: string[] = [];


  async findUserByGoogleSub(googleSub: string): Promise<UserInfo | null> {

    return this.users.find(
      x => x.google_sub === googleSub
    ) ?? null;

  }


  async createGoogleUser(data: {
    id: string;
    email: string;
    nombre: string;
    googleSub: string;
  }): Promise<void> {

    await Promise.resolve();

    if(this.users.some(
      x => x.email === data.email || x.google_sub === data.googleSub
    )){
      throw new Error("UNIQUE constraint failed: users");
    }

    this.users.push({
      id: data.id,
      email: data.email,
      nombre: data.nombre,
      password_hash: null,
      active: 1,
      deleted_at: null,
      email_verified_at: "2026-01-01 00:00:00",
      email_verified_via: "GOOGLE",
      google_sub: data.googleSub
    });

  }


  async linkGoogle(userId: string, googleSub: string): Promise<boolean> {

    await Promise.resolve();

    const user = this.users.find(
      x => x.id === userId && !x.google_sub
    );

    if(!user){
      return false;
    }

    // Espejo del SQL: se evalua con los valores antiguos.
    if(user.email_verified_via == null){
      user.password_hash = null;
    }
    if(user.email_verified_at === null){
      this.codigosBorrados.push(user.id);
    }
    user.email_verified_at = user.email_verified_at ?? "2026-01-01 00:00:00";
    user.email_verified_via = user.email_verified_via ?? "GOOGLE";

    user.google_sub = googleSub;

    return true;

  }


  async emailExists(email: string): Promise<boolean> {

    return this.users.some(
      x => x.email === email
    );

  }


  async createUser(data: {
    id: string;
    email: string;
    nombre: string;
    passwordHash: string;
    verified: boolean;
  }): Promise<void> {


    this.users.push({

      id: data.id,

      email: data.email,

      nombre: data.nombre,

      password_hash: data.passwordHash,

      active: 1,

      deleted_at: null,

      email_verified_at: data.verified ? "2026-01-01 00:00:00" : null

    });

  }


  async updateUnverifiedCredentials(
    userId: string,
    nombre: string,
    passwordHash: string
  ): Promise<void> {

    const user = this.users.find(
      x => x.id === userId && x.email_verified_at === null
    );

    if(user){
      user.nombre = nombre;
      user.password_hash = passwordHash;
    }

  }


  async deleteUnverifiedUser(userId: string): Promise<void> {

    this.users = this.users.filter(
      x => !(x.id === userId && x.email_verified_at === null)
    );

  }


  async changeUnverifiedEmail(
    userId: string,
    email: string
  ): Promise<void> {

    const user = this.users.find(
      x => x.id === userId && x.email_verified_at === null
    );

    if(user){
      user.email = email;
    }

  }


  async purgeStaleUnverified(): Promise<number> {

    return 0;

  }


  getDb(): any {

    return null;

  }


}
