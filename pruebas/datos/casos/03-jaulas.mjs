import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';

const datos = (codigo, extra = {}) => ({ codigo, nombre: `Jaula ${codigo}`, ubicacion: 'Patio', tipo: 'Reproduccion', ...extra });

prueba('jaulas', 'debe crear jaulas, listarlas con cantidad_aves 0 y rechazar el codigo duplicado', async () => {
    const { jaulas } = ctx.clientes;
    await entrarComo(ctx.A);
    const id1 = await jaulas.crearJaula(datos('J-01'));
    const id2 = await jaulas.crearJaula(datos('J-02'));
    assert.ok(id1 && id2);
    const lista = await jaulas.obtenerJaulas();
    assert.deepEqual(lista.map(j => j.codigo).sort(), ['J-01', 'J-02']);
    assert.ok(lista.every(j => j.cantidad_aves === 0));
    await assert.rejects(jaulas.crearJaula(datos('J-01')), /UNIQUE constraint failed: jaulas\.codigo/);
    ctx.jaulaIds = { j1: id1, j2: id2 };
});

prueba('jaulas', 'debe editar una jaula y prohibir el duplicado al editar', async () => {
    const { jaulas } = ctx.clientes;
    await entrarComo(ctx.A);
    await jaulas.actualizarJaula({ id: ctx.jaulaIds.j2, ...datos('J-02', { nombre: 'Editada' }) });
    const d = await jaulas.obtenerJaulaPorId(ctx.jaulaIds.j2);
    assert.equal(d.nombre, 'Editada');
    await assert.rejects(jaulas.actualizarJaula({ id: ctx.jaulaIds.j2, ...datos('J-01') }), /UNIQUE/);
});

prueba('jaulas', 'debe desactivar una jaula y moverla a inactivas', async () => {
    const { jaulas } = ctx.clientes;
    await entrarComo(ctx.A);
    const r = await jaulas.desactivarJaula(ctx.jaulaIds.j2);
    assert.equal(r.cantidadAvesLiberadas, 0);
    assert.deepEqual((await jaulas.obtenerJaulas()).map(j => j.codigo), ['J-01']);
    assert.deepEqual((await jaulas.obtenerJaulasInactivas()).map(j => j.codigo), ['J-02']);
});
