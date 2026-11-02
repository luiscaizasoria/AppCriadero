// Prepara datos por API (no navegando) para un flujo: cuenta desechable + criadero + datos opcionales.
// Uso: node pruebas/movil/lib/preparar.mjs [--jaulas=J-01,J-02] [--aves=A-01:MACHO,A-02:HEMBRA]
// Imprime JSON {email,password,criadero,...}. Nada se escribe en archivos del repositorio.
import { registrar, crearCriaderoHttp, http } from '../../datos/lib/http.mjs';
import { claveAleatoria, DOMINIO } from '../../datos/lib/entorno.mjs';

const arg = n => process.argv.find(a => a.startsWith(`--${n}=`))?.split('=')[1];
const sufijo = Date.now().toString(36);
const email = `movil-${sufijo}@${DOMINIO}`;
const password = claveAleatoria();
const cuenta = await registrar('Prueba movil', email, password);
const nombreCriadero = 'Criadero movil';
const criaderoId = await crearCriaderoHttp(cuenta.token, nombreCriadero);
const base = `/api/v1/criaderos/${criaderoId}`;
const salida = { email, password, criadero: nombreCriadero, criaderoId, jaulas: {}, aves: {} };

for (const codigo of (arg('jaulas') || '').split(',').filter(Boolean)) {
    const r = await http('POST', `${base}/jaulas`, { token: cuenta.token, body: { codigo, nombre: `Jaula ${codigo}`, ubicacion: 'Patio', tipo: 'General' } });
    if (r.status !== 201) throw new Error(`jaula ${codigo}: ${JSON.stringify(r.json)}`);
    salida.jaulas[codigo] = r.data.jaula.id;
}
for (const par of (arg('aves') || '').split(',').filter(Boolean)) {
    const [codigo, sexo, jaula, padre, madre] = par.split(':');
    const body = { codigo, origen: 'NACIDA_CRIADERO', fechaNacimiento: '2026-01-01', raza: 'Kikiris', sexo: sexo || null, jaulaId: jaula ? salida.jaulas[jaula] : null, padreId: padre ? salida.aves[padre] : null, madreId: madre ? salida.aves[madre] : null };
    const r = await http('POST', `${base}/aves`, { token: cuenta.token, body });
    if (r.status !== 201) throw new Error(`ave ${codigo}: ${JSON.stringify(r.json)}`);
    salida.aves[codigo] = r.data.ave.id;
}
console.log(JSON.stringify(salida));
