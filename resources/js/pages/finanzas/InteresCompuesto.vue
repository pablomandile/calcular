<script setup lang="ts">
import { computed, ref } from 'vue';
import CampoNumero from '@/components/calcular/CampoNumero.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import GraficoCrecimiento from '@/components/calcular/GraficoCrecimiento.vue';
import SelectorOpciones from '@/components/calcular/SelectorOpciones.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import TarjetaResultado from '@/components/calcular/TarjetaResultado.vue';
import { Button } from '@/components/ui/button';
import { useCalculo } from '@/composables/useCalculo';
import { useReusar } from '@/composables/useReusar';
import {
    calcularInteresCompuesto,
    MAX_ANIOS,
} from '@/lib/calc/interesCompuesto';
import { D, formatearPesos, formatearPorcentaje } from '@/lib/calc/numero';
import { CAPITALIZACIONES, teaDesdeTna } from '@/lib/calc/tasas';
import {
    enteroRequerido,
    numeroOpcional,
    numeroRequerido,
} from '@/lib/calc/validar';

const datos = ref({
    capital: '',
    tna: '',
    n: 12,
    anios: '5',
    aporte: '',
});

const nombreAporte = computed(() => {
    const periodo =
        CAPITALIZACIONES.find((c) => c.n === datos.value.n)?.periodo ?? '';

    return `Aporte ${periodo} (opcional)`;
});

const { resultado, error, desactualizado, ejecutar } = useCalculo(
    datos,
    (d) => {
        const capital = numeroRequerido(d.capital, 'el capital inicial');
        const tna = numeroRequerido(d.tna, 'la TNA').div(100);
        const anios = enteroRequerido(d.anios, 'el plazo', {
            min: 1,
            max: MAX_ANIOS,
        });
        const aporte = numeroOpcional(d.aporte, 'el aporte') ?? new D(0);
        const r = calcularInteresCompuesto({
            capital,
            tna,
            n: d.n,
            anios,
            aporte,
        });

        return {
            ...r,
            capital,
            tna,
            anios,
            aporte,
            tea: teaDesdeTna(tna, d.n),
        };
    },
    (d, r) => ({
        tipo: 'interes-compuesto',
        titulo:
            `${formatearPesos(r.capital)} al ${formatearPorcentaje(r.tna)} TNA · ${r.anios} ${r.anios === 1 ? 'año' : 'años'}` +
            (r.aporte.isZero()
                ? ''
                : ` · aportes de ${formatearPesos(r.aporte)}`),
        resultado: formatearPesos(r.montoFinal),
        entrada: { ...d },
    }),
);

useReusar('interes-compuesto', (entrada) => {
    datos.value = {
        capital: String(entrada.capital ?? ''),
        tna: String(entrada.tna ?? ''),
        n: Number(entrada.n) || 12,
        anios: String(entrada.anios ?? '5'),
        aporte: String(entrada.aporte ?? ''),
    };
    ejecutar();
});

const filasGrafico = computed(
    () =>
        resultado.value?.porAnio.map((f) => ({
            anio: f.anio,
            aportes: f.aportesAcumulados.toNumber(),
            intereses: Math.max(f.interesesAcumulados.toNumber(), 0),
        })) ?? [],
);

const apartados = [
    { id: 'que', titulo: 'Qué calcula' },
    { id: 'formula', titulo: 'Fórmula' },
    { id: 'supuestos', titulo: 'Supuestos y límites' },
];
</script>

<template>
    <EncabezadoCalculadora clave="interes-compuesto" />

    <div class="grid items-start gap-6 lg:grid-cols-2">
        <form
            class="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
            @submit.prevent="ejecutar"
        >
            <CampoNumero
                id="capital"
                v-model="datos.capital"
                etiqueta="Capital inicial"
                prefijo="$"
                placeholder="Por ejemplo: 500.000"
            />
            <div class="grid gap-5 sm:grid-cols-2">
                <CampoNumero
                    id="tna"
                    v-model="datos.tna"
                    etiqueta="TNA"
                    sufijo="%"
                    placeholder="Por ejemplo: 30"
                />
                <CampoNumero
                    id="anios"
                    v-model="datos.anios"
                    etiqueta="Plazo"
                    sufijo="años"
                    entero
                    :formatear="false"
                />
            </div>
            <SelectorOpciones
                v-model="datos.n"
                nombre="capitalizacion"
                etiqueta="Capitalización"
                :opciones="
                    CAPITALIZACIONES.map((c) => ({
                        valor: c.n,
                        titulo: c.nombre,
                    }))
                "
            />
            <CampoNumero
                id="aporte"
                v-model="datos.aporte"
                :etiqueta="nombreAporte"
                prefijo="$"
                placeholder="0"
                ayuda="Se suma al final de cada período, junto con los intereses."
            />
            <Button type="submit" size="lg" class="h-11 text-base"
                >Calcular</Button
            >
        </form>

        <TarjetaResultado
            :etiqueta="`Saldo al cabo de ${resultado?.anios ?? ''} ${resultado?.anios === 1 ? 'año' : 'años'}`"
            :valor="resultado ? formatearPesos(resultado.montoFinal) : null"
            :error="error"
            :desactualizado="desactualizado"
        >
            <template v-if="resultado">
                <FilaDato
                    etiqueta="Total aportado"
                    ayuda="Capital inicial más aportes"
                    :valor="formatearPesos(resultado.totalAportado)"
                />
                <FilaDato
                    etiqueta="Intereses ganados"
                    :valor="formatearPesos(resultado.interesesGanados)"
                />
                <FilaDato
                    etiqueta="TEA equivalente"
                    :valor="formatearPorcentaje(resultado.tea)"
                />
            </template>
            <template #extra>
                <template v-if="resultado">
                    <GraficoCrecimiento :filas="filasGrafico" />
                    <details class="mt-4 rounded-xl border border-border">
                        <summary
                            class="cursor-pointer px-4 py-3 text-sm font-medium"
                        >
                            Ver la tabla año por año
                        </summary>
                        <div class="overflow-x-auto px-2 pb-2">
                            <table class="numeros w-full text-sm">
                                <thead>
                                    <tr class="text-muted-foreground">
                                        <th
                                            class="px-2 py-1.5 text-left font-medium"
                                        >
                                            Año
                                        </th>
                                        <th
                                            class="px-2 py-1.5 text-right font-medium"
                                        >
                                            Aportado
                                        </th>
                                        <th
                                            class="px-2 py-1.5 text-right font-medium"
                                        >
                                            Intereses
                                        </th>
                                        <th
                                            class="px-2 py-1.5 text-right font-medium"
                                        >
                                            Saldo
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="f in resultado.porAnio"
                                        :key="f.anio"
                                        class="border-t border-border"
                                    >
                                        <td class="px-2 py-1.5">
                                            {{ f.anio }}
                                        </td>
                                        <td class="px-2 py-1.5 text-right">
                                            {{
                                                formatearPesos(
                                                    f.aportesAcumulados,
                                                )
                                            }}
                                        </td>
                                        <td class="px-2 py-1.5 text-right">
                                            {{
                                                formatearPesos(
                                                    f.interesesAcumulados,
                                                )
                                            }}
                                        </td>
                                        <td
                                            class="px-2 py-1.5 text-right font-semibold"
                                        >
                                            {{ formatearPesos(f.saldo) }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </details>
                </template>
            </template>
        </TarjetaResultado>
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #que>
            <p>
                Cómo crece un capital cuando los intereses se reinvierten y,
                opcionalmente, sumás un aporte fijo en cada período. Separa lo
                que pusiste de lo que ganaste.
            </p>
        </template>
        <template #formula>
            <p>
                Con i = TNA / n (tasa de cada período), N = n × años y A el
                aporte de cada período:
            </p>
            <ul class="numeros">
                <li>Saldo = C × (1 + i)ᴺ + A × ((1 + i)ᴺ − 1) / i</li>
            </ul>
        </template>
        <template #supuestos>
            <ul>
                <li>La tasa no cambia durante todo el plazo.</li>
                <li>
                    Los aportes se hacen al final de cada período, con la misma
                    frecuencia que la capitalización.
                </li>
                <li>
                    No descuenta inflación: con inflación alta, un saldo grande
                    en pesos puede valer menos que hoy.
                </li>
            </ul>
        </template>
    </SeccionExplicacion>
</template>
