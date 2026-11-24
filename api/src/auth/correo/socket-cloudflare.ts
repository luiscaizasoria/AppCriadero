import type { SmtpSocket, SmtpSocketFactory } from './smtp-client';

/**
 * Fabrica real de sockets: TLS implicito con cloudflare:sockets.
 * El import es dinamico para que Node (vitest) y tsc no dependan del modulo del runtime.
 */
export const socketCloudflare: SmtpSocketFactory = async (host, port) => {
  const { connect } = await import('cloudflare:sockets');
  const socket = connect(
    { hostname: host, port },
    { secureTransport: 'on', allowHalfOpen: false }
  );
  try {
    await socket.opened;
  } catch (error) {
    try {
      await socket.close();
    } catch {
      // Ignorado.
    }
    throw error;
  }
  return socket as unknown as SmtpSocket;
};
