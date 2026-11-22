<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
import CampoNumero from '@/components/calcular/CampoNumero.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import SelectorOpciones from '@/components/calcular/SelectorOpciones.vue';
import TarjetaResultado from '@/components/calcular/TarjetaResultado.vue';
import { Button } from '@/components/ui/button';
import { useCalculo } from '@/composables/useCalculo';
import { useReusar } from '@/composables/useReusar';
import type { Frecuencia } from '@/lib/calc/cuotas';
import { contadoVsCuotas, mensualDesdeAnual } from '@/lib/calc/cuotas';
import { D, formatearPesos, formatearPorcentaje } from '@/lib/calc/numero';
import {
    enteroRequerido,
    numeroOpcional,
    numeroRequerido,
} from '@/lib/calc/validar';

const FRECUENCIAS: { valor: Frecuencia; titulo: string }[] = [
    { valor: 30, titulo: 'Mensual' },
    { valor: 15, titulo: 'Quincenal' },
    { valor: 7, titulo: 'Semanal' },
];

const datos = ref({
    contado: '',
    anticipo: '',
    cuotas: '12',
    valorCuota: '',
    frecuencia: 30 as Frecuencia,
    primeraDias: '30',
    costos: '',
    tasa: '',
    tipoTasa: 'tna' as 'tna' | 'tea',
    inflacion: '',
});

const { resultado, error, desactualizado, ejecutar } = useCalculo(
    datos,
    (d) => {
        const contado = numeroRequerido(d.contado, 'el precio de contado');
        const tasa = numeroRequerido(d.tasa, 'cuánto rinde tu plata').div(100);
        const inflacion = numeroOpcional(d.inflacion, 'la inflación');
        const r = contadoVsCuotas({
            contado,
            anticipo: numeroOpcional(d.anticipo, 'el anticipo') ?? new D(0),
            costos: numeroOpcional(d.costos, 'los costos') ?? new D(0),
            plan: {
                cuotas: enteroRequerido(d.cuotas, 'la cantidad de cuotas', {
                    min: 1,
                    max: 360,
                }),
                valorCuota: numeroRequerido(
                    d.valorCuota,
                    'el valor de la cuota',
                ),
                primeraDias: enteroRequerido(
                    d.primeraDias,
                    'los días hasta la primera cuota',
                    { min: 0, max: 365 },
                ),
                frecuenciaDias: d.frecuencia,
            },
            oportunidadMensual: mensualDesdeAnual(tasa, d.tipoTasa),
            inflacionMensual: inflacion ? inflacion.div(100) : null,
        });

        return { ...r, contado };
    },
    (d, r) => ({
        tipo: 'contado-vs-cuotas',
        titulo: `${formatearPesos(r.contado)} de contado o ${d.cuotas} cuotas de ${formatearPesos(numeroRequerido(d.valorCuota, 'la cuota'))}`,
        resultado:
            r.conviene === 'da-igual'
                ? 'Da lo mismo'
                : `Conviene ${r.conviene === 'contado' ? 'el contado' : 'en cuotas'}`,
        entrada: { ...d },
    }),
);

useReusar('contado-vs-cuotas', (entrada) => {
    const texto = (clave: string, defecto = '') =>
        String(entrada[clave] ?? defecto);

    datos.value = {
        contado: texto('contado'),
        anticipo: texto('anticipo'),
        cuotas: texto('cuotas', '12'),
        valorCuota: texto('valorCuota'),
        frecuencia: ([30, 15, 7].includes(Number(entrada.frecuencia))
            ? Number(entrada.frecuencia)
            : 30) as Frecuencia,
        primeraDias: texto('primeraDias', '30'),
        costos: texto('costos'),
        tasa: texto('tasa'),
        tipoTasa: entrada.tipoTasa === 'tea' ? 'tea' : 'tna',
        inflacion: texto('inflacion'),
    };
    ejecutar();
});

const etiqueta = computed(() => {
    const r = resultado.value;

    if (!r) {
        return 'Qué conviene';
    }

    return {
        contado: 'Conviene pagar de contado: ahorrás',
        cuotas: 'Conviene pagar en cuotas: ahorrás',
        'da-igual': 'Da lo mismo: la diferencia es de',
    }[r.conviene];
});

const apartados = [
    { id: 'que', titulo: 'Cómo decide' },
    { id: 'formula', titulo: 'Fórmulas' },
    { id: 'ejemplo', titulo: 'Ejemplo' },
    { id: 'errores', titulo: 'Errores frecuentes' },
    { id: 'supuestos', titulo: 'Supuestos y límites' },
];
</script>

<template>
    <EncabezadoCalculadora clave="contado-vs-cuotas" />

    <div class="grid items-start gap-6 lg:grid-cols-2">
        <form
            class="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
            @submit.prevent="ejecutar"
        >
            <div class="grid gap-5 sm:grid-cols-2">
                <CampoNumero
                    id="contado"
                    v-model="datos.contado"
                    etiqueta="Precio de contado"
                    prefijo="$"
                    placeholder="Por ejemplo: 1.200.000"
                />
                <CampoNumero
                    id="anticipo"
                    v-model="datos.anticipo"
                    etiqueta="Anticipo (opcional)"
                    prefijo="$"
                    placeholder="0"
                />
            </div>
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
            <SelectorOpciones
                v-model="datos.frecuencia"
                nombre="frecuencia"
                etiqueta="Las cuotas son"
                :opciones="FRECUENCIAS"
            />
            <div class="grid gap-5 sm:grid-cols-2">
                <CampoNumero
                    id="primera"
                    v-model="datos.primeraDias"
                    etiqueta="Primera cuota a los"
                    sufijo="días"
                    entero
                    :formatear="false"
                    ayuda="0 si se paga en el momento."
                />
                <CampoNumero
                    id="costos"
                    v-model="datos.costos"
                    etiqueta="Costos del plan (opcional)"
                    prefijo="$"
                    placeholder="0"
                    ayuda="Seguros, gastos, envío: lo que pagás aparte."
                />
            </div>
            <div class="grid gap-3">
                <CampoNumero
                    id="tasa"
                    v-model="datos.tasa"
                    etiqueta="Cuánto rinde tu plata por año"
                    sufijo="%"
                    placeholder="Por ejemplo: 30"
                    ayuda="Lo que ganarías si no la gastás hoy: un plazo fijo, una cuenta remunerada."
                />
                <SelectorOpciones
                    v-model="datos.tipoTasa"
                    nombre="tipo-tasa"
                    etiqueta="Esa tasa es"
                    :opciones="[
                        { valor: 'tna', titulo: 'TNA' },
                        { valor: 'tea', titulo: 'TEA' },
                    ]"
                />
            </div>
            <CampoNumero
                id="inflacion"
                v-model="datos.inflacion"
                etiqueta="Inflación mensual esperada (opcional)"
                sufijo="%"
                placeholder="Por ejemplo: 2"
                ayuda="Para ver cuánto pagás en pesos de hoy."
            />
            <Button type="submit" size="lg" class="h-11 text-base"
                >Comparar</Button
            >
        </form>

        <TarjetaResultado
            :etiqueta="etiqueta"
            :valor="
                resultado ? formatearPesos(resultado.diferencia.abs()) : null
            "
            :error="error"
            :desactualizado="desactualizado"
        >
            <template v-if="resultado">
                <FilaDato
                    etiqueta="Precio de contado"
                    :valor="formatearPesos(resultado.contado)"
                />
                <FilaDato
                    etiqueta="En cuotas pagás en total"
                    :valor="formatearPesos(resultado.totalNominal)"
                />
                <FilaDato
                    etiqueta="Eso, en plata de hoy"
                    ayuda="Descontado a lo que rinde tu plata"
                    :valor="formatearPesos(resultado.valorPresente)"
                />
                <FilaDato
                    etiqueta="TEA del plan en cuotas"
                    :valor="formatearPorcentaje(resultado.teaImplicita)"
                />
                <FilaDato
                    etiqueta="TEA de tu plata"
                    :valor="formatearPorcentaje(resultado.teaOportunidad)"
                />
                <FilaDato
                    v-if="resultado.costoReal"
                    etiqueta="Lo que pagás, en pesos de hoy"
                    ayuda="Descontado por la inflación esperada"
                    :valor="formatearPesos(resultado.costoReal)"
                />
            </template>
            <template #extra>
                <p v-if="resultado" class="mt-3 text-sm text-muted-foreground">
                    {{
                        resultado.conviene === 'cuotas'
                            ? 'El plan cobra menos interés del que te rinde la plata: te conviene pagar en cuotas e invertir el resto.'
                            : resultado.conviene === 'contado'
                              ? 'El plan cobra más interés del que te rinde la plata: pagar de contado te sale más barato.'
                              : 'El plan cobra lo mismo que te rinde la plata.'
                    }}
                    <Link
                        href="/finanzas/interes-en-cuotas"
                        class="text-primary underline underline-offset-2"
                        >Ver la tasa del plan</Link
                    >
                </p>
            </template>
        </TarjetaResultado>
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #que>
            <p>
                Un peso hoy vale más que un peso dentro de un año, porque lo
                podés invertir. Por eso se compara el contado con lo que valen
                hoy las cuotas, descontadas a lo que rinde tu plata, y no con la
                suma de las cuotas.
            </p>
            <p>
                Si ese valor es menor que el contado, conviene en cuotas: pagás
                de a poco y la plata que no gastaste rinde más de lo que te
                cobran. Es lo mismo que comparar la TEA del plan con la de tu
                plata.
            </p>
        </template>
        <template #formula>
            <ul class="numeros">
                <li>
                    Valor hoy = anticipo + costos + Σ cuota / (1 + i)^(días /
                    30), con i = lo que rinde tu plata por mes
                </li>
                <li>
                    Tasa del plan: la que hace que las cuotas valgan lo mismo
                    que el contado menos el anticipo y los costos
                </li>
                <li>
                    En pesos de hoy: lo mismo, descontando con la inflación
                    mensual
                </li>
            </ul>
        </template>
        <template #ejemplo>
            <p>
                {{ formatearPesos(1200000) }} de contado, o
                {{ formatearPesos(200000) }} de anticipo y 12 cuotas mensuales
                de {{ formatearPesos(110000) }}. Si tu plata rinde 45 % TNA, las
                cuotas valen hoy {{ formatearPesos(1247496.33) }}: conviene el
                contado por {{ formatearPesos(47496.33) }}. El plan cobra 70,6 %
                de TEA y tu plata rinde 55,5 %.
            </p>
        </template>
        <template #errores>
            <ul>
                <li>
                    Elegir cuotas porque el total se parece al contado: lo que
                    importa es cuándo pagás.
                </li>
                <li>Poner una TEA como si fuera TNA, o al revés.</li>
                <li>
                    Olvidarse del anticipo, el envío o una primera cuota en el
                    momento.
                </li>
            </ul>
        </template>
        <template #supuestos>
            <ul>
                <li>
                    Cuotas iguales, con la frecuencia elegida, en meses de 30
                    días.
                </li>
                <li>
                    Tu tasa y la inflación se suponen parejas durante todo el
                    plan.
                </li>
                <li>
                    No incluye reintegros, descuentos con tarjeta ni impuestos
                    que no cargues como costos.
                </li>
            </ul>
        </template>
    </SeccionExplicacion>
</template>
