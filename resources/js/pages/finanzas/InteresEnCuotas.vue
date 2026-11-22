<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
import CampoNumero from '@/components/calcular/CampoNumero.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import TarjetaResultado from '@/components/calcular/TarjetaResultado.vue';
import { Button } from '@/components/ui/button';
import { useCalculo } from '@/composables/useCalculo';
import { useReusar } from '@/composables/useReusar';
import { interesEnCuotas } from '@/lib/calc/cuotas';
import { formatearPesos, formatearPorcentaje } from '@/lib/calc/numero';
import { enteroRequerido, numeroRequerido } from '@/lib/calc/validar';

const datos = ref({
    monto: '',
    cuotas: '12',
    valorCuota: '',
    primeraDias: '30',
});

const { resultado, error, desactualizado, ejecutar } = useCalculo(
    datos,
    (d) => {
        const monto = numeroRequerido(d.monto, 'el monto financiado');
        const cuotas = enteroRequerido(d.cuotas, 'la cantidad de cuotas', {
            min: 1,
            max: 360,
        });
        const valorCuota = numeroRequerido(
            d.valorCuota,
            'el valor de la cuota',
        );
        const primeraDias = enteroRequerido(
            d.primeraDias,
            'los días hasta la primera cuota',
            { min: 0, max: 365 },
        );

        return {
            ...interesEnCuotas(monto, {
                cuotas,
                valorCuota,
                primeraDias,
                frecuenciaDias: 30,
            }),
            monto,
            cuotas,
            valorCuota,
        };
    },
    (d, r) => ({
        tipo: 'interes-en-cuotas',
        titulo: `${formatearPesos(r.monto)} en ${r.cuotas} cuotas de ${formatearPesos(r.valorCuota)}`,
        resultado: `TEA ${formatearPorcentaje(r.tea)}`,
        entrada: { ...d },
    }),
);

useReusar('interes-en-cuotas', (entrada) => {
    datos.value = {
        monto: String(entrada.monto ?? ''),
        cuotas: String(entrada.cuotas ?? '12'),
        valorCuota: String(entrada.valorCuota ?? ''),
        primeraDias: String(entrada.primeraDias ?? '30'),
    };
    ejecutar();
});

const aviso = computed(() => {
    const r = resultado.value;

    if (!r) {
        return null;
    }

    if (r.tasaMensual.isZero()) {
        return 'Pagás exactamente el monto: son cuotas sin interés de verdad.';
    }

    if (r.tasaMensual.isNegative()) {
        return 'Pagás menos que el monto financiado: en la práctica es un descuento.';
    }

    return null;
});

const apartados = [
    { id: 'que', titulo: 'Qué calcula' },
    { id: 'formula', titulo: 'Fórmula' },
    { id: 'ejemplo', titulo: 'Ejemplo' },
    { id: 'errores', titulo: 'Errores frecuentes' },
    { id: 'supuestos', titulo: 'Supuestos y límites' },
];
</script>

<template>
    <EncabezadoCalculadora clave="interes-en-cuotas" />

    <div class="grid items-start gap-6 lg:grid-cols-2">
        <form
            class="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
            @submit.prevent="ejecutar"
        >
            <CampoNumero
                id="monto"
                v-model="datos.monto"
                etiqueta="Monto financiado"
                prefijo="$"
                placeholder="Por ejemplo: 1.000.000"
                ayuda="El precio de contado menos lo que pagás en el momento."
            />
            <div class="grid gap-5 sm:grid-cols-2">
                <CampoNumero
                    id="cuotas"
                    v-model="datos.cuotas"
                    etiqueta="Cantidad de cuotas"
                    entero
                    :formatear="false"
                />
                <CampoNumero
                    id="valor-cuota"
                    v-model="datos.valorCuota"
                    etiqueta="Valor de cada cuota"
                    prefijo="$"
                    placeholder="Por ejemplo: 110.000"
                />
            </div>
            <CampoNumero
                id="primera"
                v-model="datos.primeraDias"
                etiqueta="Primera cuota a los"
                sufijo="días"
                entero
                :formatear="false"
                ayuda="0 si la primera se paga en el momento de la compra."
            />
            <Button type="submit" size="lg" class="h-11 text-base"
                >Calcular</Button
            >
        </form>

        <TarjetaResultado
            etiqueta="Tasa efectiva anual (TEA)"
            :valor="resultado ? formatearPorcentaje(resultado.tea) : null"
            :error="error"
            :desactualizado="desactualizado"
        >
            <template v-if="resultado">
                <FilaDato
                    etiqueta="Tasa mensual"
                    :valor="formatearPorcentaje(resultado.tasaMensual)"
                />
                <FilaDato
                    etiqueta="TNA"
                    ayuda="Tasa mensual × 12"
                    :valor="formatearPorcentaje(resultado.tna)"
                />
                <FilaDato
                    etiqueta="Pagás en total"
                    :valor="formatearPesos(resultado.totalPagado)"
                />
                <FilaDato
                    etiqueta="Recargo"
                    ayuda="Sobre el monto financiado; no es una tasa anual"
                    :valor="`${formatearPesos(resultado.recargo)} (${formatearPorcentaje(resultado.recargoPorcentaje)})`"
                />
            </template>
            <template #extra>
                <p
                    v-if="aviso"
                    class="mt-2 rounded-lg bg-celeste-suave px-3 py-2 text-sm"
                >
                    {{ aviso }}
                </p>
                <p v-if="resultado" class="mt-3 text-sm text-muted-foreground">
                    ¿Te conviene o es mejor pagar de contado?
                    <Link
                        href="/finanzas/contado-vs-cuotas"
                        class="text-primary underline underline-offset-2"
                        >Contado vs. cuotas</Link
                    >
                </p>
            </template>
        </TarjetaResultado>
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #que>
            <p>
                La tasa de interés que estás pagando de verdad en una compra o
                un préstamo en cuotas fijas, aunque nadie te la diga: la que
                hace que las cuotas, descontadas en el tiempo, valgan lo mismo
                que el monto que te financian.
            </p>
        </template>
        <template #formula>
            <ul class="numeros">
                <li>
                    Monto financiado = Σ cuota / (1 + r)^(días de cada cuota /
                    30)
                </li>
                <li>TNA = r × 12 · TEA = (1 + r)¹² − 1</li>
            </ul>
            <p>
                La tasa mensual r se busca por aproximaciones sucesivas hasta
                que las dos puntas coinciden.
            </p>
        </template>
        <template #ejemplo>
            <p>
                {{ formatearPesos(1000000) }} en 12 cuotas de
                {{ formatearPesos(110000) }}, la primera a los 30 días: pagás
                {{ formatearPesos(1320000) }}, un recargo de 32 %. La tasa es
                4,55 % mensual, una TEA de 70,6 %.
            </p>
        </template>
        <template #errores>
            <ul>
                <li>
                    Poner el precio total cuando hubo un anticipo: va lo que
                    queda financiado.
                </li>
                <li>
                    Confundir el recargo (32 %) con la tasa: el recargo no tiene
                    en cuenta cuándo pagás cada cuota.
                </li>
                <li>
                    Dejar 30 días cuando la primera cuota se paga en el momento
                    (la tasa real es más alta).
                </li>
            </ul>
        </template>
        <template #supuestos>
            <ul>
                <li>Todas las cuotas son iguales y mensuales.</li>
                <li>
                    Si hay seguros, sellados o comisiones fuera de la cuota, no
                    entran: el costo financiero total (CFT) del contrato puede
                    ser más alto.
                </li>
                <li>
                    No sirve para cuotas que se ajustan (UVA, CER, tasa
                    variable).
                </li>
            </ul>
        </template>
    </SeccionExplicacion>
</template>
