<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * Una serie en el tiempo, como línea. Una sola escala, grilla recesiva, línea
 * de 2px y, al pasar el mouse, tocar o moverse con las flechas, una guía
 * vertical con el valor. Los ejes son HTML (escalan con el tamaño de letra);
 * el SVG solo dibuja. La tabla que acompaña al gráfico es la vista accesible.
 */
const props = defineProps<{
    titulo: string;
    puntos: { x: string; y: number }[];
    /** Valor del eje y del tooltip: "2,1 %", "$ 2.206,78". */
    formatearY: (y: number) => string;
    /** Etiqueta del tooltip: "octubre de 2026". */
    formatearX: (x: string) => string;
    /** Etiqueta corta del eje: "oct 2026". */
    etiquetaX: (x: string) => string;
    /** Que el 0 entre en la escala (porcentajes que pueden ser negativos). */
    conCero?: boolean;
}>();

const ALTO = 220;
const contenedor = ref<HTMLElement | null>(null);
const ancho = ref(600);
const activo = ref<number | null>(null);
let observador: ResizeObserver | null = null;

onMounted(() => {
    if (!contenedor.value) {
        return;
    }

    ancho.value = contenedor.value.clientWidth || 600;

    if (typeof ResizeObserver !== 'undefined') {
        observador = new ResizeObserver(([e]) => {
            ancho.value = e.contentRect.width || ancho.value;
        });
        observador.observe(contenedor.value);
    }
});

onBeforeUnmount(() => observador?.disconnect());

/** Escala "linda" de 5 marcas con un paso redondo. */
const escala = computed(() => {
    const ys = props.puntos.map((p) => p.y);
    let min = Math.min(...ys);
    let max = Math.max(...ys);

    if (props.conCero) {
        min = Math.min(min, 0);
        max = Math.max(max, 0);
    }

    if (min === max) {
        max = min + 1;
    }

    const crudo = (max - min) / 4;
    const magnitud = 10 ** Math.floor(Math.log10(crudo));
    const paso =
        [1, 2, 2.5, 5, 10].map((m) => m * magnitud).find((p) => p >= crudo) ??
        crudo;
    const desde = Math.floor(min / paso) * paso;
    const cantidad = Math.max(Math.ceil((max - desde) / paso), 1);

    return {
        desde,
        hasta: desde + paso * cantidad,
        marcas: Array.from(
            { length: cantidad + 1 },
            (_, i) => desde + paso * i,
        ),
    };
});

function y(valor: number): number {
    const { desde, hasta } = escala.value;

    return ALTO - ((valor - desde) / (hasta - desde)) * ALTO;
}

function x(i: number): number {
    const n = props.puntos.length;

    return n <= 1 ? ancho.value / 2 : (i / (n - 1)) * ancho.value;
}

const camino = computed(() =>
    props.puntos
        .map(
            (p, i) =>
                `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`,
        )
        .join(''),
);

/** Unas 5 etiquetas en el eje x, repartidas. */
const marcasX = computed(() => {
    const n = props.puntos.length;
    const cantidad = Math.min(n, ancho.value < 420 ? 3 : 5);

    if (cantidad <= 1) {
        return n ? [0] : [];
    }

    return Array.from({ length: cantidad }, (_, i) =>
        Math.round((i * (n - 1)) / (cantidad - 1)),
    );
});

const puntoActivo = computed(() =>
    activo.value === null ? null : props.puntos[activo.value],
);

const enMitadIzquierda = computed(
    () => activo.value !== null && activo.value < props.puntos.length / 2,
);

function alMover(evento: PointerEvent): void {
    const rect = (evento.currentTarget as Element).getBoundingClientRect();
    const n = props.puntos.length;
    const relativo = Math.min(
        Math.max((evento.clientX - rect.left) / rect.width, 0),
        1,
    );
    activo.value = Math.round(relativo * (n - 1));
}

function alTeclear(evento: KeyboardEvent): void {
    const n = props.puntos.length;
    const actual = activo.value ?? n - 1;
    const salto = evento.shiftKey ? 10 : 1;
    const nuevo = {
        ArrowLeft: actual - salto,
        ArrowRight: actual + salto,
        Home: 0,
        End: n - 1,
    }[evento.key];

    if (nuevo !== undefined) {
        evento.preventDefault();
        activo.value = Math.min(Math.max(nuevo, 0), n - 1);
    }
}

const resumen = computed(() => {
    const p = props.puntos;

    if (p.length === 0) {
        return props.titulo;
    }

    return `${props.titulo}, de ${props.formatearX(p[0].x)} a ${props.formatearX(p[p.length - 1].x)}: empieza en ${props.formatearY(p[0].y)} y termina en ${props.formatearY(p[p.length - 1].y)}. Usá las flechas para recorrer los valores.`;
});
</script>

<template>
    <figure class="mt-2">
        <figcaption class="mb-3 text-sm font-medium">{{ titulo }}</figcaption>

        <div class="relative flex gap-2 pt-2">
            <!-- Eje Y -->
            <div
                class="numeros relative w-16 shrink-0 text-right text-xs text-muted-foreground"
                :style="{ height: `${ALTO}px` }"
                aria-hidden="true"
            >
                <span
                    v-for="m in escala.marcas"
                    :key="m"
                    class="absolute right-0 -translate-y-1/2 whitespace-nowrap"
                    :style="{ top: `${y(m)}px` }"
                    >{{ formatearY(m) }}</span
                >
            </div>

            <div ref="contenedor" class="relative min-w-0 flex-1">
                <svg
                    :width="ancho"
                    :height="ALTO"
                    :viewBox="`0 0 ${ancho} ${ALTO}`"
                    class="block touch-pan-y overflow-visible rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    role="img"
                    tabindex="0"
                    :aria-label="resumen"
                    data-test="grafico-linea"
                    @pointermove="alMover"
                    @pointerdown="alMover"
                    @pointerleave="activo = null"
                    @keydown="alTeclear"
                    @blur="activo = null"
                >
                    <!-- Grilla -->
                    <line
                        v-for="m in escala.marcas"
                        :key="`g${m}`"
                        x1="0"
                        :x2="ancho"
                        :y1="y(m)"
                        :y2="y(m)"
                        class="stroke-border"
                        :class="
                            m === 0 && conCero && 'stroke-muted-foreground/50'
                        "
                        stroke-width="1"
                    />
                    <path
                        :d="camino"
                        fill="none"
                        class="stroke-serie-1"
                        stroke-width="2"
                        stroke-linejoin="round"
                        stroke-linecap="round"
                    />
                    <template v-if="puntoActivo && activo !== null">
                        <line
                            :x1="x(activo)"
                            :x2="x(activo)"
                            y1="0"
                            :y2="ALTO"
                            class="stroke-muted-foreground/60"
                            stroke-width="1"
                        />
                        <circle
                            :cx="x(activo)"
                            :cy="y(puntoActivo.y)"
                            r="5"
                            class="fill-serie-1 stroke-card"
                            stroke-width="2"
                        />
                    </template>
                </svg>

                <!-- Tooltip -->
                <div
                    v-if="puntoActivo"
                    class="numeros pointer-events-none absolute top-0 z-10 rounded-lg border border-border bg-popover px-3 py-2 text-xs whitespace-nowrap shadow-md"
                    :class="enMitadIzquierda ? 'right-0' : 'left-0'"
                    aria-live="polite"
                    data-test="tooltip-grafico"
                >
                    <p class="text-muted-foreground">
                        {{ formatearX(puntoActivo.x) }}
                    </p>
                    <p class="text-sm font-semibold">
                        {{ formatearY(puntoActivo.y) }}
                    </p>
                </div>

                <!-- Eje X -->
                <div
                    class="numeros relative mt-1 h-5 text-xs text-muted-foreground"
                    aria-hidden="true"
                >
                    <span
                        v-for="(i, k) in marcasX"
                        :key="`x${i}`"
                        class="absolute whitespace-nowrap"
                        :class="
                            k === 0
                                ? 'left-0'
                                : k === marcasX.length - 1
                                  ? 'right-0'
                                  : '-translate-x-1/2'
                        "
                        :style="
                            k === 0 || k === marcasX.length - 1
                                ? {}
                                : { left: `${x(i)}px` }
                        "
                        >{{ etiquetaX(puntos[i].x) }}</span
                    >
                </div>
            </div>
        </div>
    </figure>
</template>
