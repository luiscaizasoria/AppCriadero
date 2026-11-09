# Propuesta visual (sub-bloques C1 a C6)

Fecha: 2026-11-09. Estado: PROPUESTA, sin tocar `src/` ni `App.js`. Vista previa: abrir `documents/ux/muestrario-visual.html` en el navegador del PC (selector A / B / Ambas arriba).

Punto de partida: el usuario aprobó la navegación (bloque A) pero no percibe mejora visual. Hoy la app usa `Header` con emoji, tarjetas blancas planas, botones verdes azulados de 15 px y emojis como iconos (se ven distintos en cada teléfono). La transformación propuesta cambia cinco cosas a la vez: paleta, escala tipográfica (cuerpo 16 px, cifras 32 px), botones y campos de 52-56 px, iconos vectoriales en lugar de emojis y una barra de acción principal fija abajo.

Nota de método: la guardia técnica no permite `node`, así que los ratios de contraste de las tablas están **calculados a mano** (luminancia relativa WCAG, precisión de ±0,1). El muestrario HTML recalcula los mismos ratios en el navegador con JavaScript: si alguno difiere, manda el del HTML y se corrige este documento.

---

## 1. Paleta

Idea de negocio que guía las elecciones: criadero de kikirikis en Machachi (Andes, ~2.900 m), campo y naturaleza, uso al aire libre bajo sol fuerte y con las manos ocupadas. Por eso: fondos cálidos tipo paja/crema (no blanco azulado, que deslumbra al sol), verdes de pasto y de pino para confianza y naturaleza, un amarillo maíz de acento (el color de un pollito, destaca a distancia) y texto casi negro verdoso (≥ 13:1) para leer al sol.

Decisión sobre el verde azulado actual (`#2c6e6e`): se conserva solo como **Variante B** (evolución, más contraste). La **recomendación es la Variante A «Campo cálido»**, porque el teal actual es frío y genérico (parece app bancaria) y el usuario pidió que se note el cambio.

### 1.1 Variante A «Campo cálido» (recomendada)

| Rol | Hex | Justificación (una frase) |
|---|---|---|
| Primario | `#2E6B3E` | Verde pasto andino: naturaleza y confianza; botones con texto blanco 6,4:1. |
| Primario oscuro | `#1F4D2B` | Verde pino para cabeceras y texto de énfasis; blanco encima 9,7:1. |
| Primario suave | `#E4EFE2` | Fondo de selección y chips activos, sutil pero distinto del crema. |
| Secundario | `#B4531F` | Terracota de tierra y teja andina; segundo color de marca para enlaces y detalles. |
| Acento | `#F2B632` | Amarillo maíz/pollito: acción principal flotante y llamadas de atención; se ve de lejos al sol; con texto oscuro 8,2:1. |
| Fondo | `#FAF6EC` | Crema paja: descansa la vista al sol y da calidez frente al blanco puro. |
| Superficie (tarjetas) | `#FFFFFF` | Tarjeta blanca sobre fondo crema: separa sin necesitar sombras fuertes. |
| Superficie alterna | `#EFE8D8` | Zonas agrupadas, filas pares, campos deshabilitados. |
| Borde | `#D9D0BA` | Separadores suaves de tarjeta (decorativo). |
| Borde de campo | `#8A8F7C` | Contorno de campos y botones secundarios: 3,3:1 sobre blanco (mínimo AA para componentes). |
| Texto principal | `#1E2A22` | Casi negro verdoso: 14,9:1 sobre blanco y 13,8:1 sobre crema (cumple ≥ 7:1 para sol). |
| Texto secundario | `#556050` | Gris oliva: 6,6:1 sobre blanco y 6,1:1 sobre crema (AA, casi AAA). |
| Éxito | `#17803D` / texto `#0F5A2A` / suave `#E3F3E6` | Verde más vivo que el primario para no confundirse con la marca. |
| Advertencia | `#F2B632` / texto `#6B4A00` / suave `#FFF3CF` | Ámbar; el texto va siempre oscuro. |
| Error | `#B3261E` / texto `#8C1D18` / suave `#FDE8E6` | Rojo ladrillo sobrio, legible al sol. |
| Información | `#1D5F8F` / texto `#124468` / suave `#E3EFF8` | Azul cielo de altura; único azul de la app. |

Salud del ave (siempre icono + texto, nunca solo color): Sana = éxito (`checkmark-circle`), En tratamiento = advertencia (`medkit`), Enferma = error (`alert-circle`).
Alertas: Crítica = error, Advertencia = ámbar, Informativa = azul. Las cuatro categorías (Salud, Jaulas, Producción, Finanzas) se distinguen por icono, no por color.
Ganancias/pérdidas en Finanzas: ingreso = éxito, egreso = error, utilidad = primario oscuro, con signo `+`/`−` además del color.

### 1.2 Variante B «Verde sobrio» (evolución del actual)

| Rol | Hex | Justificación |
|---|---|---|
| Primario | `#0F5F63` | Mismo teal de hoy pero más profundo: blanco encima 7,4:1 (AAA). |
| Primario oscuro | `#0A3F44` | Cabecera y énfasis; blanco 11,6:1. |
| Primario suave | `#E0F0F0` | Selección y chips activos. |
| Secundario | `#B45309` | Naranja tostado, contrapunto cálido del teal. |
| Acento | `#E8871E` | Naranja para la acción flotante; texto oscuro 6,1:1. |
| Fondo / Superficie / Alterna | `#F2F7F7` / `#FFFFFF` / `#E3ECEC` | Frío y limpio, continuidad con la app actual. |
| Borde / Borde de campo | `#D5E0E2` / `#7F9296` | El de campo da 3,2:1 sobre blanco. |
| Texto principal | `#13232B` | 14,9:1 sobre el fondo. |
| Texto secundario | `#4A5A60` | 6,6:1 sobre el fondo. |
| Estados | iguales a la variante A | Los colores semánticos no cambian entre variantes (una sola verdad para éxito, error, etc.). |

### 1.3 Tabla de contraste (calculada a mano; mínimo AA = 4,5:1 texto, 3:1 componentes)

| Par (texto sobre fondo) | A | B | Resultado |
|---|---|---|---|
| Texto principal sobre fondo | 13,8 | 14,9 | AAA, apto sol (≥ 7) |
| Texto principal sobre superficie blanca | 14,9 | 15,9 | AAA, apto sol |
| Texto secundario sobre fondo | 6,1 | 6,6 | AA (casi AAA) |
| Texto secundario sobre superficie alterna | 5,4 | 5,6 | AA |
| Blanco sobre primario (botón) | 6,4 | 7,4 | AA / AAA en B |
| Blanco sobre primario oscuro (cabecera) | 9,7 | 11,6 | AAA |
| Texto oscuro sobre acento (acción flotante) | 8,2 | 6,1 | AAA en A, AA en B |
| Secundario (terracota) como texto sobre blanco | 5,0 | 5,0 | AA |
| Texto éxito oscuro sobre éxito suave | 7,2 | 7,2 | AAA |
| Texto advertencia sobre advertencia suave | 7,3 | 7,3 | AAA |
| Texto error sobre error suave | 7,8 | 7,8 | AAA |
| Texto info sobre info suave | 8,8 | 8,8 | AAA |
| Blanco sobre error (botón peligro) | 6,5 | 6,5 | AA |
| Borde de campo sobre blanco | 3,3 | 3,2 | AA componentes |
| Acento como forma sobre blanco/fondo (sin borde) | 1,8 | 2,65 | **No cumple 3:1**; por eso el flotante y la barra «hoy» de Inicio llevan borde 2 px `primarioOscuro` |
| Borde `primarioOscuro` sobre blanco / sobre acento | ≥ 9,7 / ≥ 4,5 | ≥ 11,6 / ≥ 4,3 | Cumple 3:1 (el muestrario lo recalcula) |

Regla: `primary` y `acento` claros nunca como color de texto sobre claro; para texto usar `primarioOscuro`, `secundario` o los `*Texto`.

---

## 2. Tipografía

Fuente del sistema (Roboto en Android, San Francisco en iOS): cero peso extra, cero riesgo y legible. No se instala ninguna fuente. **Opción futura (no propuesta ahora):** Nunito (redonda y amable) con `@expo-google-fonts/nunito` y `expo-font`; unos 0,12-0,13 MB por peso (cifra aproximada, no verificada), 3 pesos = ~0,4 MB; requiere dependencias nuevas y por tanto aprobación. El cambio de escala y de peso da el 90 % del efecto sin ella.

| Token | Tamaño / interlínea | Peso | Uso |
|---|---|---|---|
| `display` | 28 / 34 | 800 | Título de pantalla principal (Inicio) |
| `titulo` | 24 / 30 | 700 | Título de pantalla y de ficha |
| `subtitulo` | 18 / 24 | 700 | Títulos de tarjeta y de sección |
| `cuerpo` | 16 / 22 | 400 | Texto general (hoy 15) |
| `cuerpoFuerte` | 16 / 22 | 600 | Valores en filas de datos |
| `etiqueta` | 14 / 18 | 600 | Etiquetas de campo, chips, pestañas |
| `secundario` | 14 / 20 | 400 | Ayudas y subtítulos (mínimo 14, hoy 13) |
| `cifra` | 32 / 38 | 800, `tabular-nums` | Números grandes de tarjetas |
| `boton` | 17 / 22 | 700 | Texto de botón |

---

## 3. Componentes

Tokens nuevos o cambiados (en `src/theme/`): radios `sm 8, md 12, lg 18, xl 24, pill`; espaciado igual al actual más `pantalla: 16` (margen lateral) y `touch: 52` (campos y botones secundarios) / `touchPrincipal: 56`; sombras: `tarjeta` (offset 0/2, opacidad .08, radio 6, elevation 2, tinte `#1E2A22`), `flotante` (offset 0/6, opacidad .18, radio 12, elevation 8).

| Componente | Especificación |
|---|---|
| Botón primario | Alto 56, radio 14, fondo primario, texto blanco 17/700, icono opcional a la izquierda (22 px). Ancho completo en formularios. Pulsado: primarioOscuro. |
| Botón secundario | Alto 52, fondo blanco, borde 2 px primario, texto primarioOscuro. |
| Botón terciario | Sin fondo, texto primarioOscuro subrayado, alto 48. |
| Botón peligro | Alto 52, fondo error, texto blanco, icono `trash-outline`. |
| Botón deshabilitado | Fondo superficie alterna, texto `#7B8077`, sin sombra; el texto no cumple contraste por ser inactivo (permitido por WCAG), pero va con el texto de ayuda de por qué. |
| Acción flotante (FAB extendido) | Alto 56, pill, fondo acento, borde 2 px `primarioOscuro` (el acento solo no llega a 3:1 sobre blanco), texto y `add` oscuros 17/800, sombra `flotante`, anclado abajo a la derecha sobre la barra inferior. |
| Campo de texto | Alto 52, radio 12, borde 1,5 px borde de campo, fondo blanco; etiqueta 14/600 arriba (no solo placeholder). Foco: borde primario 2,5 px + halo `primarioSuave`. Error: borde error + icono + mensaje 14 px texto error debajo. |
| Tarjeta | Fondo blanco, radio 18, padding 16, sombra `tarjeta`, borde 1 px `borde`. Tarjeta de métrica: icono en círculo de color suave de 40 px, cifra 32/800, etiqueta 14. |
| Chip de estado | Pill, alto 28, icono 16 + texto 14/700 en el color `*Texto` sobre `*Suave`. |
| Filtros (pestañas segmentadas) | Contenedor `superficieAlterna` radio 14; opción activa blanca con sombra y texto primarioOscuro; alto 44. |
| Fila de lista (Ave, Jaula) | Tarjeta de 88 px mínimo: avatar/ícono 56 a la izquierda, código 18/700, 2 líneas de datos, chip de estado y `chevron-forward`. Toda la fila es pulsable. |
| Cabecera | Banda primarioOscuro con esquinas inferiores redondeadas 24, título 24/700 blanco, subtítulo 14 blanco al 85 %, botón atrás 44 px a la izquierda. Migas debajo en 14 px sobre fondo crema con `chevron-forward` separadores. |
| Barra inferior | Alto 64 más área segura, fondo blanco, borde superior `borde`; icono 26, etiqueta 13/600; activa: icono relleno + píldora `primarioSuave` tras el icono + texto primarioOscuro; inactiva: texto secundario. **Insignia de alertas en Más:** círculo error 18 px, número blanco 12/800, borde blanco 2 px, arriba a la derecha del icono. |
| Estado vacío | Círculo suave de 96 px con icono grande 44, título 18/700, texto 14 y botón primario con la acción que toca. |
| Estado de carga | Esqueleto: bloques `superficieAlterna` con la forma de la tarjeta; indicador circular primario para acciones. |
| Estado de error | Icono `cloud-offline-outline` en círculo error suave, mensaje (el de la API tal cual), botón «Reintentar» (`refresh-outline`). |
| Aviso (banner) | Radio 14, fondo `*Suave`, borde izquierdo 5 px del color de estado, icono + texto 15/600 `*Texto`; no bloqueante, con `close` dentro de un área pulsable de al menos 44x44 px (`hitSlop`; el icono sigue de 20 px). |

---

## 4. Iconografía

Librería: Ionicons (`@expo/vector-icons`, ya instalada). Estilo contorno (`-outline`) y relleno solo para la pestaña activa. Todos los nombres de la columna fueron verificados en `node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json`.

Por sección: Inicio `home-outline`/`home`; Jaulas `grid-outline`/`grid`; Aves `paw-outline`/`paw`; Finanzas `cash-outline`/`cash`; Más `ellipsis-horizontal-circle-outline`; Alertas `notifications-outline`; Reportes `bar-chart-outline`; Clientes `people-outline`; Producción de huevos `egg-outline`; Configuración `settings-outline`; Respaldo `archive-outline`.
Por acción principal: Nueva ave / nuevo `add`; Editar `create-outline`; Eliminar `trash-outline`; Guardar `save-outline` (o `checkmark` en confirmaciones); Buscar `search-outline`; Filtros `options-outline`; Cámara `camera-outline`; Galería `images-outline`; Compartir `share-outline`; Reintentar `refresh-outline`; Cerrar sesión `log-out-outline`; Atrás `chevron-back`; Siguiente `chevron-forward`.

### Reemplazo de emojis (grep real en `src/`)

| Emoji actual (archivos donde está) | Icono Ionicons | Notas |
|---|---|---|
| 🐔 avatar, «Activas», «Aves», «Raza» (AveCard, RankingCard, SelectorCatalogo, Header, listas, ficha) | `paw-outline` | Avatar sin foto: círculo suave con `paw`. |
| 🐓 «Macho» / 🐔 «Hembra» (AveCard, DetalleAve, CicloVida, DetalleCliente) | `male-outline` / `female-outline` | El texto «Macho»/«Hembra» se mantiene. |
| 🟢 Sana / 🟡 En tratamiento / 🔴 Enferma (AveCard, DetalleAve, filtros de Aves) | `checkmark-circle` / `medkit` / `alert-circle` en chip de color | Quita la bola de color del texto. |
| 🏠 jaula (JaulaCard, DetalleJaula, Alertas, Producción, Nueva ave) | `grid-outline` | Mismo glifo que la pestaña Jaulas. |
| 📦 «Inactivas» | `archive-outline` | |
| 📏 «Medidas actuales» (EvolucionAve) | `resize-outline` | `ruler-outline` no existe en Ionicons (verificado). |
| 🟢 Ingreso / 🔴 Egreso como opción de tipo (NuevoMovimiento, EditarMovimiento) | `trending-up-outline` (éxito) / `trending-down-outline` (error) | El texto «Ingreso»/«Egreso» se mantiene. |
| 🟢 «Normal» (SanidadJaula) | `checkmark-circle-outline` | El texto «Normal» se mantiene. |
| 📍 ubicación / 🏷️ tipo / 📱 celular / 👤 persona / 👥 Clientes | `location-outline` / `pricetag-outline` / `call-outline` / `person-circle-outline` / `people-outline` | |
| 🥚 huevos, producción, promedio, «Registrar huevo» | `egg-outline` | |
| 💧 bebida / 🍚 alimentación / 🧼 sanidad / 📖 historial | `water-outline` / `nutrition-outline` / `bandage-outline` / `time-outline` | |
| 🩺 salud, enfermedades, finalizar tratamiento / 💊 medicamentos | `medkit-outline` / `medical-outline` | |
| 💰 ingresos, vendidas, venta, categorías / 💸 egresos / 📉 egresos (gráfico) / 📊 utilidad y producción / 📈 indicadores | `cash-outline` / `trending-down-outline` / `trending-down-outline` / `bar-chart-outline` / `trending-up-outline` | Se añade signo + / − en importes. |
| 🔔 alertas y totales / ✅ sin alertas | `notifications-outline` / `checkmark-circle-outline` | |
| 🔴 Críticas / 🟡 Advertencias (Alertas, Inicio, AlertCard) | `alert-circle` (error) / `warning` (ámbar) | |
| 💧🍚🐔 acciones de AlertCard («Registrar bebida →», etc.) | icono + `chevron-forward` | La flecha de texto `→` pasa a icono; el texto sin flecha. |
| ✏️ editar / 🗑️ eliminar / 💾 guardar | `create-outline` / `trash-outline` / `save-outline` | |
| 📸 evolución, 📷 Cámara / 🖼️ Galería | `camera-outline` / `images-outline` | |
| 🌿 Ciclo de vida / 🌱 sin eventos / 🌳 Genealogía | `leaf-outline` / `leaf` / `git-network-outline` | |
| ⚫ Dar de baja / ⚰ fallecimiento, fallecidas / 🛒 comprada | `exit-outline` / `skull-outline` / `cart-outline` | |
| 🐣 nacida en criadero / 🏡 ingreso / 📝 nota / 📸 evento | `sparkles-outline` / `home-outline` / `document-text-outline` / `camera-outline` | Eventos del ciclo de vida. |
| 📅 semana / 🏆 mejores ponedoras / 🥇🥈🥉 ranking | `calendar-outline` / `trophy-outline` / `ribbon` (oro, plata, bronce) | |
| ⚙️ Configuración, ⚙ Filtros / 🚪 salir / 📤 compartir / ♻️ restaurar / 🔗 venta | `settings-outline` / `options-outline` / `log-out-outline` / `share-outline` / `refresh-outline` / `link-outline` | |
| ＋ «Nueva ave» | `add` | |

Se quedan sin cambio los `→` dentro de textos de datos (p. ej. «Peso: 800 g → 850 g»), son datos, no decoración.

---

## 5. Qué cambia respecto a hoy

- **Login / Registro:** hoy tarjeta con título y campos planos. Pasa a banda verde con el logotipo (círculo con `paw`) y lema «Control de aves, fácil», campos de 52 px con icono (correo, candado, ojo `eye-outline` para ver contraseña con zona pulsable de 44x44 px), etiqueta visible, botón primario «Ingresar» de 56 px a todo el ancho y enlace «Crear una cuenta» de 48 px (textos reales conservados). Mensajes de error en banner rojo con icono.
- **Inicio:** hoy métricas con emoji y bloques blancos iguales. Pasa a cabecera con saludo y fecha, cuatro tarjetas de métrica con icono en círculo de color y cifra 32 px (Activas, Vendidas, Fallecidas, Tratamiento), aviso de alertas arriba si hay críticas, y secciones con título 18/700 e icono. Cuatro accesos rápidos de 56 px (ver toques, sección 7).
- **Lista de aves:** hoy pestañas con emoji, botón verde y búsqueda aparte. Pasa a filtro segmentado de 44 px, búsqueda de 52 px con lupa y botón Filtros con icono, filas de 88 px con avatar, código grande, sexo, jaula, chip de salud y chevron, y acción flotante «Nueva ave» amarilla.
- **Ficha del ave:** hoy una pila de tarjetas y botones iguales. Pasa a encabezado con foto grande, código 24/700 y chips (sexo, estado, salud); datos en filas etiqueta/valor con separadores; rejilla 2x3 de acciones con icono (Editar, Evolución, Salud, Registrar huevo, Ciclo de vida, Genealogía) y «Dar de baja» abajo, separado y en rojo suave.
- **Lista de jaulas:** pestañas Activas/Inactivas segmentadas; tarjeta con código grande, ubicación/tipo con iconos, «N aves» y chip (sin barra de ocupación: V1 no tiene capacidad de jaula); FAB «Nueva jaula» si hoy existe ese botón.
- **Formulario (nueva ave):** secciones agrupadas en tarjetas con título (Identificación, Origen, Medidas, Notas), foto con botones Cámara/Galería de 52 px, origen como dos tarjetas seleccionables («Nacida en criadero» / «Comprada»), campos de 52 px con unidad al final (g, cm) y botón «Guardar ave» fijo abajo. Se conservan las etiquetas y placeholders reales («Código *», «Ej. K001», «Peso en gramos», «Ej. 850», «Altura en centímetros», «Largo en centímetros», «Origen del ave»).
- **Alertas:** resumen en tres contadores (Críticas, Advertencias, Total), alertas como tarjetas con borde izquierdo de color, icono de categoría, texto y botón de acción de 48 px («Registrar bebida»); estado vacío con `checkmark-circle`.
- **Finanzas:** tres tarjetas (Ingresos, Egresos, Utilidad) con cifra grande y signo, gráfico de barras con colores éxito/error y leyenda con icono y texto (`trending-up-outline` Ingresos, `trending-down-outline` Egresos; no solo color), lista de movimientos con icono, categoría, fecha e importe alineado a la derecha con `+`/`−`, y FAB «Nuevo movimiento».

---

## 6. Elegir variante

| Criterio | A «Campo cálido» | B «Verde sobrio» |
|---|---|---|
| Relación con el negocio | Alta: pasto, tierra, maíz | Media: natural pero genérico |
| Cambio visible frente a hoy | Muy alto | Medio |
| Legibilidad al sol (texto) | 13,8:1, fondo crema | 14,9:1, fondo frío más brillante |
| Fatiga/deslumbramiento | Menor (crema) | Mayor (casi blanco) |
| Acción principal | Amarillo maíz 8,2:1 | Naranja 6,1:1 |
| Riesgo | Poco: solo tokens | Mínimo: continuidad |

**Recomendación: A.** Es la que mejor responde a «quiero ver el cambio» y a uso bajo sol. Si no gusta del crema, B es el plan de continuidad. Se puede mezclar (p. ej. primario A con fondo B) porque son tokens.

---

## 7. Reducción de toques (sin cambiar procesos)

| Idea | Estado | Efecto |
|---|---|---|
| Aviso no bloqueante en lugar de `Alert` modal | **Aprobada** | Ahorra 1 toque al guardar. |
| «Ver ave» directo tras crear | **Aprobada** | Ahorra 2 toques. |
| Alta rápida en catálogos desde el selector | **Aprobada** | Ahorra salir y volver. |
| Ocultar Respaldo en modo API | **Aprobada** | Menú más corto. |
| Acción principal flotante (FAB) o barra fija abajo: «Nueva ave», «Nueva jaula», «Nuevo movimiento», «Guardar» en formularios largos | **NUEVA, requiere decisión** | «Guardar» queda siempre visible, sin desplazarse al final (1 deslizamiento menos por formulario). |
| Accesos rápidos en Inicio (cuatro: Nueva ave, Registrar huevo, Nuevo movimiento, Alertas) que abren pantallas ya existentes | **NUEVA, requiere decisión** | 2 a 3 toques menos por tarea frecuente; solo navega a pantallas que ya existen. |
| Objetivos táctiles de 52-56 px y separación de 12 px | **NUEVA, requiere decisión** (puro visual) | Menos errores con guantes o manos sucias. |
| Teclado numérico ya en cada campo numérico (si falta, solo configuración de entrada) | NUEVA, requiere decisión | 1 cambio de teclado menos. |

DUDA PARA EL USUARIO: «Registrar huevo» exige elegir ave; en Inicio el acceso rápido abriría la lista de aves para elegir, no un registro directo. ¿Se acepta ese comportamiento o se omite ese acceso?

---

## 8. Plan de aplicación

Un sub-bloque por vez, informe corto y visto bueno entre ellos; entre sub-bloques la app compila y corre en nube y en SQLite.

| Sub-bloque | Contenido | Riesgo para flujos Maestro |
|---|---|---|
| C1 | Tema (A o B elegido) y componentes comunes aplicados a `Header`, migas, barra inferior y insignia | Bajo: los textos de cabecera y pestañas no cambian; el emoji 🐔 del título de `Header` se quita (los flujos buscan por palabras). |
| C2 | Login, Registro, Onboarding | Medio: si se añaden etiquetas visibles, los flujos usan placeholders y testID existentes, que se conservan. |
| C3 | Inicio y Alertas | **Alto:** `99-alertas.yaml:29` busca `.*🔔 3.*`; al pasar a icono el texto sería «3» o «Total: 3»; hay que actualizar ese flujo aparte. |
| C4 | Aves y Jaulas (listas, ficha, formulario) | **Alto:** los chips de pestañas pierden el emoji («Activas», «Vendidas», «Fallecidas»); los botones pierden emoji («Nueva ave», «Guardar ave»); flujos con `.*Nueva ave.*` o `.*Guardar ave.*` siguen valiendo porque son subcadenas. |
| C5 | Salud, Huevos, Genealogía, Bajas | **Alto:** `60-salud-enfermedad.yaml:36` busca `.*🔴 Coriza.*`; el icono sustituye al emoji, el chip dirá «Coriza» (actualizar el flujo). |
| C6 | Finanzas, Clientes, Reportes, Configuración, Más | Medio: títulos de Configuración pierden emoji («Razas», «Enfermedades»…). |

Grep en `pruebas/movil/flujos`: solo dos flujos contienen emojis en sus textos buscados (`99-alertas.yaml` línea 29 y `60-salud-enfermedad.yaml` línea 36). El resto busca palabras sin emoji, por lo que sobrevive si los textos con palabras se conservan tal cual (regla de esta propuesta: **quitar emojis, no cambiar palabras**; los textos nuevos, como los lemas de Login, no reemplazan los existentes). Cada cambio de texto se registra en `documents/ux/inventario-cambios.md` y los flujos afectados se actualizan aparte (no los edito).

Observación de lógica (sin cambiar): `AlertasScreen` y `InicioScreen` repiten la lógica de contadores. La barra de ocupación de jaulas se descartó: V1 no tiene `capacidad` (`JaulaCard` solo recibe `cantidadAves`).

### Flujos Maestro afectados por la propuesta (no se editan aquí; actualizar aparte)

- `99-alertas.yaml:29`: busca `.*🔔 3.*` (el emoji pasa a icono).
- `60-salud-enfermedad.yaml:36`: busca `.*🔴 Coriza.*` (el emoji pasa a icono).
- Anclados al final: `.*Vendidas`, `.*Fallecidas`, `.*Activas` en `90-baja-venta.yaml:74`, `91-baja-muerte.yaml:45`, `98-clientes.yaml:62,67,107` (sin emoji el texto sigue valiendo, pero revisar el anclaje).
- `94-inicio.yaml:30-31`: textos exactos «Vendidas» y «Fallecidas»; el icono no debe ir dentro del mismo texto.
- `99-alertas.yaml:68`: `assertNotVisible` de `.*Guardar.*`; con «Guardar» fijo siempre visible en formularios, hay que revisarlo.
