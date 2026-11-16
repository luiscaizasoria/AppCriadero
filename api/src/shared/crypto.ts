/**
 * Utilidades criptograficas compartidas (Web Crypto, sin PBKDF2).
 */

/** Comparacion en tiempo constante de dos cadenas. */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, '0');
  }
  return out;
}

/** hex(SHA-256(texto)). */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text)
  );
  return toHex(new Uint8Array(digest));
}

/** Sal aleatoria de 16 bytes en base64. */
export function generateSaltBase64(): string {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return btoa(String.fromCharCode(...salt));
}

/** Codigo numerico de 6 digitos con rechazo de sesgo. */
export function generateNumericCode(): string {
  const limit = 4_294_000_000; // multiplo de 1 000 000 por debajo de 2^32
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return String(buffer[0] % 1_000_000).padStart(6, '0');
}

/** Compara dos secretos en tiempo constante; falsos si alguno esta vacio. */
export function secretsMatch(
  expected: string | undefined | null,
  received: string | undefined | null
): boolean {
  if (!expected || !received) {
    return false;
  }
  return constantTimeCompare(expected, received);
}
