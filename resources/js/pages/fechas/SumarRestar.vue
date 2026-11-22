<script setup lang="ts">
import { ref } from 'vue';
import CampoFecha from '@/components/calcular/CampoFecha.vue';
import CampoNumero from '@/components/calcular/CampoNumero.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import SelectorOpciones from '@/components/calcular/SelectorOpciones.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import TarjetaResultado from '@/components/calcular/TarjetaResultado.vue';
import { Button } from '@/components/ui/button';
import { useCalculo } from '@/composables/useCalculo';
import { useReusar } from '@/composables/useReusar';
import type { Unidad } from '@/lib/calc/fechas';
import {
    diasEntre,
    formatoCorto,
    formatoLargo,
    hoyISO,
    sumarRestar,
} from '@/lib/calc/fechas';
import { formatearNumero } from '@/lib/calc/numero';
import { enteroRequerido } from '@/lib/calc/validar';

const UNIDADES: {
    valor: Unidad;
    titulo: string;
    uno: string;
    varios: string;
}[] = [
    { valor: 'dias', titulo: 'Días', uno: 'día', varios: 'días' },
    { valor: 'semanas', titulo: 'Semanas', uno: 'semana', varios: 'semanas' },
    { valor: 'meses', titulo: 'Meses', uno: 'mes', varios: 'meses' },
    { valor: 'anios', titulo: 'Años', uno: 'año', varios: 'años' },
];

const datos = ref({
    fecha: hoyISO(),
    operacion: 'sumar' as 'sumar' | 'restar',
    cantidad: '',
    unidad: 'dias' as Unidad,
});

function cantidadTexto(n: number, unidad: Unidad): string {
    const u = UNIDADES.find((x) => x.valor === unidad)!;

    return `${formatearNumero(n)} ${n === 1 ? u.uno : u.varios}`;
}

const { resultado, error, desactualizado, ejecutar } = useCalculo(
    datos,
    (d) => {
        if (!d.fecha) {
            throw new Error('Elegí la fecha de partida.');
        }

        const n = enteroRequerido(d.cantidad, 'la cantidad', {
            min: 0,
            max: 100000,
        });
        const r = sumarRestar(
            d.fecha,
            d.operacion === 'restar' ? -n : n,
            d.unidad,
        );

        return { ...r, n, corridos: diasEntre(d.fecha, r.fecha).dias };
    },
    (d, r) => ({
        tipo: 'sumar-restar',
        titulo: `${formatoCorto(d.fecha)} ${d.operacion === 'restar' ? '−' : '+'} ${cantidadTexto(r.n, d.unidad)}`,
        resultado: formatoCorto(r.fecha),
        entrada: { ...d },
    }),
);

useReusar('sumar-restar', (entrada) => {
    datos.value = {
        fecha: String(entrada.fecha ?? hoyISO()),
        operacion: entrada.operacion === 'restar' ? 'restar' : 'sumar',
        cantidad: String(entrada.cantidad ?? ''),
        unidad: (UNIDADES.some((u) => u.valor === entrada.unidad)
            ? entrada.unidad
            : 'dias') as Unidad,
    };
    ejecutar();
});

const apartados = [
    { id: 'meses', titulo: 'Meses y fin de mes' },
    { id: 'ejemplo', titulo: 'Ejemplos' },
];
</script>

<template>
    <EncabezadoCalculadora clave="sumar-restar" />

    <div class="grid items-start gap-6 lg:grid-cols-2">
        <form
            class="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
            @submit.prevent="ejecutar"
        >
            <CampoFecha id="fecha" v-model="datos.fecha" etiqueta="Fecha" />
            <SelectorOpciones
                v-model="datos.operacion"
                nombre="operacion"
                etiqueta="Operación"
                :opciones="[
                    { valor: 'sumar', titulo: 'Sumar' },
                    { valor: 'restar', titulo: 'Restar' },
                ]"
            />
            <CampoNumero
                id="cantidad"
                v-model="datos.cantidad"
                etiqueta="Cantidad"
                entero
                placeholder="Por ejemplo: 90"
            />
            <SelectorOpciones
                v-model="datos.unidad"
                nombre="unidad"
                etiqueta="Unidad"
                :opciones="
                    UNIDADES.map((u) => ({ valor: u.valor, titulo: u.titulo }))
                "
            />
            <Button type="submit" size="lg" class="h-11 text-base"
                >Calcular</Button
            >
        </form>

        <TarjetaResultado
            etiqueta="La fecha resultante es"
            :valor="resultado ? formatoLargo(resultado.fecha) : null"
            :error="error"
            :desactualizado="desactualizado"
        >
            <template v-if="resultado">
                <FilaDato
                    etiqueta="Fecha"
                    :valor="formatoCorto(resultado.fecha)"
                />
                <FilaDato
                    etiqueta="Días corridos de diferencia"
                    :valor="formatearNumero(resultado.corridos)"
                />
            </template>
            <template #extra>
                <p
                    v-if="resultado?.recortada"
                    class="mt-2 rounded-lg bg-celeste-suave px-3 py-2 text-sm"
                >
                    El mes de destino no tiene ese día: usamos el último día del
                    mes.
                </p>
            </template>
        </TarjetaResultado>
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #meses>
            <p>
                Sumar meses o años mantiene el mismo día del mes. Si ese día no
                existe en el mes de destino, se usa el último: 31 de enero más
                un mes da 28 de febrero (o 29 en años bisiestos).
            </p>
        </template>
        <template #ejemplo>
            <ul>
                <li>21/11/2026 + 90 días = 19/02/2027.</li>
                <li>31/03/2026 − 1 mes = 28/02/2026.</li>
                <li>29/02/2024 + 1 año = 28/02/2025.</li>
            </ul>
        </template>
    </SeccionExplicacion>
</template>
