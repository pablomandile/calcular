<script setup lang="ts">
import { Head } from '@inertiajs/vue3';

/*
 * Qué guarda CalculAR en el navegador y para qué. Es el inventario completo:
 * `AvisoCookiesTest` busca en el código cada clave que se escribe en el
 * navegador y exige que aparezca acá, así que una clave nueva sin declarar
 * rompe la suite.
 */

type Dato = {
    nombre: string;
    para: string;
    dura: string;
};

type Grupo = {
    titulo: string;
    descripcion: string;
    datos: Dato[];
};

const GRUPOS: Grupo[] = [
    {
        titulo: 'Cookies',
        descripcion:
            'Pequeños datos que el navegador manda en cada pedido a CalculAR.',
        datos: [
            {
                nombre: 'calcular-session',
                para: 'Mantener tu sesión iniciada. Sin cuenta también existe, pero no tiene datos tuyos.',
                dura: '2 horas sin actividad',
            },
            {
                nombre: 'XSRF-TOKEN',
                para: 'Comprobar que cada formulario lo enviaste vos desde CalculAR y no otro sitio en tu nombre.',
                dura: '2 horas sin actividad',
            },
            {
                nombre: 'remember_web_…',
                para: 'Solo si marcás «Recordarme»: que no tengas que volver a iniciar sesión en este dispositivo.',
                dura: 'Hasta que salgas de la cuenta',
            },
            {
                nombre: 'appearance',
                para: 'Si elegiste tema claro u oscuro, para dibujar la pantalla con ese tema desde el primer instante.',
                dura: '1 año',
            },
            {
                nombre: 'tamanio_texto',
                para: 'El tamaño de letra que elegiste, para que la pantalla cargue ya con ese tamaño. Con cuenta, también queda guardado en tu cuenta.',
                dura: 'Hasta que lo cambies',
            },
        ],
    },
    {
        titulo: 'Guardado en este dispositivo',
        descripcion:
            'Datos que quedan en tu navegador. Sin cuenta, nunca salen de tu dispositivo.',
        datos: [
            {
                nombre: 'calcular · historial',
                para: 'Tu historial de cálculos (base de datos del navegador). Con cuenta, es una copia de la que está en tu cuenta.',
                dura: 'Hasta que lo borres desde Historial o salgas de la cuenta',
            },
            {
                nombre: 'calcular.memoria · calcular.modoAngulo',
                para: 'El número guardado en la memoria de la calculadora (M+) y si la científica usa grados o radianes.',
                dura: 'Hasta que los cambies',
            },
            {
                nombre: 'appearance',
                para: 'El tema que elegiste, también guardado en el dispositivo.',
                dura: 'Hasta que lo cambies',
            },
            {
                nombre: 'calcular.feriados.…',
                para: 'El calendario de feriados de cada año que consultaste, para que días hábiles funcione sin conexión.',
                dura: 'Hasta que borres los datos del navegador',
            },
            {
                nombre: 'calcular.indices.…',
                para: 'La serie del IPC, el CER o la UVA que consultaste, para que las calculadoras de inflación funcionen sin conexión.',
                dura: 'Hasta que borres los datos del navegador',
            },
            {
                nombre: 'calcular.sync.pendientes · calcular.sync.usuario',
                para: 'Con cuenta: los cambios del historial que todavía no llegaron a tu cuenta (por ejemplo, sin señal) y de qué cuenta es la copia.',
                dura: 'Hasta que se sincronizan o salís de la cuenta',
            },
            {
                nombre: 'calcular-app-v…',
                para: 'La app en sí (diseño, íconos, código), para que abra rápido y funcione sin señal. No tiene datos tuyos.',
                dura: 'Hasta la próxima versión de CalculAR',
            },
            {
                nombre: 'calcular-paginas-v… · calcular-inertia-v…',
                para: 'Las pantallas de las calculadoras, para abrirlas sin conexión. Con sesión incluyen tu nombre y tu email.',
                dura: 'Hasta que salgas de la cuenta o haya una versión nueva',
            },
            {
                nombre: 'calcular.aviso-cookies',
                para: 'Que ya leíste el aviso de cookies, para no volver a mostrártelo.',
                dura: 'Hasta que borres los datos del navegador',
            },
        ],
    },
];
</script>

<template>
    <Head title="Cookies y datos guardados" />

    <div class="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <h1 class="text-2xl font-bold tracking-tight md:text-3xl">
            Cookies y datos guardados
        </h1>

        <div class="rounded-2xl border border-border bg-card p-5">
            <p class="text-pretty">
                Todo lo que CalculAR guarda en tu navegador es necesario para
                que funcione. No hay publicidad, ni estadísticas de uso, ni nada
                de terceros que siga lo que hacés.
            </p>
        </div>

        <section
            v-for="grupo in GRUPOS"
            :key="grupo.titulo"
            class="flex flex-col gap-3"
        >
            <div>
                <h2 class="font-semibold">{{ grupo.titulo }}</h2>
                <p class="text-sm text-pretty text-muted-foreground">
                    {{ grupo.descripcion }}
                </p>
            </div>

            <!-- Tarjetas apiladas y no una tabla: en el celular no entraría. -->
            <dl
                class="divide-y divide-border rounded-2xl border border-border bg-card"
            >
                <div
                    v-for="dato in grupo.datos"
                    :key="dato.nombre"
                    class="flex flex-col gap-1 p-4"
                >
                    <dt class="font-mono text-sm wrap-anywhere">
                        {{ dato.nombre }}
                    </dt>
                    <dd class="text-sm text-pretty">{{ dato.para }}</dd>
                    <dd class="text-xs text-muted-foreground">
                        {{ dato.dura }}
                    </dd>
                </div>
            </dl>
        </section>

        <section class="flex flex-col gap-2">
            <h2 class="font-semibold">Si entrás con Google</h2>
            <p class="text-sm text-pretty">
                Google pone sus propias cookies, en su sitio, mientras iniciás
                sesión con tu cuenta de Google. Si entrás con email y contraseña
                no interviene.
            </p>
        </section>

        <section class="flex flex-col gap-2">
            <h2 class="font-semibold">Cómo borrarlo</h2>
            <p class="text-sm text-pretty">
                El historial se borra desde Historial → Borrar todo. Al salir de
                tu cuenta se borra la copia del historial que había en este
                dispositivo (en tu cuenta sigue estando). El resto lo podés
                borrar cuando quieras desde la configuración de tu navegador; si
                borrás las cookies, vas a tener que volver a iniciar sesión.
            </p>
        </section>
    </div>
</template>
