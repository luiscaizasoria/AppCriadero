import type { CuidadosRepository } from "../../src/cuidados/cuidados.repository";
import type {
  CrearAlimentoBebidaInput,
  CrearSanidadInput,
  RegistroAlimentacionListado
} from "../../src/cuidados/cuidados.types";


export interface FilaJaulaCuidado {
  id: string;
  criaderoId: string;
  activa: number;
  estadoSanitario: string;
}


export interface FilaHistorialCuidado {
  id: string;
  criaderoId: string;
  jaulaId: string;
  aveId: null;
  tipoEvento: string;
  fecha: string;
  detalle: string;
}


export interface FilaCuidado {
  id: string;
  criaderoId: string;
  jaulaId: string;
  fecha: string;
  tipo: string;
  cantidad: string | null;
  detalle: string | null;
}


/** Repositorio en memoria con el mismo contrato que D1CuidadosRepository. */
export class FakeCuidadosRepository implements CuidadosRepository {

  jaulas: FilaJaulaCuidado[] = [];
  alimentacion: FilaCuidado[] = [];
  bebida: FilaCuidado[] = [];
  sanidad: FilaCuidado[] = [];
  historial: FilaHistorialCuidado[] = [];


  sembrarJaula(criaderoId: string, id: string, activa = 1){
    this.jaulas.push({ id, criaderoId, activa, estadoSanitario:"NORMAL" });
  }


  async existeJaula(criaderoId: string, jaulaId: string){
    return this.jaulas.some(j => j.id===jaulaId && j.criaderoId===criaderoId);
  }


  private escribirHistorial(criaderoId: string, id: string, jaulaId: string, tipoEvento: string, fecha: string, detalle: string){
    this.historial.push({ id, criaderoId, jaulaId, aveId:null, tipoEvento, fecha, detalle });
  }


  private escribir(lista: FilaCuidado[], tipoEvento: string, criaderoId: string, input: CrearAlimentoBebidaInput){
    lista.push({
      id:input.id, criaderoId, jaulaId:input.jaulaId, fecha:input.fecha,
      tipo:input.tipo, cantidad:input.cantidad, detalle:input.detalle
    });
    this.escribirHistorial(criaderoId, input.historialId, input.jaulaId, tipoEvento, input.fecha, input.detalleHistorial);
  }


  async crearAlimentacion(criaderoId: string, input: CrearAlimentoBebidaInput){
    this.escribir(this.alimentacion, "ALIMENTACION", criaderoId, input);
  }


  async crearBebida(criaderoId: string, input: CrearAlimentoBebidaInput){
    this.escribir(this.bebida, "BEBIDA", criaderoId, input);
  }


  async crearSanidad(criaderoId: string, input: CrearSanidadInput){
    this.sanidad.push({
      id:input.id, criaderoId, jaulaId:input.jaulaId, fecha:input.fecha,
      tipo:input.tipo, cantidad:null, detalle:input.detalle
    });
    const jaula = this.jaulas.find(j => j.id===input.jaulaId && j.criaderoId===criaderoId);
    if(jaula){ jaula.estadoSanitario = input.estadoSanitario; }
    this.escribirHistorial(criaderoId, input.historialId, input.jaulaId, "SANIDAD", input.fecha, input.detalleHistorial);
  }


  async listarAlimentacion(criaderoId: string, jaulaId: string): Promise<RegistroAlimentacionListado[]>{
    return this.alimentacion
      .filter(r => r.criaderoId===criaderoId && r.jaulaId===jaulaId)
      .map(r => ({
        id:r.id, jaulaId:r.jaulaId, fecha:r.fecha, tipo:r.tipo,
        cantidad:r.cantidad, detalle:r.detalle, fechaCreacion:"2026-10-30 12:00:00"
      }))
      .sort((a,b) => a.fecha===b.fecha
        ? (a.id < b.id ? 1 : -1)
        : (a.fecha < b.fecha ? 1 : -1));
  }

}
