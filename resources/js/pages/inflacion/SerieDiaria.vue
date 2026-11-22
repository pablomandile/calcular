<script setup lang="ts">
import { Download } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import CampoFecha from '@/components/calcular/CampoFecha.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import FuenteDeDatos from '@/components/calcular/FuenteDeDatos.vue';
import GraficoLinea from '@/components/calcular/GraficoLinea.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import { Button } from '@/components/ui/button';
import { useIndice } from '@/composables/useIndice';
import { formatoCorto, formatoLargo, sumarRestar } from '@/lib/calc/fechas';
import { resumenPeriodo } from '@/lib/calc/inflacion';
import type { Dec } from '@/lib/calc/numero';
import {
    formatearNumero,
    formatearPesos,
    formatearPorcentaje,
} from '@/lib/calc/numero';
import { armarCsv, numeroCsv } from '@/lib/csv';
import { descargarArchivo } from '@/lib/navegador';

/** CER y UVA: la misma pantalla con otra serie (ver routes/web.php). */
const props = defineProps<{ serie: 'cer' | 'uva' }>();

const CONFIG = {
    cer: {
        nombre: 'CER',
        fuente: 'BCRA, serie 3540',
        primera: '2002-02-02',
        formatear: (v: Dec | number) =>
            formatearNumero(v, { maxDecimales: 4, minDecimales: 4 }),
    },
    uva: {
        nombre: 'UVA',
        fuente: 'BCRA, serie 7913',
        primera: '2016-03-31',
        formatear: (v: Dec | number) => formatearPesos(v),
    },
} as const;

const cfg = computed(() => CONFIG[props.serie]);
const { datos, cargando } = useIndice(props.serie);

const desde = ref('');
const hasta = ref('');

// Por defecto, el último año.
watch(datos, (s) => {
    if (s) {
        hasta.value = s.ultimo;
        desde.value = sumarRestar(s.ultimo, -1, 'anios').fecha;
    }
});

const resumen = computed(() => {
    if (!datos.value || !desde.value || !hasta.value) {
        return null;
    }

    const [a, b] =
        desde.value <= hasta.value
            ? [desde.value, hasta.value]
            : [hasta.value, desde.value];

    return resumenPeriodo(datos.value.puntos, a, b);
});

const puntosGrafico = computed(
    () =>
        resumen.value?.filas.map((f) => ({
            x: f.fecha,
            y: f.valor.toNumber(),
        })) ?? [],
);

const POR_PAGINA = 31;
const visibles = ref(POR_PAGINA);
watch(resumen, () => (visibles.value = POR_PAGINA));

const filasTabla = computed(() =>
    [...(resumen.value?.filas ?? [])].reverse().slice(0, visibles.value),
);

function descargar(): void {
    if (!resumen.value) {
        return;
    }

    const csv = armarCsv(
        ['Fecha', `Valor ${cfg.value.nombre}`, 'Variación diaria %'],
        resumen.value.filas.map((f) => [
            f.fecha,
            numeroCsv(f.valor),
            numeroCsv(f.variacion?.times(100).toDecimalPlaces(6) ?? null),
        ]),
    );
    descargarArchivo(
        `${props.serie}-${resumen.value.primero.fecha}-a-${resumen.value.ultimo.fecha}.csv`,
        csv,
    );
}

const apartados = [
    { id: 'que', titulo: 'Qué es' },
    { id: 'como', titulo: 'Cómo se calcula' },
];
</script>

<template>
    <EncabezadoCalculadora :clave="serie" />

    <div
        class="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
        <div class="grid gap-5 sm:grid-cols-2">
            <CampoFecha
                id="desde"
                v-model="desde"
                etiqueta="Desde"
                :min="cfg.primera"
                :max="datos?.ultimo"
            />
            <CampoFecha
                id="hasta"
                v-model="hasta"
                etiqueta="Hasta"
                :min="cfg.primera"
                :max="datos?.ultimo"
            />
        </div>
        <FuenteDeDatos
            :datos="datos"
            :cargando="cargando"
            :fuente="cfg.fuente"
            enlace="https://www.bcra.gob.ar/PublicacionesEstadisticas/Principales_variables.asp"
            :ultimo="datos ? formatoCorto(datos.ultimo) : ''"
        />
    </div>

    <p
        v-if="datos && !cargando && !resumen && desde && hasta"
        class="mt-6 text-sm text-muted-foreground"
    >
        No hay valores entre esas fechas.
    </p>

    <template v-if="resumen">
        <div
            class="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
        >
            <section
                class="rounded-2xl border border-border bg-card p-5 shadow-sm"
                aria-labelledby="resumen-titulo"
            >
                <h2 id="resumen-titulo" class="text-sm text-muted-foreground">
                    Variación del período
                </h2>
                <p
                    class="numeros mt-1 text-3xl font-bold text-primary"
                    data-test="variacion"
                >
                    {{ formatearPorcentaje(resumen.variacion) }}
                </p>
                <p class="mt-1 text-sm text-muted-foreground">
                    Del {{ formatoCorto(resumen.primero.fecha) }} al
                    {{ formatoCorto(resumen.ultimo.fecha) }}.
                </p>
                <div class="mt-4">
                    <FilaDato
                        etiqueta="Valor inicial"
                        :valor="cfg.formatear(resumen.primero.valor)"
                    />
                    <FilaDato
                        etiqueta="Valor final"
                        :valor="cfg.formatear(resumen.ultimo.valor)"
                    />
                    <FilaDato
                        etiqueta="Registros"
                        :valor="formatearNumero(resumen.filas.length)"
                    />
                </div>
            </section>

            <section
                class="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
                <GraficoLinea
                    :titulo="`Valor ${cfg.nombre}`"
                    :puntos="puntosGrafico"
                    :formatear-y="cfg.formatear"
                    :formatear-x="formatoLargo"
                    :etiqueta-x="formatoCorto"
                />
            </section>
        </div>

        <section
            class="mt-6 rounded-2xl border border-border bg-card shadow-sm"
        >
            <div
                class="flex flex-wrap items-center justify-between gap-3 p-5 pb-3"
            >
                <h2 class="font-semibold">Día por día</h2>
                <Button variant="outline" class="h-10" @click="descargar">
                    <Download class="size-4" /> Descargar CSV
                </Button>
            </div>
            <div class="overflow-x-auto px-2 pb-3">
                <table class="numeros w-full text-sm">
                    <thead>
                        <tr class="text-left text-muted-foreground">
                            <th class="px-3 py-2 font-medium">Fecha</th>
                            <th class="px-3 py-2 text-right font-medium">
                                Valor
                            </th>
                            <th class="px-3 py-2 text-right font-medium">
                                Variación
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="f in filasTabla"
                            :key="f.fecha"
                            class="border-t border-border"
                        >
                            <td class="px-3 py-2">
                                {{ formatoCorto(f.fecha) }}
                            </td>
                            <td class="px-3 py-2 text-right">
                                {{ cfg.formatear(f.valor) }}
                            </td>
                            <td class="px-3 py-2 text-right">
                                {{
                                    f.variacion
                                        ? formatearPorcentaje(f.variacion, 3)
                                        : '—'
                                }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div
                v-if="visibles < resumen.filas.length"
                class="border-t border-border p-3 text-center"
            >
                <Button variant="ghost" class="h-10" @click="visibles += 100">
                    Mostrar más ({{
                        formatearNumero(resumen.filas.length - visibles)
                    }}
                    restantes)
                </Button>
            </div>
        </section>
    </template>

    <SeccionExplicacion :apartados="apartados">
        <template #que>
            <p v-if="serie === 'cer'">
                El Coeficiente de Estabilización de Referencia lo publica el
                BCRA todos los días. Se arma con el IPC del INDEC (con unos dos
                meses de rezago) repartido día a día, y vale 1 el 2 de febrero
                de 2002. Se usa para ajustar bonos, préstamos y otros contratos
                por inflación.
            </p>
            <p v-else>
                La Unidad de Valor Adquisitivo es una unidad de cuenta en pesos
                que se actualiza todos los días con el CER. Arrancó en $ 14,05
                el 31 de marzo de 2016 y se usa en créditos hipotecarios y
                plazos fijos UVA.
            </p>
        </template>
        <template #como>
            <ul class="numeros">
                <li>
                    Variación diaria = valor del día / valor del registro
                    anterior − 1
                </li>
                <li>Variación del período = valor final / valor inicial − 1</li>
            </ul>
            <p>
                El BCRA publica algunos valores por adelantado; acá se muestran
                hasta hoy.
                {{
                    serie === 'uva'
                        ? 'Que la UVA suba no es una tasa de interés: el crédito o el plazo fijo suman su propia tasa.'
                        : 'El CER solo no incluye intereses ni las cláusulas de cada contrato.'
                }}
            </p>
        </template>
    </SeccionExplicacion>
</template>
