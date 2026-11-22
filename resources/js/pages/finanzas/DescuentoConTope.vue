<script setup lang="ts">
import { computed, ref } from 'vue';
import CampoNumero from '@/components/calcular/CampoNumero.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import TarjetaResultado from '@/components/calcular/TarjetaResultado.vue';
import { Button } from '@/components/ui/button';
import { useCalculo } from '@/composables/useCalculo';
import { useReusar } from '@/composables/useReusar';
import { descuentoConTope, reintegroDe } from '@/lib/calc/descuentos';
import { formatearPesos, formatearPorcentaje } from '@/lib/calc/numero';
import { numeroOpcional, numeroRequerido } from '@/lib/calc/validar';

const datos = ref({ porcentaje: '', tope: '', monto: '' });

const { resultado, error, desactualizado, ejecutar } = useCalculo(
    datos,
    (d) => {
        const porcentaje = numeroRequerido(d.porcentaje, 'el porcentaje').div(
            100,
        );
        const tope = numeroRequerido(d.tope, 'el tope');
        const monto = numeroOpcional(d.monto, 'lo que vas a gastar');

        return {
            ...descuentoConTope(porcentaje, tope, monto),
            porcentaje,
            tope,
        };
    },
    (d, r) => ({
        tipo: 'descuento-con-tope',
        titulo: `${formatearPorcentaje(r.porcentaje, 0)} con tope de ${formatearPesos(r.tope)}${r.compra ? ` · compra de ${formatearPesos(r.compra.monto)}` : ''}`,
        resultado: r.compra
            ? `Pagás ${formatearPesos(r.compra.pagas)}`
            : `Hasta ${formatearPesos(r.compraMaxima)}`,
        entrada: { ...d },
    }),
);

useReusar('descuento-con-tope', (entrada) => {
    datos.value = {
        porcentaje: String(entrada.porcentaje ?? ''),
        tope: String(entrada.tope ?? ''),
        monto: String(entrada.monto ?? ''),
    };
    ejecutar();
});

/** Qué descuento real queda según cuánto se gaste. */
const escenarios = computed(() => {
    const r = resultado.value;

    if (!r) {
        return [];
    }

    return [0.5, 1, 1.5, 2].map((veces) => {
        const monto = r.compraMaxima.times(veces);
        const reintegro = reintegroDe(monto, r.porcentaje, r.tope);

        return {
            veces,
            monto,
            reintegro,
            efectivo: reintegro.div(monto),
        };
    });
});

const apartados = [
    { id: 'que', titulo: 'Qué calcula' },
    { id: 'formula', titulo: 'Fórmula' },
    { id: 'ejemplo', titulo: 'Ejemplo' },
    { id: 'supuestos', titulo: 'Para tener en cuenta' },
];
</script>

<template>
    <EncabezadoCalculadora clave="descuento-con-tope" />

    <div class="grid items-start gap-6 lg:grid-cols-2">
        <form
            class="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
            @submit.prevent="ejecutar"
        >
            <div class="grid gap-5 sm:grid-cols-2">
                <CampoNumero
                    id="porcentaje"
                    v-model="datos.porcentaje"
                    etiqueta="Descuento o reintegro"
                    sufijo="%"
                    placeholder="Por ejemplo: 20"
                />
                <CampoNumero
                    id="tope"
                    v-model="datos.tope"
                    etiqueta="Tope"
                    prefijo="$"
                    placeholder="Por ejemplo: 6.000"
                />
            </div>
            <CampoNumero
                id="monto"
                v-model="datos.monto"
                etiqueta="Lo que pensás gastar (opcional)"
                prefijo="$"
                placeholder="Por ejemplo: 45.000"
                ayuda="Para ver cuánto te devuelven y cuánto pagás de verdad."
            />
            <Button type="submit" size="lg" class="h-11 text-base"
                >Calcular</Button
            >
        </form>

        <TarjetaResultado
            etiqueta="Para aprovechar el tope entero, gastá hasta"
            :valor="resultado ? formatearPesos(resultado.compraMaxima) : null"
            :error="error"
            :desactualizado="desactualizado"
        >
            <template v-if="resultado">
                <FilaDato
                    etiqueta="Te devuelven, como máximo"
                    :valor="formatearPesos(resultado.tope)"
                />
                <template v-if="resultado.compra">
                    <FilaDato
                        :etiqueta="`Con una compra de ${formatearPesos(resultado.compra.monto)}, te devuelven`"
                        :valor="formatearPesos(resultado.compra.reintegro)"
                    />
                    <FilaDato
                        etiqueta="Pagás de verdad"
                        :valor="formatearPesos(resultado.compra.pagas)"
                    />
                    <FilaDato
                        etiqueta="Descuento real"
                        :valor="
                            formatearPorcentaje(
                                resultado.compra.descuentoEfectivo,
                            )
                        "
                    />
                </template>
            </template>
            <template #extra>
                <p
                    v-if="
                        resultado?.compra && resultado.compra.sinDescuento.gt(0)
                    "
                    class="mt-2 rounded-lg bg-celeste-suave px-3 py-2 text-sm"
                    data-test="aviso-tope"
                >
                    Te pasás del tope por
                    {{ formatearPesos(resultado.compra.sinDescuento) }}: esa
                    parte la pagás sin descuento, y el descuento real baja al
                    {{
                        formatearPorcentaje(resultado.compra.descuentoEfectivo)
                    }}.
                </p>
                <p
                    v-else-if="
                        resultado?.compra && !resultado.compra.llegaAlTope
                    "
                    class="mt-2 rounded-lg bg-celeste-suave px-3 py-2 text-sm"
                >
                    Te quedan
                    {{
                        formatearPesos(
                            resultado.compraMaxima.minus(
                                resultado.compra.monto,
                            ),
                        )
                    }}
                    de compra con descuento antes de llegar al tope.
                </p>

                <div v-if="resultado" class="mt-4 overflow-x-auto">
                    <table class="numeros w-full text-sm">
                        <caption
                            class="mb-1 text-left text-sm font-medium text-foreground"
                        >
                            Según cuánto gastes
                        </caption>
                        <thead>
                            <tr class="text-left text-muted-foreground">
                                <th class="px-2 py-1.5 font-medium">Gastás</th>
                                <th class="px-2 py-1.5 text-right font-medium">
                                    Te devuelven
                                </th>
                                <th class="px-2 py-1.5 text-right font-medium">
                                    Descuento real
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="e in escenarios"
                                :key="e.veces"
                                class="border-t border-border"
                                :class="e.veces === 1 && 'font-semibold'"
                            >
                                <td class="px-2 py-1.5">
                                    {{ formatearPesos(e.monto) }}
                                </td>
                                <td class="px-2 py-1.5 text-right">
                                    {{ formatearPesos(e.reintegro) }}
                                </td>
                                <td class="px-2 py-1.5 text-right">
                                    {{ formatearPorcentaje(e.efectivo, 1) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </template>
        </TarjetaResultado>
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #que>
            <p>
                Cuánto podés gastar como máximo para aprovechar entero un
                descuento o reintegro con tope, como los de bancos, billeteras
                virtuales o Cuenta DNI. Si cargás lo que pensás gastar, también
                te dice cuánto te devuelven, cuánto pagás de verdad y qué
                descuento real te queda.
            </p>
        </template>
        <template #formula>
            <ul class="numeros">
                <li>Compra máxima = tope / porcentaje</li>
                <li>
                    Reintegro = el menor entre compra × porcentaje y el tope
                </li>
                <li>Descuento real = reintegro / compra</li>
            </ul>
        </template>
        <template #ejemplo>
            <p>
                20 % de reintegro con tope de {{ formatearPesos(6000) }}: 6.000
                / 0,20 = {{ formatearPesos(30000) }}. Hasta ahí tenés el 20 %
                entero. Si gastás {{ formatearPesos(60000) }}, te devuelven
                igual {{ formatearPesos(6000) }}: el descuento real es del 10 %.
            </p>
        </template>
        <template #supuestos>
            <ul>
                <li>
                    Fijate si el tope es por compra, por día, por semana o por
                    mes: si es por mes y ya usaste una parte, cargá como tope lo
                    que te queda.
                </li>
                <li>
                    Si el tope es por compra y te pasás, a veces conviene
                    dividirla en dos (si el comercio y la promoción lo
                    permiten).
                </li>
                <li>
                    El reintegro suele llegar días o semanas después: mientras
                    tanto, pagás el total.
                </li>
            </ul>
        </template>
    </SeccionExplicacion>
</template>
