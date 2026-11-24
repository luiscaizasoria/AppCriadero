/** Construccion de mensajes MIME (RFC 5322 / 2045 / 2047) para el envio por SMTP. */

export interface MensajeMimeDatos {
  from: string;
  fromName: string;
  to: string;
  asunto: string;
  texto: string;
  html: string;
  fecha: Date;
  /** Para Message-ID y el limite multipart; inyectable en pruebas. */
  idUnico?: string;
}

/** Elimina saltos de linea y caracteres de control para evitar inyeccion de cabeceras. */
export function sanearCabecera(valor: string): string {
  // eslint-disable-next-line no-control-regex
  return valor.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
}

function base64Bytes(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) {
    binario += String.fromCharCode(byte);
  }
  return btoa(binario);
}

function esAscii(texto: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /^[\u0020-\u007e]*$/.test(texto);
}

/** Palabra codificada RFC 2047 (B), sin partir caracteres UTF-8 ni exceder 75 caracteres. */
export function codificarPalabras(texto: string): string {
  const limpio = sanearCabecera(texto);
  if (esAscii(limpio)) {
    return limpio;
  }
  const codificador = new TextEncoder();
  const trozos: string[] = [];
  let actual = '';
  for (const caracter of limpio) {
    const candidato = actual + caracter;
    if (codificador.encode(candidato).length > 42 && actual) {
      trozos.push(actual);
      actual = caracter;
    } else {
      actual = candidato;
    }
  }
  if (actual) {
    trozos.push(actual);
  }
  return trozos
    .map((t) => `=?UTF-8?B?${base64Bytes(codificador.encode(t))}?=`)
    .join('\r\n ');
}

function nombreVisible(nombre: string): string {
  const limpio = sanearCabecera(nombre);
  if (!esAscii(limpio)) {
    return codificarPalabras(limpio);
  }
  return `"${limpio.replace(/(["\\])/g, '\\$1')}"`;
}

/** Cuerpo en base64 con lineas de 76 caracteres. */
function cuerpoBase64(texto: string): string {
  const b64 = base64Bytes(new TextEncoder().encode(texto));
  return (b64.match(/.{1,76}/g) ?? []).join('\r\n');
}

export function dominioDe(direccion: string): string {
  const dominio = direccion.split('@')[1] ?? 'localhost';
  return sanearCabecera(dominio).replace(/[^A-Za-z0-9.-]/g, '') || 'localhost';
}

export function construirMensajeMime(datos: MensajeMimeDatos): string {
  const id = datos.idUnico ?? crypto.randomUUID();
  const limite = `=_kikirikis_${id.replace(/-/g, '')}`;
  const from = sanearCabecera(datos.from);
  const to = sanearCabecera(datos.to);

  const cabeceras = [
    `From: ${nombreVisible(datos.fromName)} <${from}>`,
    `To: <${to}>`,
    `Subject: ${codificarPalabras(datos.asunto)}`,
    `Date: ${datos.fecha.toUTCString()}`,
    `Message-ID: <${id}@${dominioDe(from)}>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${limite}"`,
  ];

  const parte = (tipo: string, contenido: string) =>
    `--${limite}\r\n` +
    `Content-Type: ${tipo}; charset=UTF-8\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    `${cuerpoBase64(contenido)}\r\n`;

  return (
    cabeceras.join('\r\n') +
    '\r\n\r\n' +
    parte('text/plain', datos.texto) +
    parte('text/html', datos.html) +
    `--${limite}--\r\n`
  );
}
