<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { TrendingDown, TrendingUp } from '@lucide/vue';
import { computed, ref } from 'vue';
import CampoNumero from '@/components/calcular/CampoNumero.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import SelectorOpciones from '@/components/calcular/SelectorOpciones.vue';
import TarjetaResultado from '@/components/calcular/TarjetaResultado.vue';
import { Button } from '@/components/ui/button';
import { useCalculo } from '@/composables/useCalculo';
import { useIndice } from '@/composables/useIndice';
import { useReusar } from '@/composables/useReusar';
import { filasMensuales, nombreMes } from '@/lib/calc/inflacion';
import { formatearPesos, formatearPorcentaje } from '@/lib/calc/numero';
import type { TipoTasa } from '@/lib/calc/rendimiento';
import { contraInflacion, rendimientoCuenta } from '@/lib/calc/rendimiento';
import { numeroOpcional, numeroRequerido } from '@/lib/calc/validar';

const datos = ref({
    saldo: '',
    tasa: '',
    tipo: 'tna' as TipoTasa,
    tope: '',
});

const { resultado, error, desactualizado, ejecutar } = useCalculo(
    datos,
    (d) => {
        const saldo = numeroRequerido(d.saldo, 'el saldo');
        const tasa = numeroRequerido(d.tasa, 'la tasa').div(100);
        const tope = numeroOpcional(d.tope, 'el tope');

        return { ...rendimientoCuenta(saldo, tasa, d.tipo, tope), saldo, tasa };
    },
    (d, r) => ({
        tipo: 'rendimiento-cuenta',
        titulo: `${formatearPesos(r.saldo)} al ${formatearPorcentaje(r.tasa)} ${d.tipo.toUpperCase()}`,
        resultado: `${formatearPesos(r.porDia)} por día`,
        entrada: { ...d },
    }),
);

useReusar('rendimiento-cuenta', (entrada) => {
    datos.value = {
        saldo: String(entrada.saldo ?? ''),
        tasa: String(entrada.tasa ?? ''),
        tipo: entrada.tipo === 'tea' ? 'tea' : 'tna',
        tope: String(entrada.tope ?? ''),
    };
    ejecutar();
});

// La inflación del último mes publicado, para comparar.
const { datos: ipc } = useIndice('ipc');
const ultimaInflacion = computed(() => {
    const filas = ipc.value ? filasMensuales(ipc.value.puntos) : [];
    const ultima = filas.at(-1);

    return ultima?.mensual ? { mes: ultima.mes, valor: ultima.mensual } : null;
});

const comparacion = computed(() =>
    resultado.value && ultimaInflacion.value
        ? contraInflacion(
              resultado.value.saldo,
              resultado.value.mensual,
              ultimaInflacion.value.valor,
          )
        : null,
);

const apartados = [
    { id: 'que', titulo: 'Qué calcula' },
    { id: 'formula', titulo: 'Fórmulas' },
    { id: 'ejemplo', titulo: 'Ejemplo' },
    { id: 'supuestos', titulo: 'Para tener en cuenta' },
];
</script>

<template>
    <EncabezadoCalculadora clave="rendimiento-cuenta" />

    <div class="grid items-start gap-6 lg:grid-cols-2">
        <form
            class="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
            @submit.prevent="ejecutar"
        >
            <CampoNumero
                id="saldo"
                v-model="datos.saldo"
                etiqueta="Saldo en la cuenta"
                prefijo="$"
                placeholder="Por ejemplo: 1.000.000"
            />
            <div class="grid gap-3">
                <CampoNumero
                    id="tasa"
                    v-model="datos.tasa"
                    etiqueta="Rendimiento que informa la cuenta"
                    sufijo="%"
                    placeholder="Por ejemplo: 18,8"
                />
                <SelectorOpciones
                    v-model="datos.tipo"
                    nombre="tipo"
                    etiqueta="Esa tasa es"
                    :opciones="[
                        { valor: 'tna', titulo: 'TNA' },
                        { valor: 'tea', titulo: 'TEA' },
                    ]"
                />
                <p class="text-sm text-muted-foreground">
                    Las billeteras y los bancos suelen informar la TNA. Si no
                    dice, buscá la sigla al lado del porcentaje.
                </p>
            </div>
            <CampoNumero
                id="tope"
                v-model="datos.tope"
                etiqueta="Tope de saldo que rinde (opcional)"
                prefijo="$"
                placeholder="Sin tope"
                ayuda="Si la cuenta paga solo hasta cierto monto."
            />
            <Button type="submit" size="lg" class="h-11 text-base"
                >Calcular</Button
            >
        </form>

        <TarjetaResultado
            etiqueta="Te rinde por día"
            :valor="resultado ? formatearPesos(resultado.porDia) : null"
            :error="error"
            :desactualizado="desactualizado"
        >
            <template v-if="resultado">
                <FilaDato
                    etiqueta="Por semana"
                    :valor="formatearPesos(resultado.porSemana)"
                />
                <FilaDato
                    etiqueta="Por mes (30 días)"
                    :valor="formatearPesos(resultado.porMes)"
                />
                <FilaDato
                    etiqueta="Por año, sin tocarla"
                    :valor="formatearPesos(resultado.porAnio)"
                />
                <FilaDato
                    v-if="datos.tipo === 'tna'"
                    etiqueta="TEA"
                    ayuda="Lo que rinde de verdad en un año, con la reinversión diaria"
                    :valor="formatearPorcentaje(resultado.tea)"
                />
                <FilaDato
                    v-else
                    etiqueta="TNA equivalente"
                    :valor="formatearPorcentaje(resultado.tna)"
                />
                <FilaDato
                    v-if="resultado.noRinde.gt(0)"
                    etiqueta="Saldo que no rinde (pasa el tope)"
                    :valor="formatearPesos(resultado.noRinde)"
                />
            </template>
            <template #extra>
                <div
                    v-if="resultado && comparacion && ultimaInflacion"
                    class="mt-4 rounded-xl border border-border p-4 text-sm"
                    data-test="contra-inflacion"
                >
                    <p class="flex items-center gap-2 font-medium">
                        <component
                            :is="comparacion.leGana ? TrendingUp : TrendingDown"
                            class="size-4 shrink-0"
                            :class="
                                comparacion.leGana
                                    ? 'text-primary'
                                    : 'text-destructive'
                            "
                            aria-hidden="true"
                        />
                        {{
                            comparacion.leGana
                                ? 'Le gana a la inflación'
                                : 'Pierde contra la inflación'
                        }}
                    </p>
                    <p class="mt-1 text-muted-foreground">
                        En 30 días rinde
                        {{ formatearPorcentaje(resultado.mensual) }}; la
                        inflación de {{ nombreMes(ultimaInflacion.mes) }} fue de
                        {{ formatearPorcentaje(ultimaInflacion.valor, 1) }}
                        (INDEC). Con ese ritmo, en un mes
                        {{ comparacion.leGana ? 'ganás' : 'perdés' }}
                        <span class="numeros font-medium text-foreground">{{
                            formatearPesos(comparacion.enPesos.abs())
                        }}</span>
                        de poder de compra.
                    </p>
                    <Link
                        href="/inflacion/serie-mensual"
                        class="mt-2 inline-block text-primary underline underline-offset-2"
                        >Ver la inflación mes a mes</Link
                    >
                </div>
            </template>
        </TarjetaResultado>
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #que>
            <p>
                Cuánto te rinde la plata que tenés en una cuenta remunerada o
                una billetera virtual (Mercado Pago, Ualá, Naranja X, cuentas de
                bancos): por día, por semana, por mes y por año. Los intereses
                se acreditan todos los días y al día siguiente rinden también.
            </p>
        </template>
        <template #formula>
            <ul class="numeros">
                <li>Tasa diaria = TNA / 365 (o (1 + TEA)^(1/365) − 1)</li>
                <li>Por día = saldo × tasa diaria</li>
                <li>En n días = saldo × ((1 + tasa diaria)ⁿ − 1)</li>
                <li>TEA = (1 + TNA / 365)³⁶⁵ − 1</li>
            </ul>
        </template>
        <template #ejemplo>
            <p>
                {{ formatearPesos(1000000) }} al 18,8 % TNA: 1.000.000 × 0,188 /
                365 = {{ formatearPesos(515.07) }} por día. En 30 días, con la
                reinversión, unos {{ formatearPesos(15568) }}. La TEA es 20,68
                %.
            </p>
            <p>
                Si ese 18,8 % fuera TEA, serían
                {{ formatearPesos(472.09) }} por día: por eso importa saber cuál
                es.
            </p>
        </template>
        <template #supuestos>
            <ul>
                <li>
                    Las cuentas cambian la tasa seguido: el cálculo vale para la
                    tasa de hoy.
                </li>
                <li>
                    Supone que no sacás ni ponés plata y que la acreditación es
                    diaria, todos los días (también fines de semana).
                </li>
                <li>
                    La comparación con la inflación usa el último mes que
                    publicó el INDEC: la de los próximos meses puede ser otra.
                </li>
            </ul>
        </template>
    </SeccionExplicacion>
</template>
