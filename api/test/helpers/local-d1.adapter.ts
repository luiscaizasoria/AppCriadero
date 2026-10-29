import Database from "better-sqlite3";


const DB_PATH =
  "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/888e3c02635326b114d386411a37533786c9f79e77575fe1920db4b0b6a66919.sqlite";


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

    this.db = new Database(DB_PATH);

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


