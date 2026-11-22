/*
 * Service worker de CalculAR: instalable y con todas las calculadoras
 * funcionando sin conexión.
 *
 * Tres cachés (subir el número cuando cambien íconos, el manifest o esta
 * lógica: `activate` borra las que no estén en NOMBRES):
 *
 * - calcular-app: el build (/build/…, con hash en el nombre → cache-first) y
 *   los archivos fijos de public (íconos, manifest → network-first).
 * - calcular-paginas: el HTML de cada pantalla pública, para abrirla sin red.
 * - calcular-inertia: las respuestas JSON de Inertia de esas mismas pantallas.
 *   Van APARTE del HTML a propósito: la misma URL contesta HTML o JSON según el
 *   header X-Inertia, y guardarlas juntas termina mostrando JSON crudo.
 *
 * Al cerrar la sesión la app borra calcular-paginas y calcular-inertia: tienen
 * el nombre y el email de la cuenta en los datos de la página.
 */
const VERSION = 1;
const CACHE_APP = `calcular-app-v${VERSION}`;
const CACHE_PAGINAS = `calcular-paginas-v${VERSION}`;
const CACHE_INERTIA = `calcular-inertia-v${VERSION}`;
const NOMBRES = [CACHE_APP, CACHE_PAGINAS, CACHE_INERTIA];

/** Pantallas que se usan sin cuenta: se precargan y se guardan al visitarlas. */
const PUBLICAS = [
    '/',
    '/calculadora',
    '/cientifica',
    '/porcentajes',
    '/historial',
    '/finanzas',
    '/finanzas/tna-tea',
    '/finanzas/plazo-fijo',
    '/finanzas/interes-compuesto',
    '/fechas',
    '/fechas/dias-entre-fechas',
    '/fechas/dias-habiles',
    '/fechas/sumar-restar',
    '/fechas/edad',
    '/terminos',
    '/privacidad',
    '/cookies',
];

const ARCHIVOS_FIJOS = [
    '/manifest.webmanifest',
    '/favicon.svg',
    '/iconos/icon-192.png?v=1',
];

/** Todos los archivos del build, sacados de los manifest de Vite. */
async function archivosDelBuild() {
    const rutas = new Set();

    for (const manifest of [
        '/build/manifest.json',
        '/build/fonts-manifest.json',
    ]) {
        try {
            const texto = await (
                await fetch(manifest, { cache: 'no-store' })
            ).text();

            for (const [, ruta] of texto.matchAll(
                /"(?:\/build\/)?(assets\/[^"]+)"/g,
            )) {
                rutas.add(`/build/${ruta}`);
            }
        } catch {
            // Sin manifest (desarrollo con el servidor de Vite): nada que precargar.
        }
    }

    return [...rutas];
}

async function precargar() {
    const app = await caches.open(CACHE_APP);
    await Promise.allSettled(
        [...ARCHIVOS_FIJOS, ...(await archivosDelBuild())].map((url) =>
            app.add(url),
        ),
    );

    // El HTML se precarga sin sesión: no guarda datos de nadie.
    const paginas = await caches.open(CACHE_PAGINAS);
    await Promise.allSettled(
        PUBLICAS.map(async (ruta) => {
            const respuesta = await fetch(ruta, { credentials: 'omit' });

            if (respuesta.ok && !respuesta.redirected) {
                await paginas.put(ruta, respuesta);
            }
        }),
    );
}

self.addEventListener('install', (evento) => {
    evento.waitUntil(precargar());
    self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches
            .keys()
            .then((nombres) =>
                Promise.all(
                    nombres
                        .filter(
                            (n) =>
                                n.startsWith('calcular-') &&
                                !NOMBRES.includes(n),
                        )
                        .map((n) => caches.delete(n)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

function esPublica(url) {
    return PUBLICAS.includes(url.pathname.replace(/\/$/, '') || '/');
}

/** Se guarda solo una respuesta completa, propia y no redirigida. */
function guardable(respuesta) {
    return respuesta && respuesta.status === 200 && !respuesta.redirected;
}

/**
 * Una navegación que recibe el JSON de Inertia (lo guardó la caché HTTP del
 * navegador bajo la misma URL, porque el CDN borra el Vary): se vuelve a pedir
 * el HTML salteando esa caché.
 */
async function pedirDocumento(request) {
    const respuesta = await fetch(request);

    if (!respuesta.headers.get('x-inertia')) {
        return respuesta;
    }

    const recuperada = await fetch(request.url, {
        cache: 'reload',
        headers: { Accept: 'text/html' },
    });

    // Una respuesta ya redirigida (sesión vencida → login) no se le puede
    // entregar a una navegación: se le pasa el redirect al navegador.
    return recuperada.redirected
        ? Response.redirect(recuperada.url, 302)
        : recuperada;
}

async function primeroLaRed(request, nombreCache, { guardar, clave, pedir }) {
    const cache = await caches.open(nombreCache);

    try {
        const respuesta = await (pedir ?? fetch)(request);

        if (guardar && guardable(respuesta)) {
            await cache.put(clave ?? request, respuesta.clone());
        }

        return respuesta;
    } catch (error) {
        const guardada = await cache.match(clave ?? request, {
            ignoreSearch: true,
        });

        if (guardada) {
            return guardada;
        }

        throw error;
    }
}

self.addEventListener('fetch', (evento) => {
    const { request } = evento;
    const url = new URL(request.url);

    if (request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    // Las APIs (historial, feriados) van siempre a la red: la app ya maneja
    // la falta de conexión (cola de sincronización, feriados en el navegador).
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Build: el nombre tiene hash, así que lo guardado nunca queda viejo.
    if (url.pathname.startsWith('/build/')) {
        evento.respondWith(
            caches.open(CACHE_APP).then(async (cache) => {
                const guardada = await cache.match(request);

                if (guardada) {
                    return guardada;
                }

                const respuesta = await fetch(request);

                if (guardable(respuesta)) {
                    await cache.put(request, respuesta.clone());
                }

                return respuesta;
            }),
        );

        return;
    }

    // Navegación de Inertia (JSON).
    if (request.headers.get('X-Inertia')) {
        evento.respondWith(
            primeroLaRed(request, CACHE_INERTIA, {
                guardar: esPublica(url),
                clave: url.pathname,
            }).catch(
                () =>
                    // Sin red y sin copia: que Inertia cargue la página entera,
                    // que sí está precargada como HTML.
                    new Response('', {
                        status: 409,
                        headers: { 'X-Inertia-Location': url.href },
                    }),
            ),
        );

        return;
    }

    // Carga completa de una pantalla (HTML).
    if (request.mode === 'navigate') {
        evento.respondWith(
            primeroLaRed(request, CACHE_PAGINAS, {
                guardar: esPublica(url),
                clave: url.pathname,
                pedir: pedirDocumento,
            }).catch(async () => {
                const inicio = await caches.match('/', {
                    cacheName: CACHE_PAGINAS,
                });

                return (
                    inicio ??
                    new Response(
                        '<!doctype html><meta charset="utf-8"><title>Sin conexión</title><p style="font-family:sans-serif;padding:2rem">Sin conexión. Volvé a intentar cuando tengas señal.</p>',
                        {
                            headers: {
                                'Content-Type': 'text/html; charset=utf-8',
                            },
                        },
                    )
                );
            }),
        );

        return;
    }

    // Archivos fijos de public (íconos, manifest): red primero, para que un
    // ícono nuevo no quede tapado por el viejo.
    evento.respondWith(primeroLaRed(request, CACHE_APP, { guardar: true }));
});
