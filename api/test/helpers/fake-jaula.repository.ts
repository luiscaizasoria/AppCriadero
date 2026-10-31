import type { JaulaRepository } from "../../src/jaulas/jaulas.repository";
import type {
  JaulaDatos,
  JaulaDetalle,
  JaulaInactivaListado,
  JaulaListado
} from "../../src/jaulas/jaulas.types";


type FilaJaula = JaulaDetalle & { criaderoId: string };


/**
 * Repositorio en memoria con el mismo contrato que D1JaulaRepository.
 * El codigo es unico por criadero (activas e inactivas) y distingue
 * mayusculas, como el UNIQUE de V1.
 */
export class FakeJaulaRepository implements JaulaRepository {


  filas: FilaJaula[] = [];


  private contador = 0;


  private ahora(){
    this.contador += 1;
    return `2026-10-30 12:00:${String(this.contador).padStart(2,"0")}`;
  }


  private comparar(a:string,b:string){
    return a < b ? -1 : a > b ? 1 : 0;
  }


  private aListado(fila:FilaJaula):JaulaListado{
    return {
      id:fila.id,
      codigo:fila.codigo,
      nombre:fila.nombre,
      ubicacion:fila.ubicacion,
      tipo:fila.tipo,
      estadoSanitario:fila.estadoSanitario,
      activa:fila.activa,
      fechaCreacion:fila.fechaCreacion,
      cantidadAves:0
    };
  }


  private aDetalle(fila:FilaJaula):JaulaDetalle{
    const { criaderoId, ...detalle } = fila;
    return { ...detalle };
  }


  async listarActivas(criaderoId:string){

    return this.filas
      .filter(f=>f.criaderoId===criaderoId && f.activa===1)
      .sort((a,b)=>this.comparar(a.codigo,b.codigo))
      .map(f=>this.aListado(f));

  }


  async listarInactivas(criaderoId:string){

    const clave = (f:FilaJaula) =>
      f.fechaDesactivacion ?? f.fechaActualizacion ?? f.fechaCreacion;

    return this.filas
      .filter(f=>f.criaderoId===criaderoId && f.activa===0)
      .sort((a,b)=>
        this.comparar(clave(b),clave(a)) || this.comparar(a.codigo,b.codigo)
      )
      .map((f):JaulaInactivaListado=>({
        ...this.aListado(f),
        fechaActualizacion:f.fechaActualizacion,
        fechaDesactivacion:f.fechaDesactivacion
      }));

  }


  async obtenerPorId(criaderoId:string,jaulaId:string){

    const fila = this.filas.find(
      f=>f.id===jaulaId && f.criaderoId===criaderoId
    );

    return fila ? this.aDetalle(fila) : null;

  }


  private existeCodigo(criaderoId:string,codigo:string,excluirId?:string){

    return this.filas.some(
      f=>f.criaderoId===criaderoId && f.codigo===codigo && f.id!==excluirId
    );

  }


  async crear(criaderoId:string,id:string,datos:JaulaDatos){

    if(this.existeCodigo(criaderoId,datos.codigo)){
      throw new Error(
        "D1_ERROR: UNIQUE constraint failed: jaulas.criadero_id, jaulas.codigo: SQLITE_CONSTRAINT"
      );
    }

    const marca = this.ahora();

    this.filas.push({
      criaderoId,
      id,
      ...datos,
      estadoSanitario:"NORMAL",
      activa:1,
      fechaCreacion:marca,
      fechaActualizacion:null,
      fechaDesactivacion:null
    });

  }


  async actualizar(criaderoId:string,jaulaId:string,datos:JaulaDatos){

    const fila = this.filas.find(
      f=>f.id===jaulaId && f.criaderoId===criaderoId
    );

    if(!fila){
      return 0;
    }

    if(this.existeCodigo(criaderoId,datos.codigo,jaulaId)){
      throw new Error(
        "D1_ERROR: UNIQUE constraint failed: jaulas.criadero_id, jaulas.codigo: SQLITE_CONSTRAINT"
      );
    }

    Object.assign(fila,datos,{ fechaActualizacion:this.ahora() });

    return 1;

  }


  async desactivar(criaderoId:string,jaulaId:string,fecha:string){

    const fila = this.filas.find(
      f=>f.id===jaulaId && f.criaderoId===criaderoId && f.activa===1
    );

    if(!fila){
      return 0;
    }

    fila.activa = 0;
    fila.fechaDesactivacion = fecha;
    fila.fechaActualizacion = this.ahora();

    return 1;

  }

}
