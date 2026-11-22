/*
 * Genera los íconos de la PWA y los favicons a partir del isotipo de CalculAR
 * (las tres franjas de la bandera con el Sol de Mayo), el mismo dibujo que
 * resources/js/components/calcular/IsotipoCalculAR.vue.
 *
 *   npm run generar:iconos
 *
 * Dibuja con el Chrome que ya usan los scripts de revisión (puppeteer-core).
 *
 * ⚠️ Al cambiar un ícono hay que tocar TRES lugares o se sigue viendo el viejo
 * (cada uno es una caché distinta):
 *   1. el nombre de CACHE en public/sw.js;
 *   2. el ?v= de los <link rel="icon"> en resources/views/app.blade.php;
 *   3. el ?v= de los "src" en public/manifest.webmanifest.
 */

import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME =
    process.env.CHROME ??
    'C:/Program Files/Google/Chrome/Application/chrome.exe';

const CELESTE = '#74ACDF';
const BLANCO = '#FFFFFF';
const SOL = '#F6B40E';

/**
 * El isotipo en un lienzo de 32×32.
 * - `lleno`: sin esquinas redondeadas (maskable de Android y el de iOS, que
 *   recortan con su propia máscara y pintan de negro la transparencia). El
 *   sol queda centrado, bien adentro de la zona segura del 80 %.
 */
function svg({ lleno = false } = {}) {
    const radio = lleno ? 0 : 8;
    // En el maskable el sol se achica un poco: la máscara circular recorta.
    const escalaSol = lleno ? 0.85 : 1;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="${radio}" fill="${CELESTE}"/>
  <rect y="11" width="32" height="10" fill="${BLANCO}"/>
  <circle cx="16" cy="16" r="${3.6 * escalaSol}" fill="${SOL}"/>
  <circle cx="16" cy="16" r="${4.6 * escalaSol}" fill="none" stroke="${SOL}" stroke-width="0.8" stroke-dasharray="1.2 1.2"/>
</svg>`;
}

/** @type {{ destino: string, lado: number, lleno?: boolean }[]} */
const ICONOS = [
    { destino: 'public/iconos/icon-192.png', lado: 192 },
    { destino: 'public/iconos/icon-512.png', lado: 512 },
    { destino: 'public/iconos/icon-maskable-512.png', lado: 512, lleno: true },
    { destino: 'public/apple-touch-icon.png', lado: 180, lleno: true },
    { destino: 'public/iconos/favicon-32.png', lado: 32 },
];

const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
});
const pagina = await navegador.newPage();
await pagina.setContent('<html><body></body></html>');

async function rasterizar(codigo, lado) {
    const base64 = await pagina.evaluate(
        async (codigo, lado) => {
            const img = new Image();
            img.src =
                'data:image/svg+xml;base64,' +
                btoa(unescape(encodeURIComponent(codigo)));
            await img.decode();
            const lienzo = document.createElement('canvas');
            lienzo.width = lado;
            lienzo.height = lado;
            lienzo.getContext('2d').drawImage(img, 0, 0, lado, lado);

            return lienzo.toDataURL('image/png').split(',')[1];
        },
        codigo,
        lado,
    );

    return Buffer.from(base64, 'base64');
}

const { mkdir } = await import('node:fs/promises');
await mkdir(resolve(RAIZ, 'public/iconos'), { recursive: true });

let png32;

for (const icono of ICONOS) {
    const png = await rasterizar(svg(icono), icono.lado);
    await writeFile(resolve(RAIZ, icono.destino), png);

    if (icono.lado === 32) {
        png32 = png;
    }

    console.log(`${icono.destino} (${icono.lado}×${icono.lado})`);
}

await writeFile(resolve(RAIZ, 'public/favicon.svg'), svg());
console.log('public/favicon.svg');

/*
 * favicon.ico con un único PNG adentro (formato que aceptan todos los
 * navegadores desde hace años): cabecera de 6 bytes + una entrada de 16.
 */
const cabecera = Buffer.alloc(22);
cabecera.writeUInt16LE(0, 0); // reservado
cabecera.writeUInt16LE(1, 2); // tipo: ícono
cabecera.writeUInt16LE(1, 4); // una imagen
cabecera.writeUInt8(32, 6); // ancho
cabecera.writeUInt8(32, 7); // alto
cabecera.writeUInt8(0, 8); // paleta
cabecera.writeUInt8(0, 9); // reservado
cabecera.writeUInt16LE(1, 10); // planos
cabecera.writeUInt16LE(32, 12); // bits por pixel
cabecera.writeUInt32LE(png32.length, 14); // tamaño
cabecera.writeUInt32LE(22, 18); // desplazamiento
await writeFile(
    resolve(RAIZ, 'public/favicon.ico'),
    Buffer.concat([cabecera, png32]),
);
console.log('public/favicon.ico');

await navegador.close();
