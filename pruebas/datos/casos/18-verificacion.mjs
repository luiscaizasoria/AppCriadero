// Verificacion de correo. Solo corre si el Worker de pruebas tiene EMAIL_VERIFICATION_REQUIRED=true y hay
// VERIFICATION_BYPASS_SECRET en el PC; si no, cada caso se marca OMITIDO (paso) con el motivo. El secreto nunca se imprime.
import { prueba, assert } from '../lib/arnes.mjs';
import { http, registrarSinVerificar } from '../lib/http.mjs';
import { claveAleatoria, DOMINIO, secretoVerificacion } from '../lib/entorno.mjs';

const sufijo = Date.now().toString(36);
const A = { email: `verif-${sufijo}-a@${DOMINIO}`, password: claveAleatoria() };
const B = { email: `verif-${sufijo}-b@${DOMINIO}`, password: claveAleatoria() };
let estado = null; // { activa: boolean, motivo }

async function detectar() {
    if (estado) return estado;
    if (!secretoVerificacion()) return (estado = { activa: false, motivo: 'sin VERIFICATION_BYPASS_SECRET en el PC' });
    // Un registro sin cabeceras devuelve token solo si la bandera esta apagada (cuenta desechable, la limpia el ejecutor).
    const sonda = await http('POST', '/api/v1/auth/register', { body: { nombre: 'verif-sonda', email: `verif-${sufijo}-sonda@${DOMINIO}`, password: claveAleatoria() } });
    if (sonda.data?.accessToken) return (estado = { activa: false, motivo: 'EMAIL_VERIFICATION_REQUIRED apagada en el Worker' });
    return (estado = { activa: true, motivo: '' });
}

// Registra la prueba; si la bandera esta apagada el caso queda OMITIDO (no falla).
function caso(nombre, fn) {
    prueba('verificacion', nombre, async () => {
        const e = await detectar();
        if (!e.activa) { console.log(`      OMITIDO: ${e.motivo}`); return; }
        await fn();
    });
}

caso('debe crear la cuenta sin verificar con codigo de prueba y bloquear el login con EMAIL_NOT_VERIFIED', async () => {
    const r = await registrarSinVerificar('verif-A', A.email, A.password);
    assert.match(r.codigo, /^\d{6}$/);
    A.codigo = r.codigo;
    const login = await http('POST', '/api/v1/auth/login', { body: { email: A.email, password: A.password } });
    assert.equal(login.status, 403, JSON.stringify(login.json));
    assert.equal(login.error, 'EMAIL_NOT_VERIFIED');
    assert.equal(login.data?.accessToken, undefined);
});

caso('debe rechazar un codigo incorrecto con 400', async () => {
    const mal = A.codigo === '000000' ? '111111' : '000000';
    const r = await http('POST', '/api/v1/auth/verification/verify', { body: { email: A.email, code: mal } });
    assert.equal(r.status, 400, JSON.stringify(r.json));
    assert.equal(r.error, 'INVALID_VERIFICATION_CODE');
});

caso('debe rechazar los endpoints protegidos sin token con 401', async () => {
    const r = await http('GET', '/api/v1/criaderos');
    assert.ok([401, 403].includes(r.status), String(r.status));
});

caso('debe verificar con el codigo correcto, devolver token valido y permitir el login normal', async () => {
    const r = await http('POST', '/api/v1/auth/verification/verify', { body: { email: A.email, code: A.codigo } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.ok(r.data?.accessToken);
    const lista = await http('GET', '/api/v1/criaderos', { token: r.data.accessToken });
    assert.equal(lista.status, 200, JSON.stringify(lista.json));
    const login = await http('POST', '/api/v1/auth/login', { body: { email: A.email, password: A.password } });
    assert.equal(login.status, 200, JSON.stringify(login.json));
    assert.ok(login.data?.accessToken);
});

caso('debe limitar el reenvio antes de 60 s con RATE_LIMITED', async () => {
    const r = await registrarSinVerificar('verif-B', B.email, B.password);
    B.codigo = r.codigo;
    const re = await http('POST', '/api/v1/auth/verification/resend', { body: { email: B.email } });
    assert.equal(re.status, 429, JSON.stringify(re.json));
    assert.equal(re.error, 'RATE_LIMITED');
});

caso('debe agotar los intentos tras 5 codigos fallidos con VERIFICATION_ATTEMPTS_EXCEEDED', async () => {
    const mal = B.codigo === '000000' ? '111111' : '000000';
    let ultimo = null;
    for (let i = 0; i < 6; i++) {
        ultimo = await http('POST', '/api/v1/auth/verification/verify', { body: { email: B.email, code: mal } });
        if (ultimo.error === 'VERIFICATION_ATTEMPTS_EXCEEDED') break;
    }
    assert.equal(ultimo.error, 'VERIFICATION_ATTEMPTS_EXCEEDED', JSON.stringify(ultimo.json));
    // Con el codigo correcto tampoco se entra: el codigo quedo invalidado.
    const r = await http('POST', '/api/v1/auth/verification/verify', { body: { email: B.email, code: B.codigo } });
    assert.notEqual(r.status, 200, JSON.stringify(r.json));
});

caso('debe rechazar el cambio de correo con contrasena incorrecta con 401', async () => {
    const r = await http('POST', '/api/v1/auth/verification/change-email', {
        body: { email: B.email, password: 'Incorrecta-1', nuevoEmail: `verif-${sufijo}-c@${DOMINIO}` }
    });
    assert.equal(r.status, 401, JSON.stringify(r.json));
});
