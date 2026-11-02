// Plantilla de catalogos de un criadero nuevo: 42 items en D1 (10 catalogos) y nada desaparece.
// La API expone 7 catalogos (los de V1, 31 items); los 3 de onboarding (11 items) no se exponen (RC-CAT-04).
import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';
import { itemsPorCatalogo } from '../lib/limpiar.mjs';

const ESPERADO = {
    ALIMENTOS: 2, BEBIDAS: 2, CATEGORIAS_FINANCIERAS: 8, ENFERMEDADES: 4, MEDICAMENTOS: 4, RAZAS: 9, SEXOS: 2,
    ESPECIES: 5, FINALIDADES_CRIADERO: 3, TIPOS_CRIADERO: 3
};
const V1 = ['ALIMENTOS', 'BEBIDAS', 'CATEGORIAS_FINANCIERAS', 'ENFERMEDADES', 'MEDICAMENTOS', 'RAZAS', 'SEXOS'];

prueba('catalogos', 'debe guardar en D1 los 42 items de la plantilla por catalogo (ninguno desaparece)', async () => {
    const reales = itemsPorCatalogo(ctx.B.criaderoId);
    // B sembro 1 item extra en RAZAS (aislamiento): se descuenta para comparar la plantilla.
    reales.RAZAS -= 1;
    assert.deepEqual(reales, ESPERADO);
    assert.equal(Object.values(reales).reduce((a, n) => a + n, 0), 42);
});

prueba('catalogos', 'debe listar por API los 7 catalogos de V1 con todos sus items (31) y no exponer los de onboarding', async () => {
    const { config } = ctx.clientes;
    await entrarComo(ctx.A);
    const catalogos = await config.obtenerCatalogos();
    assert.deepEqual(catalogos.map(c => c.codigo).sort(), V1);
    for (const c of catalogos) {
        const items = await config.obtenerItemsCatalogo(c.id);
        // A pudo anadir y desactivar un item de RAZAS en otro caso: los activos de plantilla siguen todos.
        const plantilla = items.filter(i => i.activo === 1 && !/PRUEBA/.test(i.codigo));
        assert.equal(plantilla.length, ESPERADO[c.codigo], `${c.codigo}: faltan items de plantilla`);
    }
    for (const oculto of ['ESPECIES', 'TIPOS_CRIADERO', 'FINALIDADES_CRIADERO']) {
        assert.equal(await config.obtenerCatalogoPorCodigo(oculto), null, `${oculto} no debe exponerse`);
    }
});
