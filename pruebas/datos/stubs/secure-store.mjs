// Sustituto en memoria de expo-secure-store para ejecutar los clientes REST en Node.
const memoria = new Map();

export async function getItemAsync(clave) {
    return memoria.has(clave) ? memoria.get(clave) : null;
}

export async function setItemAsync(clave, valor) {
    memoria.set(clave, String(valor));
}

export async function deleteItemAsync(clave) {
    memoria.delete(clave);
}
