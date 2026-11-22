<script setup lang="ts">
import { computed } from 'vue';
import type { Mes } from '@/lib/calc/inflacion';
import { cn } from '@/lib/utils';

/**
 * Un mes ("AAAA-MM") con dos desplegables nativos, mes y año. No usa
 * <input type="month">: Safari y Firefox de escritorio lo muestran como texto.
 */
const props = defineProps<{
    id: string;
    etiqueta: string;
    min: Mes;
    max: Mes;
    ayuda?: string;
}>();

const modelo = defineModel<Mes>({ required: true });

const MESES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

const anioMin = computed(() => Number(props.min.slice(0, 4)));
const anioMax = computed(() => Number(props.max.slice(0, 4)));
const anio = computed(() => Number(modelo.value.slice(0, 4)));
const mes = computed(() => Number(modelo.value.slice(5, 7)));

const anios = computed(() =>
    Array.from(
        { length: anioMax.value - anioMin.value + 1 },
        (_, i) => anioMax.value - i,
    ),
);

function armar(a: number, m: number): Mes {
    const mes = `${a}-${String(m).padStart(2, '0')}`;

    // Si el año nuevo no tiene ese mes con datos, se va al borde del rango.
    return mes < props.min ? props.min : mes > props.max ? props.max : mes;
}

function fueraDeRango(m: number): boolean {
    const candidato = `${anio.value}-${String(m).padStart(2, '0')}`;

    return candidato < props.min || candidato > props.max;
}

const clases =
    'h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:[color-scheme:dark]';
</script>

<template>
    <fieldset class="grid min-w-0 gap-1.5">
        <legend class="mb-1.5 text-sm font-medium">{{ etiqueta }}</legend>
        <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-2">
            <label :for="`${id}-mes`" class="sr-only">Mes</label>
            <select
                :id="`${id}-mes`"
                :class="cn(clases)"
                :value="mes"
                @change="
                    modelo = armar(
                        anio,
                        Number(($event.target as HTMLSelectElement).value),
                    )
                "
            >
                <option
                    v-for="(nombre, i) in MESES"
                    :key="nombre"
                    :value="i + 1"
                    :disabled="fueraDeRango(i + 1)"
                >
                    {{ nombre }}
                </option>
            </select>
            <label :for="`${id}-anio`" class="sr-only">Año</label>
            <select
                :id="`${id}-anio`"
                :class="cn('numeros', clases)"
                :value="anio"
                @change="
                    modelo = armar(
                        Number(($event.target as HTMLSelectElement).value),
                        mes,
                    )
                "
            >
                <option v-for="a in anios" :key="a" :value="a">{{ a }}</option>
            </select>
        </div>
        <p v-if="ayuda" class="text-sm text-muted-foreground">{{ ayuda }}</p>
    </fieldset>
</template>
