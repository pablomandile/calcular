/*
 * Genera los íconos de la PWA, los favicons, el logo de las pantallas de
 * ingreso y la imagen para compartir, a partir de los originales de la marca:
 *
 *   resources/marca/isotipo.png          la calculadora con el sol (íconos)
 *   resources/marca/logo-con-nombre.png  la misma, con "CalculAR" (logo)
 *
 *   npm run generar:iconos
 *
 * Los originales son PNG grandes con fondo transparente: se recortan al
 * dibujo, se escalan y se exportan livianos. Dibuja con el Chrome que ya usan
 * los scripts de revisión (puppeteer-core), sin dependencias de imágenes.
 *
 * ⚠️ Al cambiar un ícono hay que tocar TRES lugares o se sigue viendo el viejo
 * (cada uno es una caché distinta):
 *   1. VERSION en public/sw.js;
 *   2. el ?v= de los íconos en resources/views/app.blade.php;
 *   3. el ?v= de los "src" en public/manifest.webmanifest.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME =
    process.env.CHROME ??
    'C:/Program Files/Google/Chrome/Application/chrome.exe';

const BLANCO = '#FFFFFF';

/**
 * - `ocupa`: qué parte del lienzo ocupa el dibujo (el resto es margen).
 *   Los maskable de Android recortan con su máscara: el dibujo va dentro de
 *   la zona segura (el 80 % central).
 * - `fondo`: iOS y los maskable pintan de negro la transparencia.
 * - `aclarar`: pasa a blanco las letras oscuras del nombre, para el modo
 *   oscuro (el "Calcul" azul marino no se lee sobre fondo oscuro).
 */
const SALIDAS = [
    {
        fuente: 'isotipo',
        destino: 'public/iconos/icon-192.png',
        ancho: 192,
        alto: 192,
        ocupa: 0.92,
    },
    {
        fuente: 'isotipo',
        destino: 'public/iconos/icon-512.png',
        ancho: 512,
        alto: 512,
        ocupa: 0.92,
    },
    {
        fuente: 'isotipo',
        destino: 'public/iconos/icon-maskable-512.png',
        ancho: 512,
        alto: 512,
        ocupa: 0.7,
        fondo: BLANCO,
    },
    {
        fuente: 'isotipo',
        destino: 'public/apple-touch-icon.png',
        ancho: 180,
        alto: 180,
        ocupa: 0.82,
        fondo: BLANCO,
    },
    {
        fuente: 'isotipo',
        destino: 'public/iconos/favicon-32.png',
        ancho: 32,
        alto: 32,
        ocupa: 1,
    },
    // Logo de ingreso y registro: se muestra a 240 px de ancho, al doble para pantallas densas.
    {
        fuente: 'logo',
        destino: 'public/img/logo-calcular.webp',
        ancho: 480,
        ocupa: 1,
        formato: 'image/webp',
    },
    {
        fuente: 'logo',
        destino: 'public/img/logo-calcular-oscuro.webp',
        ancho: 480,
        ocupa: 1,
        formato: 'image/webp',
        aclarar: true,
    },
    // Lo que se ve al compartir un enlace (Open Graph).
    {
        fuente: 'logo',
        destino: 'public/img/compartir.jpg',
        ancho: 1200,
        alto: 630,
        ocupa: 0.82,
        fondo: BLANCO,
        formato: 'image/jpeg',
    },
];

const FUENTES = {
    isotipo: 'resources/marca/isotipo.png',
    logo: 'resources/marca/logo-con-nombre.png',
};

const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
});
const pagina = await navegador.newPage();
await pagina.setContent('<html><body></body></html>');

const originales = {};

for (const [clave, ruta] of Object.entries(FUENTES)) {
    originales[clave] = (await readFile(resolve(RAIZ, ruta))).toString(
        'base64',
    );
}

async function dibujar(salida) {
    const base64 = await pagina.evaluate(
        async (fuente, s) => {
            const img = new Image();
            img.src = 'data:image/png;base64,' + fuente;
            await img.decode();

            // 1. Recortar al dibujo (lo que no es transparente).
            const original = document.createElement('canvas');
            original.width = img.width;
            original.height = img.height;
            const ctx0 = original.getContext('2d');
            ctx0.drawImage(img, 0, 0);
            const { data } = ctx0.getImageData(0, 0, img.width, img.height);
            let x0 = img.width,
                y0 = img.height,
                x1 = 0,
                y1 = 0;

            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 8) {
                    const x = (i / 4) % img.width;
                    const y = Math.floor(i / 4 / img.width);
                    x0 = Math.min(x0, x);
                    x1 = Math.max(x1, x);
                    y0 = Math.min(y0, y);
                    y1 = Math.max(y1, y);
                }
            }

            const w = x1 - x0 + 1;
            const h = y1 - y0 + 1;
            const recorte = document.createElement('canvas');
            recorte.width = w;
            recorte.height = h;
            const ctx1 = recorte.getContext('2d');
            ctx1.drawImage(original, x0, y0, w, h, 0, 0, w, h);

            // 2. Modo oscuro: las letras (debajo de la calculadora, después de
            //    la franja vacía más alta) pasan de azul marino a blanco.
            if (s.aclarar) {
                const px = ctx1.getImageData(0, 0, w, h);
                const filaVacia = (y) => {
                    for (let x = 0; x < w; x++) {
                        if (px.data[(y * w + x) * 4 + 3] > 8) return false;
                    }
                    return true;
                };
                let corte = h;
                let mejor = 0;
                for (let y = 0, racha = 0; y < h; y++) {
                    racha = filaVacia(y) ? racha + 1 : 0;
                    if (racha > mejor) {
                        mejor = racha;
                        corte = y;
                    }
                }
                for (let y = corte; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const i = (y * w + x) * 4;
                        const [r, g, b] = [
                            px.data[i],
                            px.data[i + 1],
                            px.data[i + 2],
                        ];
                        if (
                            (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 <
                            0.35
                        ) {
                            px.data[i] = px.data[i + 1] = px.data[i + 2] = 255;
                        }
                    }
                }
                ctx1.putImageData(px, 0, 0);
            }

            // 3. Escalar dentro del lienzo final, centrado.
            const ancho = s.ancho;
            const alto = s.alto ?? Math.round((s.ancho * h) / w);
            const escala = Math.min(
                (ancho * s.ocupa) / w,
                (alto * s.ocupa) / h,
            );
            const lienzo = document.createElement('canvas');
            lienzo.width = ancho;
            lienzo.height = alto;
            const ctx = lienzo.getContext('2d');
            ctx.imageSmoothingQuality = 'high';

            if (s.fondo) {
                ctx.fillStyle = s.fondo;
                ctx.fillRect(0, 0, ancho, alto);
            }

            ctx.drawImage(
                recorte,
                (ancho - w * escala) / 2,
                (alto - h * escala) / 2,
                w * escala,
                h * escala,
            );

            return lienzo
                .toDataURL(s.formato ?? 'image/png', 0.9)
                .split(',')[1];
        },
        originales[salida.fuente],
        salida,
    );

    return Buffer.from(base64, 'base64');
}

await mkdir(resolve(RAIZ, 'public/iconos'), { recursive: true });
await mkdir(resolve(RAIZ, 'public/img'), { recursive: true });

let png32;

for (const salida of SALIDAS) {
    const archivo = await dibujar(salida);
    await writeFile(resolve(RAIZ, salida.destino), archivo);

    if (salida.ancho === 32) {
        png32 = archivo;
    }

    console.log(`${salida.destino} (${(archivo.length / 1024).toFixed(1)} KB)`);
}

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
