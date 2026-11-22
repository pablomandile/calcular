<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { computed, ref, watch } from 'vue';
import CampoMes from '@/components/calcular/CampoMes.vue';
import CampoNumero from '@/components/calcular/CampoNumero.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import FuenteDeDatos from '@/components/calcular/FuenteDeDatos.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import TarjetaResultado from '@/components/calcular/TarjetaResultado.vue';
import { Button } from '@/components/ui/button';
import { useCalculo } from '@/composables/useCalculo';
import { obtenerSerie, useIndice } from '@/composables/useIndice';
import { useReusar } from '@/composables/useReusar';
import type { Mes } from '@/lib/calc/inflacion';
import {
    actualizarPorIpc,
    mesDe,
    nombreMes,
    porMes,
    sumarMeses,
} from '@/lib/calc/inflacion';
import {
    formatearNumero,
    formatearPesos,
    formatearPorcentaje,
} from '@/lib/calc/numero';
import { numeroRequerido } from '@/lib/calc/validar';

/** Primer mes del IPC Nacional (base diciembre 2016 = 100). */
const PRIMER_MES: Mes = '2016-12';

const { datos: serie, cargando } = useIndice('ipc');
const indice = computed(() =>
    serie.value ? porMes(serie.value.puntos) : null,
);
const ultimoMes = computed(() =>
    serie.value ? mesDe(serie.value.ultimo) : null,
);

const datos = ref({ monto: '', desde: PRIMER_MES, hasta: PRIMER_MES });

// Por defecto, el último año publicado.
watch(ultimoMes, (ultimo) => {
    if (ultimo && datos.value.hasta === PRIMER_MES) {
        datos.value.hasta = ultimo;
        datos.value.desde = sumarMeses(ultimo, -12);
    }
});

const { resultado, error, desactualizado, ejecutar } = useCalculo(
    datos,
    (d) => {
        if (!indice.value) {
            throw new Error('Esperá a que carguen los datos del IPC.');
        }

        const monto = numeroRequerido(d.monto, 'el monto');

        return {
            ...actualizarPorIpc(monto, d.desde, d.hasta, indice.value),
            monto,
            desde: d.desde,
            hasta: d.hasta,
        };
    },
    (d, r) => ({
        tipo: 'inflacion-ipc',
        titulo: `${formatearPesos(r.monto)} de ${nombreMes(r.desde)} a ${nombreMes(r.hasta)}`,
        resultado: formatearPesos(r.montoFinal),
        entrada: { ...d },
    }),
);

useReusar('inflacion-ipc', async (entrada) => {
    await obtenerSerie('ipc');
    datos.value = {
        monto: String(entrada.monto ?? ''),
        desde: String(entrada.desde ?? PRIMER_MES),
        hasta: String(entrada.hasta ?? PRIMER_MES),
    };
    ejecutar();
});

const haciaAtras = computed(
    () => resultado.value && resultado.value.hasta < resultado.value.desde,
);

const apartados = [
    { id: 'que', titulo: 'Qué calcula' },
    { id: 'formula', titulo: 'Fórmula' },
    { id: 'supuestos', titulo: 'Supuestos y límites' },
];
</script>

<template>
    <EncabezadoCalculadora clave="inflacion-ipc" />

    <div class="grid items-start gap-6 lg:grid-cols-2">
        <form
            class="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
            @submit.prevent="ejecutar"
        >
            <CampoNumero
                id="monto"
                v-model="datos.monto"
                etiqueta="Monto"
                prefijo="$"
                placeholder="Por ejemplo: 100.000"
            />
            <div class="grid gap-5 sm:grid-cols-2">
                <CampoMes
                    id="desde"
                    v-model="datos.desde"
                    etiqueta="Precios de"
                    :min="PRIMER_MES"
                    :max="ultimoMes ?? PRIMER_MES"
                />
                <CampoMes
                    id="hasta"
                    v-model="datos.hasta"
                    etiqueta="Llevado a precios de"
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
            <Button
                type="submit"
                size="lg"
                class="h-11 text-base"
                :disabled="!serie"
                >Calcular</Button
            >
        </form>

        <TarjetaResultado
            :etiqueta="
                resultado
                    ? `Equivale en ${nombreMes(resultado.hasta)} a`
                    : 'Equivale a'
            "
            :valor="resultado ? formatearPesos(resultado.montoFinal) : null"
            :error="error"
            :desactualizado="desactualizado"
        >
            <template v-if="resultado">
                <FilaDato
                    :etiqueta="
                        haciaAtras
                            ? 'Deflación aplicada'
                            : 'Inflación del período'
                    "
                    :valor="formatearPorcentaje(resultado.variacion)"
                />
                <FilaDato
                    etiqueta="Coeficiente"
                    ayuda="IPC final / IPC inicial"
                    :valor="
                        formatearNumero(resultado.coeficiente, {
                            maxDecimales: 6,
                        })
                    "
                />
                <FilaDato
                    :etiqueta="`IPC de ${nombreMes(resultado.desde)}`"
                    :valor="
                        formatearNumero(resultado.indiceDesde, {
                            maxDecimales: 4,
                        })
                    "
                />
                <FilaDato
                    :etiqueta="`IPC de ${nombreMes(resultado.hasta)}`"
                    :valor="
                        formatearNumero(resultado.indiceHasta, {
                            maxDecimales: 4,
                        })
                    "
                />
                <FilaDato
                    etiqueta="Meses"
                    :valor="formatearNumero(Math.abs(resultado.meses))"
                />
            </template>
            <template #extra>
                <p
                    v-if="haciaAtras"
                    class="mt-2 rounded-lg bg-celeste-suave px-3 py-2 text-sm"
                >
                    El mes final es anterior al inicial: el monto se llevó a
                    precios de antes.
                </p>
                <p v-if="resultado" class="mt-3 text-sm text-muted-foreground">
                    ¿Querés ver mes por mes?
                    <Link
                        href="/inflacion/serie-mensual"
                        class="text-primary underline underline-offset-2"
                        >Serie de inflación mensual</Link
                    >
                </p>
            </template>
        </TarjetaResultado>
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #que>
            <p>
                Cuánto vale hoy (o en cualquier otro mes) una plata de un mes
                anterior, según el Índice de Precios al Consumidor del INDEC: el
                monto que hace falta para comprar lo mismo que se compraba con
                él.
            </p>
        </template>
        <template #formula>
            <ul class="numeros">
                <li>Coeficiente = IPC del mes final / IPC del mes inicial</li>
                <li>Monto equivalente = monto × coeficiente</li>
                <li>Inflación del período = coeficiente − 1</li>
            </ul>
            <p>
                Se divide el número índice de cada mes, no se suman ni se
                encadenan porcentajes redondeados: el resultado es exacto.
            </p>
        </template>
        <template #supuestos>
            <ul>
                <li>
                    Usa el IPC Nacional, nivel general (base diciembre 2016 =
                    100). La serie oficial actual empieza en diciembre de 2016.
                </li>
                <li>
                    Compara precios promedio de cada mes: de enero a marzo es la
                    inflación de febrero y marzo.
                </li>
                <li>
                    El INDEC publica cada mes a mediados del mes siguiente; el
                    último disponible se toma solo todos los días.
                </li>
                <li>
                    Es una referencia de poder de compra: un contrato, un
                    crédito o un reclamo judicial pueden usar otro índice (ICL,
                    CER, UVA, tasa) o fechas distintas.
                </li>
            </ul>
        </template>
    </SeccionExplicacion>
</template>
