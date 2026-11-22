<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { ref } from 'vue';
import CampoFecha from '@/components/calcular/CampoFecha.vue';
import Casilla from '@/components/calcular/Casilla.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import TarjetaResultado from '@/components/calcular/TarjetaResultado.vue';
import { Button } from '@/components/ui/button';
import { useCalculo } from '@/composables/useCalculo';
import { useReusar } from '@/composables/useReusar';
import {
    diasEntre,
    formatoCorto,
    formatoLargo,
    hoyISO,
    textoAniosMesesDias,
} from '@/lib/calc/fechas';
import { formatearNumero } from '@/lib/calc/numero';

const datos = ref({ desde: hoyISO(), hasta: '', incluirUltimo: false });

function plural(n: number, uno: string, varios: string): string {
    return `${formatearNumero(n)} ${n === 1 ? uno : varios}`;
}

const { resultado, error, desactualizado, ejecutar } = useCalculo(
    datos,
    (d) => {
        if (!d.desde || !d.hasta) {
            throw new Error('Elegí las dos fechas.');
        }

        return diasEntre(d.desde, d.hasta, d.incluirUltimo);
    },
    (d, r) => ({
        tipo: 'dias-entre-fechas',
        titulo: `${formatoCorto(r.desde)} → ${formatoCorto(r.hasta)}${d.incluirUltimo ? ' (incluye el último día)' : ''}`,
        resultado: plural(r.dias, 'día', 'días'),
        entrada: { ...d },
    }),
);

useReusar('dias-entre-fechas', (entrada) => {
    datos.value = {
        desde: String(entrada.desde ?? hoyISO()),
        hasta: String(entrada.hasta ?? ''),
        incluirUltimo: entrada.incluirUltimo === true,
    };
    ejecutar();
});

const apartados = [
    { id: 'que', titulo: 'Cómo cuenta' },
    { id: 'ejemplo', titulo: 'Ejemplo' },
];
</script>

<template>
    <EncabezadoCalculadora clave="dias-entre-fechas" />

    <div class="grid items-start gap-6 lg:grid-cols-2">
        <form
            class="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
            @submit.prevent="ejecutar"
        >
            <div class="grid gap-5 sm:grid-cols-2">
                <CampoFecha id="desde" v-model="datos.desde" etiqueta="Desde" />
                <CampoFecha id="hasta" v-model="datos.hasta" etiqueta="Hasta" />
            </div>
            <Casilla
                id="incluir"
                v-model="datos.incluirUltimo"
                etiqueta="Contar también el último día"
                ayuda="Por ejemplo, para saber cuántos días dura un viaje o una licencia."
            />
            <Button type="submit" size="lg" class="h-11 text-base"
                >Calcular</Button
            >
        </form>

        <TarjetaResultado
            etiqueta="Entre las dos fechas hay"
            :valor="resultado ? plural(resultado.dias, 'día', 'días') : null"
            :error="error"
            :desactualizado="desactualizado"
        >
            <template v-if="resultado">
                <FilaDato
                    etiqueta="En semanas"
                    :valor="
                        plural(resultado.semanas, 'semana', 'semanas') +
                        (resultado.diasSueltos
                            ? ` y ${plural(resultado.diasSueltos, 'día', 'días')}`
                            : '')
                    "
                />
                <FilaDato
                    etiqueta="En años, meses y días"
                    :valor="textoAniosMesesDias(resultado.periodo)"
                />
                <FilaDato
                    etiqueta="Desde"
                    :valor="formatoLargo(resultado.desde)"
                />
                <FilaDato
                    etiqueta="Hasta"
                    :valor="formatoLargo(resultado.hasta)"
                />
            </template>
            <template #extra>
                <p
                    v-if="resultado?.invertidas"
                    class="mt-2 rounded-lg bg-celeste-suave px-3 py-2 text-sm"
                >
                    La fecha final era anterior a la inicial: las dimos vuelta.
                </p>
                <p v-if="resultado" class="mt-3 text-sm text-muted-foreground">
                    ¿Necesitás solo días hábiles?
                    <Link
                        href="/fechas/dias-habiles"
                        class="font-medium text-primary underline"
                        >Contalos con los feriados</Link
                    >.
                </p>
            </template>
        </TarjetaResultado>
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #que>
            <p>
                Cuenta días corridos de calendario, con años bisiestos. Por
                defecto no incluye el último día (del lunes al martes hay 1
                día); marcá la casilla si lo querés contar.
            </p>
            <p>
                Los años, meses y días son de calendario real: no usa meses de
                30 días.
            </p>
        </template>
        <template #ejemplo>
            <p>
                Del 1/1/2026 al 1/3/2026 hay 59 días: 8 semanas y 3 días, o
                exactamente 2 meses.
            </p>
        </template>
    </SeccionExplicacion>
</template>
