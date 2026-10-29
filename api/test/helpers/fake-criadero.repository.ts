import type {
  CriaderoRepository,
  CatalogoItemInfo,
  CriaderoInfo,
  CriaderoConfiguracionInfo
} from "../../src/criaderos/criaderos.repository";


export const DEFAULT_TEST_CRIADERO_ID = "criadero-1";


export class FakeCriaderoRepository implements CriaderoRepository {


  criaderoExiste = true;

  userActive = true;

  completed = false;

  updated = false;


  criaderoInfo: CriaderoInfo = {
    id: DEFAULT_TEST_CRIADERO_ID,
    nombre: "Criadero Test",
    pais: "Ecuador",
    provincia: "Pichincha",
    ciudad: "Quito",
    telefono: "0999999999",
    correoContacto: "test@test.com",
    onboardingCompletado: 0,
    version: 1
  };


  configuracion: CriaderoConfiguracionInfo | null = {
    criaderoId: DEFAULT_TEST_CRIADERO_ID,
    especiePrincipalItemId: "item-especie",
    razaPrincipalItemId: "item-raza",
    tipoCriaderoItemId: "item-tipo",
    finalidadItemId: "item-finalidad"
  };


  catalogs = new Map<string,string>();


  items = new Map<string,CatalogoItemInfo>();


  constructor(){

    [
      ["ESPECIES","catalog-especies"],
      ["RAZAS","catalog-razas"],
      ["TIPOS_CRIADERO","catalog-tipos"],
      ["FINALIDADES_CRIADERO","catalog-finalidad"],
      ["SEXOS","catalog-sexos"],
      ["ENFERMEDADES","catalog-enfermedades"],
      ["MEDICAMENTOS","catalog-medicamentos"],
      ["CATEGORIAS_FINANCIERAS","catalog-financieras"]
    ].forEach(([codigo,id])=>{
      this.catalogs.set(codigo,id);
    });


    this.items.set(
      "item-especie",
      {
        id:"item-especie",
        criaderoId:DEFAULT_TEST_CRIADERO_ID,
        catalogoCodigo:"ESPECIES",
        activo:1,
        deletedAt:null
      }
    );


    this.items.set(
      "item-raza",
      {
        id:"item-raza",
        criaderoId:DEFAULT_TEST_CRIADERO_ID,
        catalogoCodigo:"RAZAS",
        activo:1,
        deletedAt:null
      }
    );


    this.items.set(
      "item-tipo",
      {
        id:"item-tipo",
        criaderoId:DEFAULT_TEST_CRIADERO_ID,
        catalogoCodigo:"TIPOS_CRIADERO",
        activo:1,
        deletedAt:null
      }
    );


    this.items.set(
      "item-finalidad",
      {
        id:"item-finalidad",
        criaderoId:DEFAULT_TEST_CRIADERO_ID,
        catalogoCodigo:"FINALIDADES_CRIADERO",
        activo:1,
        deletedAt:null
      }
    );

  }


  async userExistsAndActive(){
    return this.userActive;
  }


  async criaderoExists(){
    return this.criaderoExiste;
  }


  async userOwnsCriadero(){
    return true;
  }


  async getCriaderoInfo(){
    return this.criaderoInfo;
  }


  async getCriaderoConfiguracion(){
    return this.configuracion;
  }


  async getCatalogosByCodigo(codigos:string[]){

    const result = new Map<string,string>();

    codigos.forEach(codigo=>{
      const value = this.catalogs.get(codigo);

      if(value){
        result.set(codigo,value);
      }
    });

    return result;
  }


  async getCatalogoItemsInfo(ids:string[]){

    const result = new Map<string,CatalogoItemInfo>();

    ids.forEach(id=>{
      const item = this.items.get(id);

      if(item){
        result.set(id,item);
      }
    });

    return result;
  }


  async getConfiguracionVersion(){
    return 1;
  }


  async updateConfiguracion(){

    this.updated = true;

    return {
      success:true,
      rowsAffected:1
    };

  }


  async completeOnboarding(){

    this.completed = true;

    return {
      success:true,
      rowsAffected:1
    };

  }


  async executeBatch(){
    return;
  }


  getDb():any{

    return {
      prepare(){
        return {
          bind(){
            return this;
          }
        };
      }
    };

  }

}
