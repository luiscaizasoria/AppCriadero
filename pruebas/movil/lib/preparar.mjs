// Prepara datos por API (no navegando) para un flujo: cuenta desechable + criadero + datos opcionales.
// Uso: node pruebas/movil/lib/preparar.mjs [--jaulas=J-01,J-02] [--aves=A-01:MACHO,A-02:HEMBRA] [--huevos=A-01:J-01:0]
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
// --huevos=AVE:JAULA:DIAS_ATRAS,... (JAULA puede ir vacia). El instante es ahora menos N dias (UTC), asi los flujos
// ven huevos "de hoy" y de dias pasados sin depender de una fecha fija.
for (const par of (arg('huevos') || '').split(',').filter(Boolean)) {
    const [ave, jaula, dias] = par.split(':');
    const fecha = new Date(Date.now() - Number(dias || 0) * 86400000).toISOString();
    const r = await http('POST', `${base}/aves/${salida.aves[ave]}/huevos`, { token: cuenta.token, body: { fecha, jaulaId: jaula ? salida.jaulas[jaula] : undefined } });
    if (r.status !== 201) throw new Error(`huevo ${par}: ${JSON.stringify(r.json)}`);
}
console.log(JSON.stringify(salida));
