# CalculAR

Las cuentas que se hacen todos los días en la Argentina, en un solo lugar y con
explicación: cada calculadora dice qué calcula, con qué fórmula, un ejemplo y qué
tener en cuenta.

**En línea:** https://calcular.bambudev.com.ar

Se usa **sin cuenta**. La cuenta (Google o email) solo sirve para sincronizar el
historial entre dispositivos.

## Qué tiene

| Sección          | Calculadoras                                                                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Calculadoras** | Normal (con memoria y teclado físico) y científica (trigonometría, logaritmos, potencias, factorial, paréntesis, grados y radianes)                                                                                     |
| **Finanzas**     | TNA ↔ TEA, plazo fijo, interés compuesto con aportes, rendimiento diario de una cuenta remunerada (Mercado Pago y similares), interés real de una compra en cuotas, contado vs. cuotas, descuento con tope de reintegro |
| **Porcentajes**  | Qué % es, aumentos y descuentos, variación, precio sin IVA                                                                                                                                                              |
| **Inflación**    | Actualizar un monto por IPC, inflación acumulada, serie mensual e interanual con gráfico, valores diarios del CER y la UVA                                                                                              |
| **Fechas**       | Días entre fechas, días hábiles con los feriados nacionales, sumar y restar días/meses/años, edad exacta                                                                                                                |

Además:

- **Historial** de cada cálculo, con notas, búsqueda y "reusar" (abre la calculadora con
  esos datos). Se guarda en el dispositivo y, con cuenta, se sincroniza.
- **Datos oficiales que se actualizan solos:** IPC del INDEC (API de Series de Tiempo
  de datos.gob.ar), CER y UVA del BCRA, y feriados de ArgentinaDatos.
- **PWA instalable** que funciona sin conexión, incluidas las series de inflación ya
  descargadas.
- Formato argentino en todo (coma decimal, punto de miles, fechas dd/mm/aaaa), modo
  claro y oscuro, y tres tamaños de letra.

## Cómo está hecho

- **Laravel 13** (PHP 8.4) + **Inertia 3** + **Vue 3** con TypeScript + **Tailwind 4**.
- Fortify y Socialite para las cuentas (email o Google, con llaves de acceso).
- **Toda la matemática vive en `resources/js/lib/calc/`**, sin Vue y con tests.
  Plata y tasas nunca van en `number`: se calculan con `decimal.js` a 40 dígitos, así
  que 0,1 + 0,2 da 0,3. La científica usa `mathjs` con BigNumber.
- Las series de inflación se guardan como **número índice**, no como porcentaje: el
  coeficiente entre dos fechas es un cociente, sin redondeos encadenados.
- El service worker precachea el build y guarda las páginas y los datos por separado.

Las convenciones del proyecto (idioma, cálculo, historial, PWA, legales) están en
[`CLAUDE.md`](CLAUDE.md).

## Correrlo local

Requiere PHP 8.4, Composer y Node 22+.

```bash
composer setup     # dependencias, .env, clave, base SQLite y build
composer dev       # servidor, Vite y cola
```

Para el login con Google hacen falta `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y
`GOOGLE_REDIRECT_URI` en el `.env`. Sin ellos funciona todo lo demás.

Para cargar los datos de inflación y los feriados:

```bash
php artisan indices:actualizar
php artisan feriados:actualizar
```

## Tests

```bash
composer ci:check   # formato, lint, tipos, tests de JS (Vitest) y de PHP (Pest)
```

El mismo chequeo corre en GitHub Actions en cada push.

> En Windows, `vp test` tiene que correr desde una ruta con la letra de unidad en
> mayúscula (`C:\…`). Ver `CLAUDE.md`.

## Marca

Los originales del logo están en `resources/marca/`. `npm run generar:iconos` arma los
íconos de la PWA, los favicons y la imagen para compartir.
