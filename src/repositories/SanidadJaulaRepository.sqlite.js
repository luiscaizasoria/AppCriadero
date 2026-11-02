import { getDatabase } from '../database/database';

import {
    registrarHistorialJaula
} from './HistorialRepository';

export async function registrarSanidadJaula({
    jaulaId,
    fecha,
    tipo,
    detalle
}) {

    const db = await getDatabase();

    await db.withTransactionAsync(async()=>{

        await db.runAsync(
            `
            INSERT INTO sanidad_jaula
            (
                jaula_id,
                fecha,
                tipo,
                detalle
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                jaulaId,
                fecha,
                tipo,
                detalle || null
            ]
        );

        await db.runAsync(
            `
            UPDATE jaulas
            SET
                estado_sanitario = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
                normalizarEstado(tipo),
                jaulaId
            ]
        );

        await registrarHistorialJaula({
            jaulaId,
            tipoEvento:'SANIDAD',
            fecha,
            detalle:`Sanidad: ${tipo}${detalle ? ' | '+detalle : ''}`,
            db
        });

    });
}

function normalizarEstado(tipo){

    switch(tipo){

        case 'Normal':
            return 'NORMAL';

        case 'Limpieza':
            return 'LIMPIEZA';

        case 'Fumigación':
            return 'FUMIGACION';

        case 'Quemadura':
            return 'QUEMADURA';

        case 'Cuarentena':
            return 'CUARENTENA';

        default:
            return 'NORMAL';
    }
}
