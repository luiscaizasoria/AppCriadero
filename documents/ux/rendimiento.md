# Rendimiento de la fase UX (revisión por código, 2026-11-10)

Sin mediciones en dispositivo: todo es lectura de código.

## Revisado
- Listas: solo `AvesScreen` usa `FlatList`. Ya tenía `keyExtractor` (`String(ave.id)`), `initialNumToRender 8` y `windowSize 7`; no está dentro de un `ScrollView` vertical (sin aviso «VirtualizedLists should never be nested»). `JaulasScreen`, Finanzas, Clientes, etc. usan `ScrollView` + `map` con `key` (62 `map`, todos los que dibujan JSX llevan `key`).
- Degradados: `LinearGradient` solo en `PantallaHeader` y `FondoPantalla`, es decir, máximo 2 por pantalla.
- Animaciones: no hay infinitas. `Mascota` usa `Animated.loop` con `iterations` finito (3), con driver nativo, y respeta «reducir movimiento».
- Fuentes: `App.js` espera `useFonts` (tope de 4 s) mostrando la pantalla de espera; no hay parpadeo de fuente salvo que se agote el tope (entonces cambia a la del sistema).

## Cambiado (sin cambio de comportamiento)
- `AveCard`, `Chip` e `IconoCirculo` (usado por `Avatar`) pasan a `React.memo`.
- `AveCard` acepta `onAbrir(ave)` (estable); `AvesScreen` pasa `renderItem`, `keyExtractor` y el manejador con `useCallback`. Al teclear en el buscador solo se redibujan las tarjetas cuyo `ave` cambió. `onPress` sigue admitido.

## Sin cambiar a propósito
- `JaulasScreen` sigue en `ScrollView` + `map`: pasarla a `FlatList` cambia la estructura (flujos Maestro por scroll) y el número de jaulas suele ser bajo. `JaulaCard` no se memoiza porque su `onPress` es una función nueva por render.

## Sin medir (gama baja)
- Tiempo de arrastre de la lista de aves con cientos de registros y fotos; coste de 2 degradados + círculos decorativos en la cabecera; arranque en frío con fuentes; memoria de `Image` con fotos locales sin redimensionar.
