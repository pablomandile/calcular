<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import type { ModoPorcentaje } from '@/components/calcular/TarjetaPorcentaje.vue';
import TarjetaPorcentaje from '@/components/calcular/TarjetaPorcentaje.vue';
import { useReusar } from '@/composables/useReusar';
import type { Dec } from '@/lib/calc/numero';
import { formatearNumero } from '@/lib/calc/numero';
import {
    aumentar,
    descontar,
    porcentajeDe,
    quePorcentajeEs,
    valorOriginal,
    variacion,
} from '@/lib/calc/porcentajes';
import { numeroRequerido } from '@/lib/calc/validar';

const num = (d: Dec) => formatearNumero(d, { maxDecimales: 2 });
const pct = (d: Dec) => `${formatearNumero(d, { maxDecimales: 2 })} %`;

const modos: ModoPorcentaje[] = [
    {
        clave: 'de',
        titulo: '¿Cuánto es el X % de un número?',
        campos: [
            {
                clave: 'p',
                etiqueta: 'Porcentaje',
                sufijo: '%',
                placeholder: '21',
            },
            { clave: 'x', etiqueta: 'Número', placeholder: '1.000' },
        ],
        calcular: (v) => {
            const p = numeroRequerido(v.p, 'el porcentaje');
            const x = numeroRequerido(v.x, 'el número');
            const r = porcentajeDe(p, x);

            return {
                valor: num(r),
                antes: `El ${pct(p)} de ${num(x)} es`,
                titulo: `${pct(p)} de ${num(x)}`,
            };
        },
    },
    {
        clave: 'que',
        titulo: '¿Qué porcentaje es un número de otro?',
        campos: [
            { clave: 'x', etiqueta: 'Parte', placeholder: '50' },
            { clave: 'y', etiqueta: 'Total', placeholder: '200' },
        ],
        calcular: (v) => {
            const x = numeroRequerido(v.x, 'la parte');
            const y = numeroRequerido(v.y, 'el total');
            const r = quePorcentajeEs(x, y);

            return {
                valor: pct(r),
                antes: `${num(x)} sobre ${num(y)} es el`,
                titulo: `${num(x)} sobre ${num(y)}`,
            };
        },
    },
    {
        clave: 'variacion',
        titulo: 'Variación porcentual entre dos valores',
        campos: [
            { clave: 'a', etiqueta: 'Valor inicial', placeholder: '80' },
            { clave: 'b', etiqueta: 'Valor final', placeholder: '100' },
        ],
        calcular: (v) => {
            const a = numeroRequerido(v.a, 'el valor inicial');
            const b = numeroRequerido(v.b, 'el valor final');
            const r = variacion(a, b);
            const signo = r.isPositive() && !r.isZero() ? '+' : '';

            return {
                valor: signo + pct(r),
                antes: `De ${num(a)} a ${num(b)} ${r.isNegative() ? 'bajó' : 'subió'}`,
                titulo: `De ${num(a)} a ${num(b)}`,
            };
        },
    },
    {
        clave: 'aplicar',
        titulo: 'Aumentar o descontar un porcentaje',
        opciones: [
            { valor: 'aumento', titulo: 'Aumento' },
            { valor: 'descuento', titulo: 'Descuento' },
        ],
        campos: [
            {
                clave: 'x',
                etiqueta: 'Valor',
                prefijo: '$',
                placeholder: '1.000',
            },
            {
                clave: 'p',
                etiqueta: 'Porcentaje',
                sufijo: '%',
                placeholder: '15',
            },
        ],
        calcular: (v, opcion) => {
            const x = numeroRequerido(v.x, 'el valor');
            const p = numeroRequerido(v.p, 'el porcentaje');
            const r = opcion === 'descuento' ? descontar(x, p) : aumentar(x, p);
            const accion = opcion === 'descuento' ? 'menos' : 'más';

            return {
                valor: num(r),
                antes: `${num(x)} ${accion} el ${pct(p)} es`,
                titulo: `${num(x)} ${accion} el ${pct(p)}`,
            };
        },
    },
    {
        clave: 'original',
        titulo: 'Valor antes de un aumento o descuento (precio sin IVA)',
        opciones: [
            { valor: 'aumento', titulo: 'Tenía un aumento' },
            { valor: 'descuento', titulo: 'Tenía un descuento' },
        ],
        campos: [
            {
                clave: 'final',
                etiqueta: 'Valor final',
                prefijo: '$',
                placeholder: '1.210',
            },
            {
                clave: 'p',
                etiqueta: 'Porcentaje',
                sufijo: '%',
                placeholder: '21',
            },
        ],
        atajos: [
            { titulo: 'IVA 21 %', campo: 'p', valor: '21' },
            { titulo: 'IVA 10,5 %', campo: 'p', valor: '10,5' },
            { titulo: 'IVA 27 %', campo: 'p', valor: '27' },
        ],
        calcular: (v, opcion) => {
            const final = numeroRequerido(v.final, 'el valor final');
            const p = numeroRequerido(v.p, 'el porcentaje');
            const tipo = opcion === 'descuento' ? 'descuento' : 'aumento';
            const r = valorOriginal(final, p, tipo);
            const con = tipo === 'aumento' ? 'con' : 'con descuento del';

            return {
                valor: num(r),
                antes: `${num(final)} ${con} ${pct(p)} era originalmente`,
                titulo: `${num(final)} sin el ${pct(p)}`,
            };
        },
    },
];

const valores = reactive<Record<string, Record<string, string>>>(
    Object.fromEntries(
        modos.map((m) => [
            m.clave,
            Object.fromEntries(m.campos.map((c) => [c.clave, ''])),
        ]),
    ),
);
const opciones = reactive<Record<string, string>>({
    aplicar: 'aumento',
    original: 'aumento',
});

const tarjetas = ref<Record<string, InstanceType<typeof TarjetaPorcentaje>>>(
    {},
);

useReusar('porcentajes', async (entrada) => {
    const clave = String(entrada.modo ?? '');

    if (!valores[clave]) {
        return;
    }

    Object.assign(valores[clave], entrada.valores ?? {});

    if (typeof entrada.opcion === 'string' && entrada.opcion) {
        opciones[clave] = entrada.opcion;
    }

    await nextTick();
    tarjetas.value[clave]?.ejecutar();
    document
        .getElementById(`porcentaje-${clave}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

const apartados = [
    { id: 'formulas', titulo: 'Fórmulas' },
    { id: 'errores', titulo: 'Errores frecuentes' },
];
</script>

<template>
    <EncabezadoCalculadora clave="porcentajes" />

    <div class="grid items-start gap-5 lg:grid-cols-2">
        <TarjetaPorcentaje
            v-for="m in modos"
            :key="m.clave"
            :ref="
                (el) => {
                    if (el) {
                        tarjetas[m.clave] = el as InstanceType<
                            typeof TarjetaPorcentaje
                        >;
                    }
                }
            "
            v-model:valores="valores[m.clave]"
            v-model:opcion="opciones[m.clave]"
            :modo="m"
        />
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #formulas>
            <ul class="numeros">
                <li>X % de N = N × X / 100</li>
                <li>Qué % es A de B = A / B × 100</li>
                <li>Variación = (final − inicial) / inicial × 100</li>
                <li>Aumento: N × (1 + X/100) · Descuento: N × (1 − X/100)</li>
                <li>Valor original = final / (1 ± X/100)</li>
            </ul>
        </template>
        <template #errores>
            <ul>
                <li>
                    Para sacar el IVA no se resta el 21 %: $ 1.210 − 21 % da $
                    955,90, pero el precio sin IVA es $ 1.000 (1.210 / 1,21).
                </li>
                <li>
                    Un aumento y un descuento del mismo porcentaje no se
                    cancelan: 100 + 20 % = 120, y 120 − 20 % = 96.
                </li>
            </ul>
        </template>
    </SeccionExplicacion>
</template>
