# Pendiente de comprobar solo en el teléfono (Android, Expo Go)

Lo que el emulador y esbuild no demuestran. Cada punto: qué hacer y qué resultado esperar.

1. Scroll automático al campo con error (`useValidacion`: `measureLayout` y `getInnerViewRef`).
   Hacer: en Nueva ave, Nuevo movimiento y Criadero nuevo, dejar vacío un campo lejano y guardar.
   Esperado: la pantalla se desplaza hasta el primer campo con borde rojo y su mensaje queda visible.

2. Foco que llega ~350 ms después y puede perderse bajo el Alert nativo de Android.
   Hacer: provocar un error que muestre Alert y cerrarlo con «Aceptar».
   Esperado: el borde rojo y el mensaje siguen visibles; si el teclado no sube solo, es aceptable (anotar si pasa).

3. Liberación del botón y del guard tras guardar y tras error.
   Hacer: guardar con éxito (el botón dice «Guardando...» y se apaga); luego provocar un fallo (modo avión) en Nuevo movimiento, Salud y Eliminar jaula, y reintentar.
   Esperado: tras el error aparece el Alert «Error», el botón vuelve a su texto y un segundo toque funciona; el doble toque rápido no duplica el registro.

4. Textos de progreso: «Cerrando...» (Más y Tu criadero) y «Eliminando...» (jaula).
   Esperado: el texto cambia, el botón queda inerte y al terminar se navega como antes.

5. Aviso de Salud en la ficha del ave.
   Hacer: ficha del ave, Salud, registrar diagnóstico y guardar.
   Esperado: vuelve a la ficha y aparece «Registro guardado» (se cierra solo); al abrir otra pantalla y volver a la ficha no reaparece.

6. «Padres inválidos» en Nueva ave: elegir la misma ave como padre y madre no es posible por filtro de sexo; probar el aviso de la API si se puede forzar.
   Esperado: bordes rojos en Padre y Madre con el mensaje, además del Alert; al elegir otro padre o madre el rojo desaparece.

7. Acceso con varios campos vacíos (Login, Registro, Criadero nuevo).
   Esperado: todos los vacíos con borde rojo y mensaje; foco y scroll al primero.

8. Corrección de venta: teclear letras o coma en «Valor del ave» o «Valor de envío».
   Esperado: la coma se vuelve punto, las letras se ven y al guardar sale «Valor inválido»; «Valor» de un movimiento sigue ignorando letras.

9. Iconos nuevos: jaula (pestañas Jaulas, listas), ciclo de vida (reloj de arena) y limpieza (brocha).
   Esperado: se reconocen a tamaño normal y en la pestaña activa (jaula rellena con barras claras).

10. Tarjetas de alertas con fuente grande (Ajustes del teléfono: tamaño de fuente al máximo).
    Esperado: textos y cifras sin cortarse y sin solaparse.

11. Fluidez en gama baja: desplazar las listas de Aves y Jaulas con muchos elementos.
    Esperado: sin saltos notorios; avisos y transiciones sin tirones.

12. Ausencia de LogBox: recorrer las pantallas tocadas.
    Esperado: sin avisos amarillos ni pantallas rojas.

Puntos añadidos el 2026-11-24 (cambios posteriores a la fase UX; no hay evidencia de que se hayan comprobado en el teléfono).
Arranque de Expo Go: `npx expo start --go --tunnel --port 8090`.

13. Botón «Continuar con Google» en Expo Go.
    Hacer: en Login o Registro, tocar el botón.
    Esperado: solo aparece un aviso (Google real exige el development build con EAS); la app no se cierra. Con la bandera de verificación apagada, la API respondería 403 si se llegara a llamar.

14. Inicio navegable.
    Hacer: tocar los accesos y tarjetas de Inicio.
    Esperado: cada uno lleva a su pantalla; al volver, Inicio sigue mostrando datos.

15. Colores por estado en Jaulas y Aves.
    Hacer: recorrer las listas con jaulas y aves en distintos estados (incluida una ave con Quemadura).
    Esperado: cada estado tiene su color; Quemadura sale en naranja; texto legible.

16. Alertas de Salud.
    Hacer: abrir Alertas con un ave cuyo último control cumple 7 días.
    Esperado: la alerta aparece solo el día (UTC) en que se cumplen los 7 días, no los días siguientes.

17. Verificación de cuenta por código (bandera apagada).
    Hacer: registrar una cuenta nueva.
    Esperado: entra sin pedir código, igual que antes.

18. Icono cuadrado nuevo.
    Esperado: solo se ve en el launcher de un build (no en Expo Go); comprobarlo cuando exista el development build.

19. Módulos de la fase 6 (Bajas, Finanzas, Clientes, Reportes, Alertas, Inicio), sin probar aún en teléfono.
    Hacer: registrar una baja por venta y otra por muerte; revisar Finanzas, Clientes, Reportes (exportar) y Alertas.
    Esperado: mismos resultados que en V1; con modo avión, las pantallas de lectura muestran error con «Reintentar».
