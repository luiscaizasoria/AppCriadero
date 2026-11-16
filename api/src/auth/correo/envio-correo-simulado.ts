import {
  EnvioCorreoError,
  type CodigoVerificacionCorreo,
  type EnvioCorreo,
} from './envio-correo';

/** Buzon en memoria para pruebas. No envia nada. */
export class EnvioCorreoSimulado implements EnvioCorreo {
  readonly buzon: CodigoVerificacionCorreo[] = [];

  /** Si es true, el siguiente envio falla (simula caida del proveedor). */
  fallar = false;

  async enviarCodigoVerificacion(
    datos: CodigoVerificacionCorreo
  ): Promise<void> {
    if (this.fallar) {
      throw new EnvioCorreoError('Fallo simulado del proveedor');
    }
    this.buzon.push({ ...datos });
  }

  ultimo(): CodigoVerificacionCorreo | undefined {
    return this.buzon[this.buzon.length - 1];
  }
}
