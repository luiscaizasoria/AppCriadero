import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";


const MIGRATIONS_DIR = fileURLToPath(
  new URL("../../migrations", import.meta.url)
);


/**
 * Crea una base SQLite NUEVA con todas las migraciones de api/migrations
 * aplicadas en orden. Por defecto vive en memoria: las pruebas de
 * integracion nunca tocan la base local de desarrollo de Wrangler
 * (.wrangler/state) ni ninguna base remota.
 */
function createMigratedDatabase(path = ":memory:"){

  const db = new Database(path);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith(".sql"))
    .sort();

  for(const file of files){
    db.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
  }

  db.pragma("foreign_keys = ON");

  return db;

}


class LocalPreparedStatement {


  constructor(
    private db: Database.Database,
    private sql: string
  ){}


  bind(...params:any[]){

    return new LocalPreparedStatementBound(
      this.db,
      this.sql,
      params
    );

  }

}



class LocalPreparedStatementBound {


  constructor(
    private db: Database.Database,
    private sql:string,
    private params:any[]
  ){}



  async first(){

    const row = this.db
      .prepare(this.sql)
      .get(...this.params);

    return row ?? null;

  }



  async all(){

    const rows = this.db
      .prepare(this.sql)
      .all(...this.params);

    return {
      results: rows
    };

  }



  async run(){

    const result = this.db
      .prepare(this.sql)
      .run(...this.params);


    return {
      success:true,
      meta:{
        changes: result.changes
      }
    };

  }

}



export class LocalD1Adapter {


  private db: Database.Database;


  constructor(){

    this.db = createMigratedDatabase();

  }



  prepare(sql:string){

    return new LocalPreparedStatement(
      this.db,
      sql
    );

  }



  async exec(sql:string){

    this.db.exec(sql);

  }


  async batch(statements:any[]){

    const transaction = this.db.transaction(
      (items:any[])=>{

        const results:any[] = [];

        for(const statement of items){

          results.push(
            statement.run()
          );

        }

        return results;

      }
    );


    return transaction(statements);

  }


}


