# CalculAR — convenciones del proyecto

Calculadoras pensadas para Argentina: normal y científica con historial, TNA ↔ TEA,
plazo fijo, interés compuesto, porcentajes y fechas (días entre fechas, días hábiles con
feriados, sumar/restar, edad). **Se usa sin cuenta**; la cuenta (Google o email) solo
sincroniza el historial entre dispositivos.

> El repo es público: nada de hosts, usuarios SSH ni credenciales acá.

## Stack

Laravel 13 · PHP 8.4 · MySQL · Inertia 3 · Vue 3 + TypeScript · Tailwind 4 · Vite+ (`vp`)
Fortify + Socialite (Google) · Wayfinder · decimal.js · mathjs · date-fns · idb-keyval.
Armado desde la rama principal de `laravel/vue-starter-kit` (el de Packagist está viejo).

## Idioma

Todo en español rioplatense con voseo. Tablas, columnas, rutas y código de dominio en
español; `users` y sus columnas base quedan como las trae el kit (las tablas de dominio
usan `usuario_id`).

## Cálculo: lógica pura y testeada

- Toda la matemática vive en `resources/js/lib/calc/*.ts`, sin Vue, con tests en
  `*.test.ts` (`vp test`). Las páginas solo leen campos y muestran.
- **Nunca `number` para plata o tasas**: `D` (decimal.js, 40 dígitos) de `numero.ts`.
  `parsearNumero` acepta "1.234,56" y `formatearNumero` escribe en formato argentino.
- Tasas como fracciones (0,6 = 60 %) en `tasas.ts`; porcentajes como "número de por
  ciento" (21 = 21 %) en `porcentajes.ts`.
- Fechas como texto ISO `AAAA-MM-DD`, convertidas a Date al mediodía local.
- La científica usa mathjs con BigNumber y las funciones peligrosas bloqueadas.

### ⚠️ `vp test` en Windows: la letra de unidad

Corrido desde una ruta `c:\…` (minúscula, como la abre VS Code) Vitest carga el runner
dos veces y **todos** los tests fallan con `Cannot read properties of undefined (reading
'config')`. Correrlo desde `C:\laragon\www\calcular` (PowerShell: `Set-Location
'C:\laragon\www\calcular'`). En el CI (Linux) no pasa.

`vite.config.ts` no carga los plugins de Laravel cuando corre Vitest: el de Wayfinder
ejecuta `php artisan` al arrancar y rompía el CI.

## Historial

- Dispositivo: IndexedDB (`useHistorial.ts`), estado de módulo compartido.
- Cuenta: tabla `calculos` (id = uuid del navegador → subir dos veces no duplica).
  `lib/sincronizacion.ts` manda en lote lo pendiente a `POST /api/historial/sincronizar`
  y recibe la lista completa. Gana la nota editada más recientemente.
- Al entrar, lo calculado sin cuenta se suma; si el dispositivo tenía el historial de
  **otra** cuenta, se descarta. Al salir se borra la copia local y las pantallas
  guardadas por el service worker.
- Sin aceptar los términos la sincronización recibe 409 y el historial queda local.

## Legales (lo que prometen los textos está atado al código)

- `resources/legales/*.md`, versión en `config/legales.php`. **Cambiar algo importante
  de un texto obliga a subir la versión** (vuelve a pedir la aceptación).
- `:contacto` en los textos se reemplaza por `LEGALES_CONTACTO` del `.env`.
- Promesas y dónde se sostienen: borrado real al eliminar la cuenta (FK en cascada +
  sesiones en `ProfileController::destroy`), descargar los datos (`DescargaDeDatosController`,
  botón en Perfil), máximo 5.000 cálculos (`Calculo::MAXIMO_POR_CUENTA`).
- `AceptoTerminos` va en todo el grupo web; las exentas están en `EXENTAS` (las
  calculadoras, los textos, salir, descargar, borrar). Un test fija la lista.

## Cookies y almacenamiento

El aviso es **informativo** porque todo lo que se guarda es necesario. `pages/Cookies.vue`
es el inventario y `AvisoCookiesTest` exige que cada clave que el código guarda figure
ahí: una clave nueva sin declarar rompe la suite. Si algún día entra algo no necesario
(analíticas), el aviso pasa a consentimiento previo y se sube su versión.

## PWA

- `public/sw.js`: build cache-first; HTML y JSON de Inertia en cachés **separadas**
  (misma URL, distinto contenido); sin red y sin copia → 409 con `X-Inertia-Location`.
- **Al cambiar íconos o la lógica del SW:** subir `VERSION` en `sw.js`, el `?v=` en
  `app.blade.php` y en `manifest.webmanifest`.
- La marca vive en `resources/marca/` (originales grandes, no se sirven):
  `isotipo.png` para los íconos de la PWA, los favicons y la barra superior, `logo-con-nombre.png` para
  login/registro (con variante oscura: "Calcul" en blanco) y la imagen para compartir.
  `npm run generar:iconos` recorta y exporta todo a `public/`.
- `.htaccess` sirve `sw.js` y el manifest sin caché (el CDN de Hostinger los guardaba).
- El CDN de Hostinger borra el `Vary: X-Inertia`: `HandleInertiaRequests::handle` pone
  `no-store` **solo** en el JSON (en el HTML apagaría el bfcache) y el SW vuelve a pedir el
  HTML si una navegación recibe JSON. Lo fija `CacheDeInertiaTest`.

## Pantalla

- Tamaño de letra (`App\Enums\TamanioTexto`): Pequeña/Normal/Grande en % sobre `<html>`,
  escrito por el servidor; cookie `tamanio_texto` + columna en `users`. El cambio va por
  `fetch` y no por visita de Inertia: recargar borraría la cuenta en la calculadora.
- El layout cambia de barra inferior a menú de escritorio en `lg`. Inflación no está en
  la barra inferior (se llega desde Finanzas e Inicio); Porcentajes aparece en el menú
  de escritorio recién en `xl` (con letra Grande no entran todos a 1024 px).
- Las teclas de las calculadoras toman su alto de `--alto-tecla` (con `100dvh`): el
  teclado entra sin scrollear desde 360×740 (con letra Grande en 320×640, se scrollea).

## Inflación (IPC, CER, UVA)

- Tabla `indices` (`App\Enums\SerieIndice`): se guarda el **número índice**, nunca el
  porcentaje; el coeficiente entre dos fechas es el cociente (sin redondeos encadenados).
- IPC Nacional nivel general del INDEC por la API de Series de Tiempo de datos.gob.ar
  (base dic-2016 = 100, desde 2016-12). CER (30) y UVA (31) por la API v4 del BCRA,
  paginada de a 1000 y con el bundle de `composer/ca-bundle` (el BCRA no manda la
  cadena completa). Mismo esquema que AlquilerFacil.
- `indices:actualizar` corre todos los días 07:17 (Argentina) y vuelve a pedir los
  últimos 3 meses / 10 días para tomar las revisiones. `GET /api/indices/{serie}` da la
  serie entera compacta y la trae en el momento si la tabla está vacía.
- El navegador guarda cada serie (`calcular.indices.…`) para usarla sin conexión.
- Las cuentas están en `lib/calc/inflacion.ts`; CER y UVA son la misma pantalla
  (`SerieDiaria.vue`) con la prop `serie`.
- Los cron van con `Schedule::call`, no `Schedule::command` (proc_open falla en el
  hosting a las horas en punto), en minutos que no son en punto y con timezone.

## Feriados

`CalendarioFeriados`: API de ArgentinaDatos → tabla `feriados`; respaldo en
`database/data/feriados-{año}.json` (actualizarlo una vez por año). Los "puente" son días
no laborables (optativos para el sector privado). `feriados:actualizar` corre los lunes.

## Verificación

```bash
composer ci:check            # lo mismo que el CI (formato, lint, tipos, tests JS y PHP)
npm run revisar:mobile -- http://127.0.0.1:8000   # desbordes (MSYS_NO_PATHCONV=1 en Git Bash)
npm run revisar:pwa -- http://127.0.0.1:8000/     # instalabilidad
```
