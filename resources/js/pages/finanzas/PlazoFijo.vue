<script setup lang="ts">
import { computed, ref } from 'vue';
import CampoFecha from '@/components/calcular/CampoFecha.vue';
import CampoNumero from '@/components/calcular/CampoNumero.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import TarjetaResultado from '@/components/calcular/TarjetaResultado.vue';
import { Button } from '@/components/ui/button';
import { useCalculo } from '@/composables/useCalculo';
import { useReusar } from '@/composables/useReusar';
import { aFecha, formatoLargo, hoyISO, sumarRestar } from '@/lib/calc/fechas';
import {
    formatearNumero,
    formatearPesos,
    formatearPorcentaje,
} from '@/lib/calc/numero';
import { calcularPlazoFijo, renovaciones } from '@/lib/calc/plazoFijo';
import { enteroRequerido, numeroRequerido } from '@/lib/calc/validar';

const datos = ref({
    capital: '',
    tna: '',
    dias: '30',
    inicio: hoyISO(),
});

const { resultado, error, desactualizado, ejecutar } = useCalculo(
    datos,
    (d) => {
        const capital = numeroRequerido(d.capital, 'el capital');
        const tna = numeroRequerido(d.tna, 'la TNA').div(100);
        const dias = enteroRequerido(d.dias, 'el plazo', { min: 1, max: 3650 });
        const r = calcularPlazoFijo(capital, tna, dias);
        const vencimiento = d.inicio
            ? sumarRestar(d.inicio, dias, 'dias').fecha
            : null;
        const veces = dias <= 180 ? Math.floor(365 / dias) : 0;

        return {
            ...r,
            capital,
            tna,
            dias,
            vencimiento,
            renovaciones:
                veces > 1 ? renovaciones(capital, tna, dias, veces) : [],
        };
    },
    (d, r) => ({
        tipo: 'plazo-fijo',
        titulo: `${formatearPesos(r.capital)} al ${formatearPorcentaje(r.tna)} TNA · ${r.dias} días`,
        resultado: formatearPesos(r.montoFinal),
        entrada: { ...d },
    }),
);

useReusar('plazo-fijo', (entrada) => {
    datos.value = {
        capital: String(entrada.capital ?? ''),
        tna: String(entrada.tna ?? ''),
        dias: String(entrada.dias ?? '30'),
        inicio: hoyISO(),
    };
    ejecutar();
});

const avisoVencimiento = computed(() => {
    const v = resultado.value?.vencimiento;

    if (!v) {
        return null;
    }

    const dia = aFecha(v).getDay();

    return dia === 0 || dia === 6
        ? 'Vence en fin de semana: el banco lo acredita el siguiente día hábil.'
        : null;
});

const apartados = [
    { id: 'que', titulo: 'Qué calcula' },
    { id: 'formula', titulo: 'Fórmula' },
    { id: 'ejemplo', titulo: 'Ejemplo' },
    { id: 'supuestos', titulo: 'Supuestos y límites' },
];
</script>

<template>
    <EncabezadoCalculadora clave="plazo-fijo" />

    <div class="grid items-start gap-6 lg:grid-cols-2">
        <form
            class="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
            @submit.prevent="ejecutar"
        >
            <CampoNumero
                id="capital"
                v-model="datos.capital"
                etiqueta="Capital a invertir"
                prefijo="$"
                placeholder="Por ejemplo: 1.000.000"
            />
            <CampoNumero
                id="tna"
                v-model="datos.tna"
                etiqueta="TNA que ofrece el banco"
                sufijo="%"
                placeholder="Por ejemplo: 32"
            />
            <div class="grid gap-5 sm:grid-cols-2">
                <CampoNumero
                    id="dias"
                    v-model="datos.dias"
                    etiqueta="Plazo"
                    sufijo="días"
                    entero
                    :formatear="false"
                    ayuda="El mínimo suele ser 30 días."
                />
                <CampoFecha
                    id="inicio"
                    v-model="datos.inicio"
                    etiqueta="Fecha de constitución"
                />
            </div>
            <Button type="submit" size="lg" class="h-11 text-base"
                >Calcular</Button
            >
        </form>

        <TarjetaResultado
            etiqueta="Cobrás al vencimiento"
            :valor="resultado ? formatearPesos(resultado.montoFinal) : null"
            :error="error"
            :desactualizado="desactualizado"
        >
            <template v-if="resultado">
                <FilaDato
                    etiqueta="Intereses ganados"
                    :valor="formatearPesos(resultado.interes)"
                />
                <FilaDato
                    :etiqueta="`Rendimiento en ${resultado.dias} días`"
                    :valor="formatearPorcentaje(resultado.tasaPeriodo, 4)"
                />
                <FilaDato
                    etiqueta="TEA si lo renovás siempre"
                    ayuda="Capital más intereses, al mismo plazo y tasa"
                    :valor="formatearPorcentaje(resultado.teaRenovando)"
                />
                <FilaDato
                    v-if="resultado.vencimiento"
                    etiqueta="Vence el"
                    :valor="formatoLargo(resultado.vencimiento)"
                />
            </template>
            <template #extra>
                <p
                    v-if="avisoVencimiento"
                    class="mt-2 rounded-lg bg-celeste-suave px-3 py-2 text-sm"
                >
                    {{ avisoVencimiento }}
                </p>
                <details
                    v-if="resultado && resultado.renovaciones.length"
                    class="mt-4 rounded-xl border border-border"
                >
                    <summary
                        class="cursor-pointer px-4 py-3 text-sm font-medium"
                    >
                        Si lo renovás durante un año ({{
                            resultado.renovaciones.length
                        }}
                        veces)
                    </summary>
                    <div class="overflow-x-auto px-2 pb-2">
                        <table class="numeros w-full text-sm">
                            <thead>
                                <tr class="text-left text-muted-foreground">
                                    <th class="px-2 py-1.5 font-medium">#</th>
                                    <th
                                        class="px-2 py-1.5 text-right font-medium"
                                    >
                                        Intereses
                                    </th>
                                    <th
                                        class="px-2 py-1.5 text-right font-medium"
                                    >
                                        Monto final
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="f in resultado.renovaciones"
                                    :key="f.numero"
                                    class="border-t border-border"
                                >
                                    <td class="px-2 py-1.5">
                                        {{ f.numero }}
                                    </td>
                                    <td class="px-2 py-1.5 text-right">
                                        {{ formatearPesos(f.interes) }}
                                    </td>
                                    <td class="px-2 py-1.5 text-right">
                                        {{ formatearPesos(f.montoFinal) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </details>
            </template>
        </TarjetaResultado>
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #que>
            <p>
                Cuánto cobrás al final de un plazo fijo tradicional en pesos:
                los intereses, el monto total y la fecha de vencimiento. También
                muestra qué rendimiento anual tendrías si lo renovás siempre con
                capital e intereses.
            </p>
        </template>
        <template #formula>
            <ul class="numeros">
                <li>Intereses = capital × TNA × días / 365</li>
                <li>Monto final = capital + intereses</li>
                <li>TEA renovando = (1 + TNA × días / 365)^(365 / días) − 1</li>
            </ul>
        </template>
        <template #ejemplo>
            <p>
                {{ formatearPesos(1000000) }} al 36,5 % TNA por 30 días:
                1.000.000 × 0,365 × 30 / 365 = {{ formatearPesos(30000) }} de
                intereses. Cobrás {{ formatearPesos(1030000) }}.
            </p>
        </template>
        <template #supuestos>
            <ul>
                <li>
                    Interés simple sobre base de 365 días, como calculan los
                    bancos en Argentina.
                </li>
                <li>
                    La TNA es la del día en que lo constituís: si renovás, la
                    tasa puede ser otra.
                </li>
                <li>
                    No descuenta impuestos (por ejemplo, Ganancias) ni considera
                    plazos fijos UVA.
                </li>
                <li>
                    Un plazo de {{ formatearNumero(365) }} días no es lo mismo
                    que 12 renovaciones de 30: renovar suma interés compuesto.
                </li>
            </ul>
        </template>
    </SeccionExplicacion>
</template>
