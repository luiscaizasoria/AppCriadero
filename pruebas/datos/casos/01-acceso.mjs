import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';
import { http } from '../lib/http.mjs';

prueba('acceso', 'debe responder 401 sin token en un endpoint protegido', async () => {
    const r = await http('GET', '/api/v1/criaderos');
    assert.equal(r.status, 401);
    assert.equal(r.error, 'UNAUTHORIZED');
});

prueba('acceso', 'debe responder 401 con un token invalido', async () => {
    const r = await http('GET', '/api/v1/criaderos', { token: 'no.es.token' });
    assert.equal(r.status, 401);
});

prueba('acceso', 'debe rechazar contrasena incorrecta en el inicio de sesion', async () => {
    const { acceso } = ctx.clientes;
    await assert.rejects(acceso.iniciarSesion({ email: ctx.A.email, password: 'Incorrecta-1' }));
});

prueba('acceso', 'debe iniciar sesion con el cliente real y listar solo sus criaderos', async () => {
    const { acceso } = ctx.clientes;
    await entrarComo(ctx.A);
    const lista = await acceso.listarCriaderos();
    assert.deepEqual(lista.map(c => c.id), [ctx.A.criaderoId]);
});

prueba('acceso', 'debe cerrar la sesion del cliente al recibir 401 (sesion invalida)', async () => {
    const { sesion, jaulas, acceso } = ctx.clientes;
    await entrarComo(ctx.A);
    await sesion.guardarSesion({ accessToken: 'token-corrupto', expiresIn: 3600 });
    await acceso.seleccionarCriadero(ctx.A.criaderoId);
    await assert.rejects(jaulas.obtenerJaulas());
    assert.equal(await sesion.obtenerToken(), null);
});
