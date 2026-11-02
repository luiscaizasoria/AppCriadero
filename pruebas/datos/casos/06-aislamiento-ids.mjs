import { prueba, assert } from '../lib/arnes.mjs';
import { ctx } from '../lib/contexto.mjs';
import { http } from '../lib/http.mjs';
import { api, recorrer } from '../lib/aislamiento.mjs';

prueba('aislamiento', 'debe dar 404 (o vacio sin datos de B) a A con ids de B en su criadero', async () => {
    const a = api(ctx.A.criaderoId);
    const B = ctx.sembradoB;
    const miAve = ctx.idsAves.padre;
    const miJaula = ctx.jaulaIds.j1;
    await recorrer('ids ajenos en criadero propio', [
        ['GET', `${a}/aves/${B.aveId}`, undefined, [404]],
        ['GET', `${a}/aves/${B.aveId}/historial`, undefined, [404, 200]],
        ['PUT', `${a}/aves/${B.aveId}`, { codigo: 'HACK', origen: 'COMPRADA' }, [404]],
        ['PUT', `${a}/aves/${B.aveId}/jaula`, { nuevaJaulaId: miJaula, jaulaAnteriorId: null, codigoAve: 'B-AVE' }, [404]],
        ['POST', `${a}/aves/${B.aveId}/eventos`, { tipoEvento: 'SALUD', detalle: 'x' }, [404]],
        ['POST', `${a}/aves/${B.aveId}/evolucion`, { fecha: '2026-01-01' }, [404, 400]],
        ['POST', `${a}/aves/${B.aveId}/finalizar-tratamiento`, {}, [404]],
        ['GET', `${a}/aves/por-jaula/${B.jaulaId}`, undefined, [404, 200]],
        ['GET', `${a}/aves/para-asignar-jaula?jaulaId=${B.jaulaId}`, undefined, [404, 200]],
        ['GET', `${a}/aves/existe-codigo?codigo=B-AVE`, undefined, [200]],
        ['POST', `${a}/aves`, { codigo: 'A-HACK1', origen: 'COMPRADA', padreId: B.aveId }, [404, 400]],
        ['POST', `${a}/aves`, { codigo: 'A-HACK2', origen: 'COMPRADA', madreId: B.aveId }, [404, 400]],
        ['POST', `${a}/aves`, { codigo: 'A-HACK3', origen: 'COMPRADA', jaulaId: B.jaulaId }, [404, 400]],
        ['PUT', `${a}/aves/${miAve}`, { codigo: 'A-PADRE', origen: 'COMPRADA', padreId: B.aveId }, [404, 400]],
        ['PUT', `${a}/aves/${miAve}/jaula`, { nuevaJaulaId: B.jaulaId, jaulaAnteriorId: null, codigoAve: 'A-PADRE' }, [404, 400]],
        ['GET', `${a}/jaulas/${B.jaulaId}`, undefined, [404]],
        ['GET', `${a}/jaulas/${B.jaulaId}/aves-historicas`, undefined, [404, 200]],
        ['GET', `${a}/jaulas/${B.jaulaId}/historial`, undefined, [404, 200]],
        ['PUT', `${a}/jaulas/${B.jaulaId}`, { codigo: 'HACK', nombre: 'x', ubicacion: 'x', tipo: 'x' }, [404]],
        ['DELETE', `${a}/jaulas/${B.jaulaId}`, undefined, [404]],
        ['PUT', `${a}/catalogos/RAZAS/items/${B.itemId}`, { nombre: 'HACK' }, [404]],
        ['DELETE', `${a}/catalogos/RAZAS/items/${B.itemId}`, undefined, [404]]
    ]);
});

prueba('aislamiento', 'debe listar solo datos propios en todas las listas de A', async () => {
    const a = api(ctx.A.criaderoId);
    const j1 = ctx.jaulaIds.j1;
    const listas = [
        '/aves', '/aves?estado=VENDIDA', '/aves?estado=FALLECIDA', '/aves/candidatas-padres',
        `/aves/para-asignar-jaula?jaulaId=${j1}`, `/aves/por-jaula/${j1}`, `/aves/${ctx.idsAves.padre}/historial`,
        '/jaulas', '/jaulas?estado=INACTIVA', `/jaulas/${j1}/historial`, `/jaulas/${j1}/aves-historicas`,
        '/catalogos', '/catalogos/RAZAS/items', '/catalogos/SEXOS/items'
    ];
    await recorrer('listas de A', listas.map(r => ['GET', `${a}${r}`, undefined, [200]]));
    const crs = await http('GET', '/api/v1/criaderos', { token: ctx.A.token });
    const ids = (crs.data.criaderos ?? []).map(c => c.id);
    const ok = ids.length === 1 && ids[0] === ctx.A.criaderoId;
    ctx.tabla.push({ grupo: 'listas de A', endpoint: 'GET /criaderos', esperado: 'solo el propio', obtenido: ok ? 'solo el propio' : 'OTROS', fuga: !ok, ok });
    assert.ok(ok, 'GET /criaderos devuelve criaderos ajenos');
});

prueba('aislamiento', 'debe dejar intactos los datos de B tras los ataques de A', async () => {
    const b = api(ctx.B.criaderoId);
    const B = ctx.sembradoB;
    const jaula = await http('GET', `${b}/jaulas/${B.jaulaId}`, { token: ctx.B.token });
    assert.equal(jaula.status, 200);
    assert.equal(jaula.data.jaula.codigo, 'B-JAULA');
    assert.ok(jaula.data.jaula.activa === 1 || jaula.data.jaula.activa === true, 'la jaula de B debe seguir activa');
    const ave = await http('GET', `${b}/aves/${B.aveId}`, { token: ctx.B.token });
    assert.equal(ave.data.ave.codigo, 'B-AVE');
    assert.equal(ave.data.ave.jaulaActualId, B.jaulaId);
    const items = await http('GET', `${b}/catalogos/RAZAS/items`, { token: ctx.B.token });
    const item = items.data.items.find(i => i.id === B.itemId);
    assert.ok(item && item.nombre === 'Raza de B' && item.activo, 'el item de B debe seguir igual');
    const codigos = (await http('GET', `${b}/aves`, { token: ctx.B.token })).data.aves.map(x => x.codigo);
    assert.deepEqual(codigos, ['B-AVE']);
});
