<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { ref } from 'vue';
import CampoNumero from '@/components/calcular/CampoNumero.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import TarjetaResultado from '@/components/calcular/TarjetaResultado.vue';
import { Button } from '@/components/ui/button';
import { useCalculo } from '@/composables/useCalculo';
import { useReusar } from '@/composables/useReusar';
import { inflacionAcumulada } from '@/lib/calc/inflacion';
import { formatearPesos, formatearPorcentaje } from '@/lib/calc/numero';
import {
    enteroRequerido,
    numeroOpcional,
    numeroRequerido,
} from '@/lib/calc/validar';

const datos = ref({ tasa: '', meses: '12', monto: '' });

const { resultado, error, desactualizado, ejecutar } = useCalculo(
    datos,
    (d) => {
        const tasa = numeroRequerido(d.tasa, 'la inflación mensual').div(100);
        const meses = enteroRequerido(d.meses, 'la cantidad de meses', {
            min: 1,
            max: 1200,
        });
        const monto = numeroOpcional(d.monto, 'el monto');
        const r = inflacionAcumulada(tasa, meses);

        return {
            ...r,
            tasa,
            meses,
            monto,
            montoFinal: monto ? monto.times(r.factor) : null,
        };
    },
    (d, r) => ({
        tipo: 'inflacion-acumulada',
        titulo: `${formatearPorcentaje(r.tasa)} mensual · ${r.meses} ${r.meses === 1 ? 'mes' : 'meses'}`,
        resultado: formatearPorcentaje(r.acumulada),
        entrada: { ...d },
    }),
);

useReusar('inflacion-acumulada', (entrada) => {
    datos.value = {
        tasa: String(entrada.tasa ?? ''),
        meses: String(entrada.meses ?? '12'),
        monto: String(entrada.monto ?? ''),
    };
    ejecutar();
});

const apartados = [
    { id: 'que', titulo: 'Qué calcula' },
    { id: 'formula', titulo: 'Fórmula' },
    { id: 'ejemplo', titulo: 'Ejemplo' },
    { id: 'supuestos', titulo: 'Supuestos y límites' },
];
</script>

<template>
    <EncabezadoCalculadora clave="inflacion-acumulada" />

    <div class="grid items-start gap-6 lg:grid-cols-2">
        <form
            class="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
            @submit.prevent="ejecutar"
        >
            <div class="grid gap-5 sm:grid-cols-2">
                <CampoNumero
                    id="tasa"
                    v-model="datos.tasa"
                    etiqueta="Inflación mensual"
                    sufijo="%"
                    placeholder="Por ejemplo: 2,5"
                />
                <CampoNumero
                    id="meses"
                    v-model="datos.meses"
                    etiqueta="Cantidad de meses"
                    sufijo="meses"
                    entero
                    :formatear="false"
                />
            </div>
            <CampoNumero
                id="monto"
                v-model="datos.monto"
                etiqueta="Monto a actualizar (opcional)"
                prefijo="$"
                placeholder="Por ejemplo: 100.000"
            />
            <Button type="submit" size="lg" class="h-11 text-base"
                >Calcular</Button
            >
        </form>

        <TarjetaResultado
            etiqueta="Inflación acumulada"
            :valor="resultado ? formatearPorcentaje(resultado.acumulada) : null"
            :error="error"
            :desactualizado="desactualizado"
        >
            <template v-if="resultado">
                <FilaDato
                    v-if="resultado.montoFinal && resultado.monto"
                    :etiqueta="`${formatearPesos(resultado.monto)} pasa a valer`"
                    :valor="formatearPesos(resultado.montoFinal)"
                />
                <FilaDato
                    etiqueta="Llevada a un año"
                    ayuda="La misma inflación mensual durante 12 meses"
                    :valor="formatearPorcentaje(resultado.anualEquivalente)"
                />
                <FilaDato
                    etiqueta="Sumando los meses (incorrecto)"
                    ayuda="Lo que da multiplicar la tasa por los meses"
                    :valor="formatearPorcentaje(resultado.sumaSimple)"
                />
            </template>
            <template #extra>
                <p v-if="resultado" class="mt-3 text-sm text-muted-foreground">
                    ¿Querés la inflación real de cada mes?
                    <Link
                        href="/inflacion/ipc"
                        class="text-primary underline underline-offset-2"
                        >Actualizar por IPC</Link
                    >
                </p>
            </template>
        </TarjetaResultado>
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #que>
            <p>
                Cuánta inflación suman varios meses con la misma inflación
                mensual, y cuánto pasa a valer un monto al final. Sirve para
                escenarios: "si la inflación sigue en 2 % por mes, ¿cuánto es en
                un año?".
            </p>
        </template>
        <template #formula>
            <ul class="numeros">
                <li>Inflación acumulada = (1 + i)ⁿ − 1</li>
                <li>Monto final = monto × (1 + i)ⁿ</li>
            </ul>
            <p>
                Cada mes los precios suben sobre lo que ya subieron antes: por
                eso se multiplica y no se suma.
            </p>
        </template>
        <template #ejemplo>
            <p>
                5 % por mes durante 12 meses: 1,05¹² − 1 = 79,59 %, no 60 %. Un
                monto de {{ formatearPesos(100000) }} pasa a
                {{ formatearPesos(179585.63) }}.
            </p>
        </template>
        <template #supuestos>
            <ul>
                <li>
                    Todos los meses tienen la misma inflación. Para meses
                    reales, usá la calculadora por IPC.
                </li>
                <li>Es un escenario, no una proyección oficial.</li>
                <li>La tasa va en porcentaje: 5 es 5 % (no 0,05).</li>
            </ul>
        </template>
    </SeccionExplicacion>
</template>
