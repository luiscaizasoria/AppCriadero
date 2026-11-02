// Estado compartido entre casos (cuentas desechables, ids sembrados, clientes reales).
export const ctx = {
    clientes: null,
    A: null,
    B: null,
    sembradoB: {},
    jaulaIds: {},
    idsAves: {},
    tabla: []
};

export async function entrarComo(cuenta) {
    const { acceso, sesion } = ctx.clientes;
    await sesion.cerrarSesion();
    await acceso.iniciarSesion({ email: cuenta.email, password: cuenta.password });
    await acceso.seleccionarCriadero(cuenta.criaderoId);
}
