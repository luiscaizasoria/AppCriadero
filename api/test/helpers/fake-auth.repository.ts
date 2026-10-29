import type {
  AuthRepository,
  UserInfo
} from "../../src/auth/auth.repository";


export class FakeAuthRepository implements AuthRepository {


  private users: UserInfo[] = [];


  async findUserByEmail(email: string): Promise<UserInfo | null> {

    return this.users.find(
      x => x.email === email
    ) ?? null;

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
  }): Promise<void> {


    this.users.push({

      id: data.id,

      email: data.email,

      nombre: data.nombre,

      password_hash: data.passwordHash,

      active: 1,

      deleted_at: null

    });

  }


  getDb(): any {

    return null;

  }


}
