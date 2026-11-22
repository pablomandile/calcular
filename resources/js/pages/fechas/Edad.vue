<script setup lang="ts">
import { ref } from 'vue';
import CampoFecha from '@/components/calcular/CampoFecha.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import TarjetaResultado from '@/components/calcular/TarjetaResultado.vue';
import { Button } from '@/components/ui/button';
import { useCalculo } from '@/composables/useCalculo';
import { useReusar } from '@/composables/useReusar';
import {
    calcularEdad,
    formatoCorto,
    formatoLargo,
    hoyISO,
    textoAniosMesesDias,
} from '@/lib/calc/fechas';
import { formatearNumero } from '@/lib/calc/numero';

const datos = ref({ nacimiento: '', referencia: hoyISO() });

function anios(n: number): string {
    return `${formatearNumero(n)} ${n === 1 ? 'año' : 'años'}`;
}

const { resultado, error, desactualizado, ejecutar } = useCalculo(
    datos,
    (d) => {
        if (!d.nacimiento) {
            throw new Error('Elegí la fecha de nacimiento.');
        }

        if (!d.referencia) {
            throw new Error('Elegí la fecha de referencia.');
        }

        return calcularEdad(d.nacimiento, d.referencia);
    },
    (d, r) => ({
        tipo: 'edad',
        titulo: `Nacimiento ${formatoCorto(d.nacimiento)} · al ${formatoCorto(d.referencia)}`,
        resultado: textoAniosMesesDias(r.edad),
        entrada: { nacimiento: d.nacimiento },
    }),
);

useReusar('edad', (entrada) => {
    datos.value = {
        nacimiento: String(entrada.nacimiento ?? ''),
        referencia: hoyISO(),
    };
    ejecutar();
});

const apartados = [{ id: 'como', titulo: 'Cómo se calcula' }];
</script>

<template>
    <EncabezadoCalculadora clave="edad" />

    <div class="grid items-start gap-6 lg:grid-cols-2">
        <form
            class="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
            @submit.prevent="ejecutar"
        >
            <CampoFecha
                id="nacimiento"
                v-model="datos.nacimiento"
                etiqueta="Fecha de nacimiento"
                :max="datos.referencia || undefined"
            />
            <CampoFecha
                id="referencia"
                v-model="datos.referencia"
                etiqueta="Edad al día"
                ayuda="Por defecto, hoy. Cambiala para saber la edad en otra fecha."
            />
            <Button type="submit" size="lg" class="h-11 text-base"
                >Calcular</Button
            >
        </form>

        <TarjetaResultado
            etiqueta="Edad"
            :valor="resultado ? anios(resultado.edad.anios) : null"
            :error="error"
            :desactualizado="desactualizado"
        >
            <template v-if="resultado">
                <FilaDato
                    etiqueta="Edad exacta"
                    :valor="textoAniosMesesDias(resultado.edad)"
                />
                <FilaDato
                    etiqueta="Días vividos"
                    :valor="formatearNumero(resultado.diasVividos)"
                />
                <FilaDato
                    :etiqueta="`Cumple ${anios(resultado.cumpleAnios)}`"
                    :valor="formatoLargo(resultado.proximoCumple)"
                />
            </template>
            <template #extra>
                <p
                    v-if="resultado"
                    class="mt-2 rounded-lg bg-celeste-suave px-3 py-2 text-sm"
                >
                    <template v-if="resultado.cumpleHoy"
                        >¡Hoy es el cumpleaños! 🎂</template
                    >
                    <template v-else
                        >Faltan
                        {{ formatearNumero(resultado.diasParaCumple) }}
                        {{ resultado.diasParaCumple === 1 ? 'día' : 'días' }}
                        para el próximo cumpleaños.</template
                    >
                </p>
            </template>
        </TarjetaResultado>
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #como>
            <p>
                Cuenta años y meses completos de calendario y, después, los días
                que sobran. Quien nació un 29 de febrero cumple el 28 de febrero
                en los años que no son bisiestos.
            </p>
        </template>
    </SeccionExplicacion>
</template>
