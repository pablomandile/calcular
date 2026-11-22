#!/usr/bin/env node
//
// Detecta scroll horizontal en mobile y te dice QUÉ elemento lo causa.
// Carga la página en un Chrome real a varios anchos de celular y, si el
// documento es más ancho que el viewport, camina el DOM para encontrar los
// elementos "culpables": los que sobresalen del viewport aunque su padre no
// (esos son la causa raíz, no el síntoma).
//
//   node detectar-overflow.mjs <base-url> [--email=..] [--password=..] [--path=/ruta]
//
// Ejemplos:
//   node detectar-overflow.mjs https://miapp.com --email=a@b.c --password=xxx --path=/escribelo
//   PATHS=/,/escribelo,/perfil node detectar-overflow.mjs https://miapp.com --email=.. --password=..
//
// Requiere puppeteer-core y un Chrome instalado. Si no lo tenés a mano:
//   mkdir -p /tmp/rev && cd /tmp/rev && npm init -y && npm i puppeteer-core
//
// Variables opcionales:
//   CHROME=<ruta a chrome.exe / google-chrome>
//   WIDTHS=320,390,768         (anchos a probar; default 320,390,768)
//   PATHS=/a,/b                (rutas a revisar; default: la página post-login)
//   LETRA_VALORES=pequeno,mediano,grande
//                              (si la app tiene tamaño de letra elegible: barre
//                               cada valor dejándolo en localStorage antes de cargar)
//   LETRA_CLAVE=tamanoLetra    (la clave de localStorage; default tamanoLetra)
//
// Además del scroll del documento, marca lo RECORTADO: elementos que pasan el
// borde derecho dentro de un ancestro con overflow-x-hidden. Ahí no hay scroll
// que medir, pero el texto queda cortado contra el borde, que es igual de malo.
//
// Sale con código 1 si encuentra overflow, para usarlo en un pipeline.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// El script vive en el skill (fuera del proyecto). Node resuelve los paquetes
// desde la carpeta del archivo que importa, no desde el cwd; así que probamos lo
// normal y, si falla, buscamos puppeteer-core desde el directorio de trabajo.
const puppeteer = await (async () => {
    const desenvolver = (m) =>
        typeof m?.launch === 'function'
            ? m
            : typeof m?.default?.launch === 'function'
              ? m.default
              : m?.default?.default;
    try {
        return desenvolver(await import('puppeteer-core'));
    } catch {
        try {
            const req = createRequire(pathToFileURL(`${process.cwd()}/`));
            const ruta = pathToFileURL(req.resolve('puppeteer-core')).href;
            return desenvolver(await import(ruta));
        } catch {
            console.error(
                'Falta puppeteer-core. Instalalo donde vayas a correr esto:\n' +
                    '  npm i puppeteer-core\n' +
                    'o corré el script con el cwd en una carpeta que ya lo tenga.',
            );
            process.exit(1);
        }
    }
})();

const [, , BASE_ARG, ...resto] = process.argv;
if (!BASE_ARG) {
    console.error(
        'Uso: node detectar-overflow.mjs <base-url> [--email=..] [--password=..] [--path=/ruta]',
    );
    process.exit(1);
}
const BASE = BASE_ARG.replace(/\/$/, '');
const arg = (n) =>
    resto.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);

const EMAIL = arg('email') || process.env.EMAIL;
const PASS = arg('password') || process.env.PASS;
const WIDTHS = (process.env.WIDTHS || '320,390,768').split(',').map(Number);
const PATHS = (process.env.PATHS || arg('path') || '')
    .split(',')
    .filter(Boolean);
const LETRA_VALORES = (process.env.LETRA_VALORES || '')
    .split(',')
    .filter(Boolean);
const LETRA_CLAVE = process.env.LETRA_CLAVE || 'tamanoLetra';

const CHROME =
    process.env.CHROME ||
    (process.platform === 'win32'
        ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
        : process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : '/usr/bin/google-chrome');

const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox'],
});
const pagina = await navegador.newPage();
const ruta = () => pagina.evaluate(() => location.pathname);

// ── Login, si hace falta ─────────────────────────────────────────────────
await pagina.setViewport({ width: 390, height: 780, isMobile: true });
await pagina
    .goto(`${BASE}/login`, { waitUntil: 'networkidle2' })
    .catch(() => {});

if (EMAIL && PASS && (await pagina.$('#email'))) {
    await pagina.type('#email', EMAIL);
    await pagina.type('#password', PASS);
    const boton =
        (await pagina.$('[data-test="login-button"]')) ||
        (await pagina.$('button[type="submit"]'));
    await boton.click();
    await pagina
        .waitForFunction(() => location.pathname !== '/login', {
            timeout: 25000,
        })
        .catch(() => {});
    await pagina.waitForNetworkIdle({ idleTime: 700 }).catch(() => {});
}

// Rutas a revisar: las que pasó el usuario, o la página donde quedó tras login.
const rutas = PATHS.length ? PATHS : [await ruta()];

// Encuentra los elementos que sobresalen del viewport pero cuyo padre NO
// sobresale: esos son la causa raíz (un hijo que no puede achicarse), no el
// contenedor que hereda el desborde.
const buscarCulpables = () =>
    pagina.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const sale = (el) => {
            const r = el.getBoundingClientRect();
            return r.right > vw + 1 || r.left < -1;
        };
        // Lo que no cuenta: invisible, posicionado fixed (drawers fuera de
        // pantalla, toasts) o adentro de un carrusel con scroll propio, que
        // desborda a propósito.
        const visible = (el) => {
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            return (
                r.width > 0 &&
                r.height > 0 &&
                s.visibility !== 'hidden' &&
                !el.closest('.sr-only')
            );
        };
        const exento = (el) => {
            for (let p = el; p && p !== document.body; p = p.parentElement) {
                const s = getComputedStyle(p);
                if (s.position === 'fixed') return true;
                if (
                    p !== el &&
                    (s.overflowX === 'auto' || s.overflowX === 'scroll')
                )
                    return true;
            }
            return false;
        };
        const sel = (el) => {
            let s = el.tagName.toLowerCase();
            if (el.id) s += `#${el.id}`;
            const cls = (el.getAttribute('class') || '')
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 4)
                .join('.');
            if (cls) s += `.${cls}`;
            return s.length > 90 ? s.slice(0, 90) + '…' : s;
        };
        const out = [];
        for (const el of document.body.querySelectorAll('*')) {
            if (!sale(el) || !visible(el) || exento(el)) continue;
            // Culpable = sale, pero su padre queda dentro del viewport.
            if (el.parentElement && sale(el.parentElement)) continue;
            const r = el.getBoundingClientRect();
            out.push({
                sel: sel(el),
                right: Math.round(r.right),
                width: Math.round(r.width),
            });
        }
        return {
            vw,
            scrollW: document.documentElement.scrollWidth,
            culpables: out.slice(0, 12),
        };
    });

let huboOverflow = false;
console.log(`\nDetección de overflow horizontal — ${BASE}\n`);

const letras = LETRA_VALORES.length ? LETRA_VALORES : [null];
let script = null;

for (const letra of letras) {
    if (letra) {
        // Antes de que cargue la página, para que el script anti-parpadeo del
        // <head> ya lo aplique como en un dispositivo real.
        if (script)
            await pagina.removeScriptToEvaluateOnNewDocument(script.identifier);
        script = await pagina.evaluateOnNewDocument(
            (clave, valor) => {
                try {
                    localStorage.setItem(clave, valor);
                } catch {}
            },
            LETRA_CLAVE,
            letra,
        );
        console.log(`## letra: ${letra}`);
        console.log('');
    }
    for (const path of rutas) {
        console.log(`# ${path}`);
        await pagina
            .goto(`${BASE}${path}`, { waitUntil: 'networkidle2' })
            .catch(() => {});
        await pagina.waitForNetworkIdle({ idleTime: 500 }).catch(() => {});

        for (const w of WIDTHS) {
            await pagina.setViewport({ width: w, height: 800, isMobile: true });
            // Un reflow para que rects/scrollWidth se recalculen al nuevo ancho.
            await pagina.evaluate(() => void document.body.offsetWidth);
            const { vw, scrollW, culpables } = await buscarCulpables();
            const desborde = scrollW - vw;

            if (desborde > 1 || culpables.length) {
                huboOverflow = true;
                console.log(
                    desborde > 1
                        ? `  ${w}px  ⚠ scroll horizontal (documento ${scrollW}px vs viewport ${vw}px, +${desborde}px)`
                        : `  ${w}px  ⚠ contenido RECORTADO contra el borde (sin scroll: hay un overflow-x-hidden arriba)`,
                );
                if (culpables.length) {
                    for (const c of culpables) {
                        console.log(
                            `        └ ${c.sel}  (right ${c.right}px, ancho ${c.width}px)`,
                        );
                    }
                } else {
                    console.log(
                        '        (no encontré un culpable claro; puede ser un margin negativo o 100vw)',
                    );
                }
            } else {
                console.log(`  ${w}px  ok`);
            }
        }
        console.log('');
    }
}

await navegador.close();

if (huboOverflow) {
    console.log(
        'Hay desborde horizontal. Revisá los culpables de arriba: casi siempre',
    );
    console.log(
        'les falta min-w-0 (hijo de flex/grid), wrap-anywhere/truncate, o usan 100vw.',
    );
    console.log(
        'Si es un Button con etiqueta larga: trae whitespace-nowrap y alto fijo.\n',
    );
    process.exit(1);
}
console.log('Sin scroll horizontal en ninguno de los anchos probados.\n');
