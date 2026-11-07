import {
    getDatabase
} from '../database/database';





export async function obtenerAlertasSalud(){


    const db =
        await getDatabase();



    const tratamiento =

        await db.getAllAsync(

            `
            SELECT

                a.id,

                a.codigo,

                julianday('now') -
                julianday(
                    COALESCE(
                        a.fecha_ultimo_control_salud,
                        CURRENT_TIMESTAMP
                    )
                ) AS dias


            FROM aves a


            WHERE a.estado = 'ACTIVA'

            AND a.estado_salud = 'EN_TRATAMIENTO'

            `

        );





    return tratamiento

        .filter(

            item =>

                Number(item.dias || 0) >= 7

        )


        .map(

            item => ({


                tipo:

                    'SALUD',



                nivel:

                    'ALTO',



                titulo:

                    'Ave en tratamiento prolongado',



                mensaje:

                    `El ave ${item.codigo} lleva ${Math.floor(item.dias)} días en tratamiento.`,



                entidadId:

                    item.id,



                accion:

                    'DETALLE_AVE',



                accionDestino:

                    'DETALLE_AVE'


            })

        );


}









export async function obtenerAlertasJaulas(){


    const db =

        await getDatabase();





    const jaulas =

        await db.getAllAsync(

            `
            SELECT

                id,

                codigo


            FROM jaulas


            WHERE activa = 1

            `

        );





    const alertas = [];





    for(const jaula of jaulas){



        const alimento =

            await db.getFirstAsync(

                `
                SELECT

                    COUNT(*) AS total


                FROM alimentacion_jaula


                WHERE jaula_id = ?


                AND date(fecha)=date('now')


                `,

                [

                    jaula.id

                ]

            );





        if(

            Number(alimento?.total || 0) === 0

        ){


            alertas.push({


                tipo:

                    'JAULA',



                nivel:

                    'MEDIO',



                titulo:

                    'Sin alimentación registrada',



                mensaje:

                    `La jaula ${jaula.codigo} no tiene alimentación registrada hoy.`,



                entidadId:

                    jaula.id,



                accion:

                    'DETALLE_JAULA',



                accionDestino:

                    'ALIMENTACION_JAULA'


            });


        }






        const bebida =

            await db.getFirstAsync(

                `
                SELECT

                    COUNT(*) AS total


                FROM bebida_jaula


                WHERE jaula_id = ?


                AND date(fecha)=date('now')


                `,

                [

                    jaula.id

                ]

            );





        if(

            Number(bebida?.total || 0) === 0

        ){


            alertas.push({


                tipo:

                    'JAULA',



                nivel:

                    'MEDIO',



                titulo:

                    'Sin bebida registrada',



                mensaje:

                    `La jaula ${jaula.codigo} no tiene bebida registrada hoy.`,



                entidadId:

                    jaula.id,



                accion:

                    'DETALLE_JAULA',



                accionDestino:

                    'BEBIDA_JAULA'


            });


        }


    }





    return alertas;


}









export async function obtenerAlertasProduccion(){


    const db =

        await getDatabase();





    const produccion =

        await db.getFirstAsync(

            `
            SELECT

                COUNT(*) AS total


            FROM huevos


            WHERE date(fecha)=date('now')


            `

        );





    if(

        Number(produccion?.total || 0) === 0

    ){


        return [


            {


                tipo:

                    'PRODUCCION',



                nivel:

                    'MEDIO',



                titulo:

                    'Sin producción registrada',



                mensaje:

                    'No existen huevos registrados hoy.',



                entidadId:

                    null,



                accion:

                    null,



                accionDestino:

                    null


            }


        ];

    }





    return [];


}









export async function obtenerAlertasFinanzas(){


    const db =

        await getDatabase();





    const resultado =

        await db.getFirstAsync(

            `
            SELECT


                COALESCE(
                    SUM(
                        CASE
                            WHEN tipo='INGRESO'
                            THEN valor
                            ELSE 0
                        END
                    ),
                    0
                ) AS ingresos,



                COALESCE(
                    SUM(
                        CASE
                            WHEN tipo='EGRESO'
                            THEN valor
                            ELSE 0
                        END
                    ),
                    0
                ) AS egresos



            FROM movimientos_financieros



            WHERE strftime('%Y-%m',fecha)

                =

                strftime('%Y-%m','now')

            `

        );





    if(

        Number(resultado?.egresos || 0)

        >

        Number(resultado?.ingresos || 0)

    ){


        return [

            {


                tipo:

                    'FINANZAS',



                nivel:

                    'ALTO',



                titulo:

                    'Gastos superiores a ingresos',



                mensaje:

                    'Los egresos del mes superan los ingresos registrados.',



                entidadId:

                    null,



                accion:

                    null,



                accionDestino:

                    null


            }


        ];

    }





    return [];

}









export async function obtenerTodasLasAlertas(){



    const [

        salud,

        jaulas,

        produccion,

        finanzas


    ] = await Promise.all([



        obtenerAlertasSalud(),



        obtenerAlertasJaulas(),



        obtenerAlertasProduccion(),



        obtenerAlertasFinanzas()



    ]);





    return [


        ...salud,


        ...jaulas,


        ...produccion,


        ...finanzas


    ];

}









export async function obtenerResumenAlertas(){



    const alertas =

        await obtenerTodasLasAlertas();





    return {


        total:

            alertas.length,



        criticas:

            alertas.filter(

                item =>

                    item.nivel === 'ALTO'

            ).length,



        advertencias:

            alertas.filter(

                item =>

                    item.nivel === 'MEDIO'

            ).length


    };


}