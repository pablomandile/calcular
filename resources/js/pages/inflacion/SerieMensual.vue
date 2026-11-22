<script setup lang="ts">
import { Download } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import CampoMes from '@/components/calcular/CampoMes.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import FuenteDeDatos from '@/components/calcular/FuenteDeDatos.vue';
import GraficoLinea from '@/components/calcular/GraficoLinea.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import SelectorOpciones from '@/components/calcular/SelectorOpciones.vue';
import { Button } from '@/components/ui/button';
import { useIndice } from '@/composables/useIndice';
import type { Mes } from '@/lib/calc/inflacion';
import {
    acumuladaDeMeses,
    filasMensuales,
    mesDe,
    nombreMes,
    nombreMesCorto,
    porMes,
    sumarMeses,
} from '@/lib/calc/inflacion';
import { D, formatearPorcentaje } from '@/lib/calc/numero';
import { armarCsv, numeroCsv } from '@/lib/csv';
import { descargarArchivo } from '@/lib/navegador';

/** Primer mes con variación mensual (el IPC arranca en diciembre de 2016). */
const PRIMER_MES: Mes = '2017-01';

const { datos: serie, cargando } = useIndice('ipc');
const ultimoMes = computed(() =>
    serie.value ? mesDe(serie.value.ultimo) : null,
);
const todas = computed(() =>
    serie.value ? filasMensuales(serie.value.puntos) : [],
);

const desde = ref<Mes>(PRIMER_MES);
const hasta = ref<Mes>(PRIMER_MES);
const medida = ref<'mensual' | 'interanual'>('mensual');

// Por defecto, los últimos 24 meses.
watch(ultimoMes, (ultimo) => {
    if (ultimo) {
        hasta.value = ultimo;
        desde.value = sumarMeses(ultimo, -23);
    }
});

const rango = computed(() => {
    const [a, b] =
        desde.value <= hasta.value
            ? [desde.value, hasta.value]
            : [hasta.value, desde.value];

    return { desde: a, hasta: b };
});

const filas = computed(() =>
    todas.value.filter(
        (f) => f.mes >= rango.value.desde && f.mes <= rango.value.hasta,
    ),
);

const resumen = computed(() => {
    if (!serie.value || filas.value.length === 0) {
        return null;
    }

    const acumulada = acumuladaDeMeses(
        porMes(serie.value.puntos),
        rango.value.desde,
        rango.value.hasta,
    );
    const n = filas.value.length;

    return {
        acumulada,
        meses: n,
        promedio: acumulada.plus(1).pow(new D(1).div(n)).minus(1),
    };
});

const puntosGrafico = computed(() =>
    filas.value
        .filter((f) => f[medida.value] !== null)
        .map((f) => ({ x: f.mes, y: f[medida.value]!.toNumber() })),
);

const filasTabla = computed(() => [...filas.value].reverse());

function descargar(): void {
    const csv = armarCsv(
        [
            'Mes',
            'IPC (dic-2016 = 100)',
            'Inflación mensual %',
            'Inflación interanual %',
        ],
        filas.value.map((f) => [
            f.mes,
            numeroCsv(f.indice),
            numeroCsv(f.mensual?.times(100).toDecimalPlaces(4) ?? null),
            numeroCsv(f.interanual?.times(100).toDecimalPlaces(4) ?? null),
        ]),
    );
    descargarArchivo(
        `inflacion-${rango.value.desde}-a-${rango.value.hasta}.csv`,
        csv,
    );
}

const apartados = [
    { id: 'como', titulo: 'Cómo se calcula' },
    { id: 'lectura', titulo: 'Cómo leerla' },
];
</script>

<template>
    <EncabezadoCalculadora clave="serie-inflacion" />

    <div
        class="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
        <div class="grid gap-5 sm:grid-cols-2">
            <CampoMes
                id="desde"
                v-model="desde"
                etiqueta="Desde"
                :min="PRIMER_MES"
                :max="ultimoMes ?? PRIMER_MES"
            />
            <CampoMes
                id="hasta"
                v-model="hasta"
                etiqueta="Hasta"
                :min="PRIMER_MES"
                :max="ultimoMes ?? PRIMER_MES"
            />
        </div>
        <FuenteDeDatos
            :datos="serie"
            :cargando="cargando"
            fuente="IPC Nacional del INDEC"
            enlace="https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31"
            :ultimo="ultimoMes ? nombreMes(ultimoMes) : ''"
        />
    </div>

    <template v-if="resumen">
        <div
            class="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
        >
            <section
                class="rounded-2xl border border-border bg-card p-5 shadow-sm"
                aria-labelledby="resumen-titulo"
            >
                <h2 id="resumen-titulo" class="text-sm text-muted-foreground">
                    Inflación acumulada
                </h2>
                <p
                    class="numeros mt-1 text-3xl font-bold text-primary"
                    data-test="acumulada"
                >
                    {{ formatearPorcentaje(resumen.acumulada) }}
                </p>
                <p class="mt-1 text-sm text-muted-foreground">
                    De {{ nombreMes(rango.desde) }} a
                    {{ nombreMes(rango.hasta) }}, los dos incluidos.
                </p>
                <div class="mt-4">
                    <FilaDato etiqueta="Meses" :valor="String(resumen.meses)" />
                    <FilaDato
                        etiqueta="Promedio mensual"
                        ayuda="La tasa pareja que da el mismo acumulado"
                        :valor="formatearPorcentaje(resumen.promedio)"
                    />
                </div>
            </section>

            <section
                class="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
                <SelectorOpciones
                    v-model="medida"
                    nombre="medida"
                    etiqueta="Mostrar"
                    :opciones="[
                        { valor: 'mensual', titulo: 'Mensual' },
                        { valor: 'interanual', titulo: 'Interanual' },
                    ]"
                />
                <GraficoLinea
                    v-if="puntosGrafico.length"
                    :titulo="
                        medida === 'mensual'
                            ? 'Inflación mensual'
                            : 'Inflación interanual'
                    "
                    :puntos="puntosGrafico"
                    :formatear-y="(y) => formatearPorcentaje(y, 1)"
                    :formatear-x="nombreMes"
                    :etiqueta-x="nombreMesCorto"
                    con-cero
                />
            </section>
        </div>

        <section
            class="mt-6 rounded-2xl border border-border bg-card shadow-sm"
        >
            <div
                class="flex flex-wrap items-center justify-between gap-3 p-5 pb-3"
            >
                <h2 class="font-semibold">Mes por mes</h2>
                <Button variant="outline" class="h-10" @click="descargar">
                    <Download class="size-4" /> Descargar CSV
                </Button>
            </div>
            <div class="overflow-x-auto px-2 pb-3">
                <table class="numeros w-full text-sm">
                    <thead>
                        <tr class="text-left text-muted-foreground">
                            <th class="px-3 py-2 font-medium">Mes</th>
                            <th class="px-3 py-2 text-right font-medium">
                                Mensual
                            </th>
                            <th class="px-3 py-2 text-right font-medium">
                                Interanual
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="f in filasTabla"
                            :key="f.mes"
                            class="border-t border-border"
                        >
                            <td class="px-3 py-2">
                                {{ nombreMesCorto(f.mes) }}
                            </td>
                            <td class="px-3 py-2 text-right">
                                {{
                                    f.mensual
                                        ? formatearPorcentaje(f.mensual, 1)
                                        : '—'
                                }}
                            </td>
                            <td class="px-3 py-2 text-right">
                                {{
                                    f.interanual
                                        ? formatearPorcentaje(f.interanual, 1)
                                        : '—'
                                }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </template>

    <SeccionExplicacion :apartados="apartados">
        <template #como>
            <ul class="numeros">
                <li>Mensual = IPC del mes / IPC del mes anterior − 1</li>
                <li>
                    Interanual = IPC del mes / IPC del mismo mes del año
                    anterior − 1
                </li>
                <li>
                    Acumulada = IPC del último mes / IPC del mes anterior al
                    primero − 1
                </li>
            </ul>
            <p>
                Todo sale del número índice del IPC Nacional del INDEC (base
                diciembre 2016 = 100), sin sumar porcentajes redondeados.
            </p>
        </template>
        <template #lectura>
            <ul>
                <li>
                    La mensual dice cuánto subieron los precios en un mes; la
                    interanual, en los últimos doce.
                </li>
                <li>
                    Las mensuales no se suman: 2 % y 3 % dan 5,06 %, no 5 %.
                </li>
                <li>
                    El INDEC publica cada mes a mediados del siguiente y a veces
                    corrige meses anteriores: la serie se actualiza todos los
                    días.
                </li>
            </ul>
        </template>
    </SeccionExplicacion>
</template>
