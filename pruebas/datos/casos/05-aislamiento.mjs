// Puerta 1 convertida en pruebas permanentes: A nunca ve ni toca datos de B.
import { prueba } from '../lib/arnes.mjs';
import { ctx } from '../lib/contexto.mjs';
import { api, recorrer } from '../lib/aislamiento.mjs';

prueba('aislamiento', 'debe dar 403 a A en TODOS los endpoints con el criaderoId de B', async () => {
    const b = api(ctx.B.criaderoId);
    const B = ctx.sembradoB;
    const f = [403];
    await recorrer('criaderoId ajeno', [
        ['GET', `${b}/aves`, undefined, f],
        ['GET', `${b}/aves?estado=VENDIDA`, undefined, f],
        ['GET', `${b}/aves/candidatas-padres`, undefined, f],
        ['GET', `${b}/aves/para-asignar-jaula?jaulaId=${B.jaulaId}`, undefined, f],
        ['GET', `${b}/aves/por-jaula/${B.jaulaId}`, undefined, f],
        ['GET', `${b}/aves/existe-codigo?codigo=B-AVE`, undefined, f],
        ['GET', `${b}/aves/${B.aveId}`, undefined, f],
        ['GET', `${b}/aves/${B.aveId}/historial`, undefined, f],
        ['POST', `${b}/aves`, { codigo: 'A-HACK', origen: 'COMPRADA' }, f],
        ['PUT', `${b}/aves/${B.aveId}`, { codigo: 'HACK', origen: 'COMPRADA' }, f],
        ['PUT', `${b}/aves/${B.aveId}/jaula`, { nuevaJaulaId: null, jaulaAnteriorId: null, codigoAve: 'x' }, f],
        ['POST', `${b}/aves/${B.aveId}/eventos`, { tipoEvento: 'SALUD', detalle: 'x' }, f],
        ['POST', `${b}/aves/${B.aveId}/evolucion`, { fecha: '2026-01-01' }, f],
        ['POST', `${b}/aves/${B.aveId}/finalizar-tratamiento`, {}, f],
        ['GET', `${b}/jaulas`, undefined, f],
        ['GET', `${b}/jaulas?estado=INACTIVA`, undefined, f],
        ['GET', `${b}/jaulas/${B.jaulaId}`, undefined, f],
        ['GET', `${b}/jaulas/${B.jaulaId}/aves-historicas`, undefined, f],
        ['GET', `${b}/jaulas/${B.jaulaId}/historial`, undefined, f],
        ['POST', `${b}/jaulas`, { codigo: 'HACK', nombre: 'x', ubicacion: 'x', tipo: 'x' }, f],
        ['PUT', `${b}/jaulas/${B.jaulaId}`, { codigo: 'HACK', nombre: 'x', ubicacion: 'x', tipo: 'x' }, f],
        ['DELETE', `${b}/jaulas/${B.jaulaId}`, undefined, f],
        ['POST', `${b}/jaulas/${B.jaulaId}/alimentacion`, { tipo: 'Balanceado', fecha: new Date().toISOString() }, f],
        ['POST', `${b}/jaulas/${B.jaulaId}/bebida`, { tipo: 'Balanceado', fecha: new Date().toISOString() }, f],
        ['POST', `${b}/jaulas/${B.jaulaId}/sanidad`, { tipo: 'Cuarentena', fecha: new Date().toISOString() }, f],
        ['GET', `${b}/jaulas/${B.jaulaId}/alimentacion`, undefined, f],
        ['GET', `${b}/catalogos`, undefined, f],
        ['GET', `${b}/catalogos/RAZAS`, undefined, f],
        ['GET', `${b}/catalogos/RAZAS/items`, undefined, f],
        ['POST', `${b}/catalogos/RAZAS/items`, { codigo: 'HACK', nombre: 'x' }, f],
        ['PUT', `${b}/catalogos/RAZAS/items/${B.itemId}`, { nombre: 'HACK' }, f],
        ['DELETE', `${b}/catalogos/RAZAS/items/${B.itemId}`, undefined, f],
        ['GET', `${b}/onboarding`, undefined, f],
        ['POST', `${b}/onboarding/complete`, {}, f],
        ['PUT', `${b}/configuracion`, { moneda: 'USD' }, f],
        ['GET', `${b}/clientes`, undefined, f],
        ['GET', `${b}/clientes/0991234567`, undefined, f],
        ['GET', `${b}/clientes/0991234567/compras`, undefined, f]
    ]);
});
