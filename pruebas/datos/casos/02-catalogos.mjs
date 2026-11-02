import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';

prueba('catalogos', 'debe sembrar 42 items al crear el criadero y listar los 7 catalogos de V1', async () => {
    const { config } = ctx.clientes;
    await entrarComo(ctx.A);
    const catalogos = await config.obtenerCatalogos();
    assert.equal(ctx.A.generados, 42);
    assert.equal(catalogos.length, 7);
    let total = 0;
    for (const c of catalogos) total += (await config.obtenerItemsCatalogo(c.id)).length;
    assert.equal(total, 31);
});

prueba('catalogos', 'debe crear, editar y desactivar un item y rechazar el duplicado', async () => {
    const { config } = ctx.clientes;
    await entrarComo(ctx.A);
    const razas = await config.obtenerCatalogoPorCodigo('RAZAS');
    assert.ok(razas);
    const antes = (await config.obtenerItemsCatalogo(razas.id)).length;

    await config.crearItemCatalogo({ catalogoId: razas.id, codigo: 'RAZA_PRUEBA', nombre: 'Raza prueba', descripcion: 'd' });
    let items = await config.obtenerItemsCatalogo(razas.id);
    assert.equal(items.length, antes + 1);
    const item = items.find(i => i.codigo === 'RAZA_PRUEBA');

    await assert.rejects(
        config.crearItemCatalogo({ catalogoId: razas.id, codigo: 'RAZA_PRUEBA', nombre: 'Otra' }),
        /UNIQUE/i
    );

    await config.actualizarItemCatalogo({ id: item.id, nombre: 'Raza editada', descripcion: null });
    items = await config.obtenerItemsCatalogo(razas.id);
    assert.equal(items.find(i => i.id === item.id).nombre, 'Raza editada');

    await config.eliminarItemCatalogo(item.id);
    items = await config.obtenerItemsCatalogo(razas.id);
    const tras = items.find(i => i.id === item.id);
    assert.ok(!tras || tras.activo === 0, 'el item debe quedar inactivo u oculto');
});

prueba('catalogos', 'debe devolver null para un catalogo inexistente (como V1)', async () => {
    const { config } = ctx.clientes;
    await entrarComo(ctx.A);
    assert.equal(await config.obtenerCatalogoPorCodigo('NO_EXISTE'), null);
});
