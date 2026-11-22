<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatearPesos } from '@/lib/calc/numero';

/**
 * Barras apiladas por año: lo aportado (abajo) y los intereses (arriba).
 * Una sola escala, grilla recesiva, 2px de separación entre segmentos y
 * tooltip por año con mouse, toque o teclado. La tabla de abajo es la vista
 * accesible de los mismos datos.
 */
const props = defineProps<{
    filas: { anio: number; aportes: number; intereses: number }[];
}>();

const ALTO = 220;
const activo = ref<number | null>(null);

const compacto = new Intl.NumberFormat('es-AR', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

/** Escala "linda": 0, 25 %, 50 %, 75 %, 100 % de un máximo redondo. */
const escala = computed(() => {
    const max = Math.max(...props.filas.map((f) => f.aportes + f.intereses), 1);
    // El paso sale de max/4 (no de max): así el tope queda justo arriba del
    // máximo y no deja media escala vacía.
    const crudo = max / 4;
    const magnitud = 10 ** Math.floor(Math.log10(crudo));
    const paso =
        [1, 2, 2.5, 5, 10].map((m) => m * magnitud).find((p) => p >= crudo) ??
        crudo;

    return {
        tope: paso * 4,
        marcas: [0, 1, 2, 3, 4].map((i) => paso * i),
    };
});

function alto(valor: number): number {
    return (valor / escala.value.tope) * ALTO;
}

/** Con muchos años no entran todas las etiquetas: se muestra cada k. */
const cadaCuanto = computed(() => Math.ceil(props.filas.length / 10));

/** El tooltip va en la mitad opuesta a la barra, para no taparla. */
const enMitadIzquierda = computed(
    () => activo.value !== null && activo.value < props.filas.length / 2,
);

const filaActiva = computed(() =>
    activo.value === null ? null : props.filas[activo.value],
);
</script>

<template>
    <figure class="mt-5">
        <figcaption
            class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
        >
            <span class="font-medium">Crecimiento por año</span>
            <span class="flex items-center gap-1.5 text-muted-foreground">
                <span class="size-3 rounded-sm bg-serie-1" aria-hidden="true" />
                Aportado
            </span>
            <span class="flex items-center gap-1.5 text-muted-foreground">
                <span class="size-3 rounded-sm bg-serie-2" aria-hidden="true" />
                Intereses
            </span>
        </figcaption>

        <div class="relative flex gap-2 pt-2">
            <!-- Eje Y -->
            <div
                class="numeros relative w-12 shrink-0 text-right text-xs text-muted-foreground"
                :style="{ height: `${ALTO}px` }"
                aria-hidden="true"
            >
                <span
                    v-for="m in escala.marcas"
                    :key="m"
                    class="absolute right-0 -translate-y-1/2"
                    :style="{ bottom: `${alto(m)}px` }"
                    >{{ compacto.format(m) }}</span
                >
            </div>

            <div class="relative min-w-0 flex-1">
                <!-- Grilla -->
                <div
                    v-for="m in escala.marcas"
                    :key="`g${m}`"
                    class="absolute inset-x-0 border-t border-border/70"
                    :class="m === 0 && 'border-muted-foreground/40'"
                    :style="{ bottom: `${alto(m)}px` }"
                    aria-hidden="true"
                />

                <div
                    class="relative flex items-end gap-[2px]"
                    :style="{ height: `${ALTO}px` }"
                    role="list"
                    aria-label="Saldo de cada año"
                    @mouseleave="activo = null"
                >
                    <button
                        v-for="(f, i) in filas"
                        :key="f.anio"
                        type="button"
                        role="listitem"
                        class="group flex h-full min-w-0 flex-1 flex-col justify-end outline-none"
                        :aria-label="`Año ${f.anio}: ${formatearPesos(f.aportes + f.intereses)}, de los cuales ${formatearPesos(f.intereses)} son intereses`"
                        @mouseenter="activo = i"
                        @focus="activo = i"
                        @blur="activo = null"
                        @click="activo = i"
                    >
                        <span
                            class="block w-full rounded-t-[4px] bg-serie-2 transition-opacity"
                            :class="
                                activo !== null && activo !== i && 'opacity-50'
                            "
                            :style="{
                                height: `${Math.max(alto(f.intereses) - 2, 0)}px`,
                            }"
                        />
                        <span
                            class="mt-[2px] block w-full bg-serie-1 transition-opacity group-focus-visible:ring-2 group-focus-visible:ring-ring"
                            :class="[
                                activo !== null && activo !== i && 'opacity-50',
                                alto(f.intereses) < 2 && 'rounded-t-[4px]',
                            ]"
                            :style="{ height: `${alto(f.aportes)}px` }"
                        />
                    </button>
                </div>

                <!-- Tooltip -->
                <div
                    v-if="filaActiva"
                    class="numeros pointer-events-none absolute top-0 z-10 rounded-lg border border-border bg-popover px-3 py-2 text-xs whitespace-nowrap shadow-md"
                    :class="enMitadIzquierda ? 'right-0' : 'left-0'"
                >
                    <p class="mb-1 font-semibold">Año {{ filaActiva.anio }}</p>
                    <p class="flex justify-between gap-3">
                        <span class="text-muted-foreground">Aportado</span>
                        {{ formatearPesos(filaActiva.aportes) }}
                    </p>
                    <p class="flex justify-between gap-3">
                        <span class="text-muted-foreground">Intereses</span>
                        {{ formatearPesos(filaActiva.intereses) }}
                    </p>
                    <p
                        class="mt-1 flex justify-between gap-3 border-t border-border pt-1 font-semibold"
                    >
                        <span>Total</span>
                        {{
                            formatearPesos(
                                filaActiva.aportes + filaActiva.intereses,
                            )
                        }}
                    </p>
                </div>

                <!-- Eje X -->
                <div
                    class="numeros mt-1 flex gap-[2px] text-xs text-muted-foreground"
                    aria-hidden="true"
                >
                    <span
                        v-for="(f, i) in filas"
                        :key="`x${f.anio}`"
                        class="min-w-0 flex-1 text-center"
                        >{{
                            (i + 1) % cadaCuanto === 0 || i === 0 ? f.anio : ''
                        }}</span
                    >
                </div>
            </div>
        </div>
    </figure>
</template>
