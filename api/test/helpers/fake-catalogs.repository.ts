import type { CatalogoRepository } from "../../src/catalogs/catalogs.repository";
import type {
  CatalogoDetalle,
  CatalogoItem,
  CatalogoItemEdicion,
  CatalogoItemNuevo,
  CatalogoListado
} from "../../src/catalogs/catalogs.types";


type FilaItem = CatalogoItem & { criaderoId: string; catalogoId: string };


const CATALOGOS: CatalogoListado[] = [
  { id:"cat-razas", codigo:"RAZAS", nombre:"Razas", activo:1 },
  { id:"cat-sexos", codigo:"SEXOS", nombre:"Sexos", activo:1 },
  { id:"cat-enfermedades", codigo:"ENFERMEDADES", nombre:"Enfermedades", activo:1 },
  { id:"cat-medicamentos", codigo:"MEDICAMENTOS", nombre:"Medicamentos", activo:1 },
  { id:"cat-alimentos", codigo:"ALIMENTOS", nombre:"Alimentos", activo:1 },
  { id:"cat-bebidas", codigo:"BEBIDAS", nombre:"Bebidas", activo:1 },
  { id:"cat-categorias", codigo:"CATEGORIAS_FINANCIERAS", nombre:"Categorias financieras", activo:1 },
  { id:"cat-especies", codigo:"ESPECIES", nombre:"Especies", activo:1 },
  { id:"cat-tipos", codigo:"TIPOS_CRIADERO", nombre:"Tipos de criadero", activo:1 },
  { id:"cat-finalidades", codigo:"FINALIDADES_CRIADERO", nombre:"Finalidades", activo:1 }
];


/**
 * Repositorio en memoria con el mismo contrato que D1CatalogoRepository.
 * El codigo es unico por criadero y catalogo (activos e inactivos) y
 * distingue mayusculas, como el indice unico de D1.
 */
export class FakeCatalogoRepository implements CatalogoRepository {


  catalogos: CatalogoListado[] = CATALOGOS.map(c=>({ ...c }));

  filas: FilaItem[] = [];


  private comparar(a:string,b:string){
    return a < b ? -1 : a > b ? 1 : 0;
  }


  private aItem(fila:FilaItem):CatalogoItem{
    return {
      id:fila.id,
      codigo:fila.codigo,
      nombre:fila.nombre,
      descripcion:fila.descripcion,
      activo:fila.activo,
      orden:fila.orden
    };
  }


  /** Siembra un item directamente (para preparar escenarios). */
  sembrar(
    criaderoId:string,
    catalogoCodigo:string,
    item:{ id:string; codigo:string; nombre:string; orden?:number; descripcion?:string|null; activo?:number }
  ){

    const catalogo = this.catalogos.find(c=>c.codigo===catalogoCodigo)!;

    this.filas.push({
      criaderoId,
      catalogoId:catalogo.id,
      id:item.id,
      codigo:item.codigo,
      nombre:item.nombre,
      descripcion:item.descripcion ?? null,
      activo:item.activo ?? 1,
      orden:item.orden ?? 0
    });

  }


  private buscar(criaderoId:string,catalogoId:string,itemId:string){

    return this.filas.find(
      f=>f.id===itemId && f.criaderoId===criaderoId && f.catalogoId===catalogoId
    );

  }


  async listarCatalogos(codigos:readonly string[]):Promise<CatalogoListado[]>{

    return this.catalogos
      .filter(c=>c.activo===1 && codigos.includes(c.codigo))
      .sort((a,b)=>this.comparar(a.nombre,b.nombre))
      .map(c=>({ ...c }));

  }


  async obtenerCatalogoPorCodigo(codigo:string):Promise<CatalogoDetalle|null>{

    const catalogo = this.catalogos.find(c=>c.codigo===codigo);

    return catalogo
      ? { id:catalogo.id, codigo:catalogo.codigo, nombre:catalogo.nombre }
      : null;

  }


  async listarItems(criaderoId:string,catalogoId:string){

    return this.filas
      .filter(f=>f.criaderoId===criaderoId && f.catalogoId===catalogoId && f.activo===1)
      .sort((a,b)=>a.orden-b.orden || this.comparar(a.nombre,b.nombre))
      .map(f=>this.aItem(f));

  }


  async obtenerItem(criaderoId:string,catalogoId:string,itemId:string){

    const fila = this.buscar(criaderoId,catalogoId,itemId);

    return fila ? this.aItem(fila) : null;

  }


  async crearItem(
    criaderoId:string,
    catalogoId:string,
    id:string,
    datos:CatalogoItemNuevo
  ){

    const repetido = this.filas.some(
      f=>f.criaderoId===criaderoId && f.catalogoId===catalogoId && f.codigo===datos.codigo
    );

    if(repetido){
      throw new Error(
        "D1_ERROR: UNIQUE constraint failed: catalogo_items.criadero_id, catalogo_items.catalogo_id, catalogo_items.codigo: SQLITE_CONSTRAINT"
      );
    }

    this.filas.push({
      criaderoId,
      catalogoId,
      id,
      codigo:datos.codigo,
      nombre:datos.nombre,
      descripcion:datos.descripcion,
      activo:1,
      orden:0
    });

  }


  async actualizarItem(
    criaderoId:string,
    catalogoId:string,
    itemId:string,
    datos:CatalogoItemEdicion
  ){

    const fila = this.buscar(criaderoId,catalogoId,itemId);

    if(!fila){
      return 0;
    }

    fila.nombre = datos.nombre;
    fila.descripcion = datos.descripcion;

    return 1;

  }


  async desactivarItem(criaderoId:string,catalogoId:string,itemId:string){

    const fila = this.buscar(criaderoId,catalogoId,itemId);

    if(!fila){
      return 0;
    }

    fila.activo = 0;

    return 1;

  }

}
