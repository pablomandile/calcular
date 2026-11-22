<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import CampoFecha from '@/components/calcular/CampoFecha.vue';
import CampoNumero from '@/components/calcular/CampoNumero.vue';
import Casilla from '@/components/calcular/Casilla.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import SelectorOpciones from '@/components/calcular/SelectorOpciones.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import TarjetaResultado from '@/components/calcular/TarjetaResultado.vue';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useCalculo } from '@/composables/useCalculo';
import { useFeriados } from '@/composables/useFeriados';
import { useReusar } from '@/composables/useReusar';
import type { Feriado } from '@/lib/calc/diasHabiles';
import {
    aniosEnRango,
    contarHabiles,
    crearCalendario,
    esNoLaborable,
    sumarHabiles,
} from '@/lib/calc/diasHabiles';
import { formatoCorto, formatoLargo, hoyISO } from '@/lib/calc/fechas';
import { formatearNumero } from '@/lib/calc/numero';
import { enteroRequerido } from '@/lib/calc/validar';

type Modo = 'sumar' | 'contar';

const datos = ref({
    modo: 'sumar' as Modo,
    inicio: hoyISO(),
    operacion: 'sumar' as 'sumar' | 'restar',
    cantidad: '',
    desde: hoyISO(),
    hasta: '',
    noLaborablesComoHabiles: false,
});

const { obtener, cargando, sinDatos } = useFeriados();
/** Feriados cargados para el cálculo en curso. */
const feriados = shallowRef<Feriado[]>([]);

function habiles(n: number): string {
    return `${formatearNumero(n)} ${n === 1 ? 'día hábil' : 'días hábiles'}`;
}

function cantidadPedida(): number {
    return enteroRequerido(datos.value.cantidad, 'la cantidad de días', {
        min: 0,
        max: 2000,
    });
}

const { resultado, error, desactualizado, ejecutar } = useCalculo(
    datos,
    (d) => {
        const cal = crearCalendario(feriados.value, {
            noLaborablesComoHabiles: d.noLaborablesComoHabiles,
        });

        if (d.modo === 'sumar') {
            if (!d.inicio) {
                throw new Error('Elegí la fecha de partida.');
            }

            const n = cantidadPedida();
            const r = sumarHabiles(
                d.inicio,
                d.operacion === 'restar' ? -n : n,
                cal,
            );

            return { modo: 'sumar' as const, n, ...r };
        }

        if (!d.desde || !d.hasta) {
            throw new Error('Elegí las dos fechas.');
        }

        return {
            modo: 'contar' as const,
            ...contarHabiles(d.desde, d.hasta, cal),
        };
    },
    (d, r) =>
        r.modo === 'sumar'
            ? {
                  tipo: 'dias-habiles',
                  titulo: `${formatoCorto(d.inicio)} ${d.operacion === 'restar' ? '−' : '+'} ${habiles(r.n)}`,
                  resultado: formatoCorto(r.fecha),
                  entrada: { ...d },
              }
            : {
                  tipo: 'dias-habiles',
                  titulo: `Hábiles del ${formatoCorto(d.desde)} al ${formatoCorto(d.hasta)}`,
                  resultado: habiles(r.habiles),
                  entrada: { ...d },
              },
);

/**
 * Carga los feriados de los años que toca el cálculo y recién ahí calcula.
 * Al sumar no se sabe de antemano dónde termina: se prueba con lo cargado y,
 * si el resultado cae en un año nuevo, se carga ese año y se recalcula.
 */
async function enviar() {
    const d = datos.value;

    try {
        if (d.modo === 'contar') {
            if (d.desde && d.hasta) {
                feriados.value = await obtener(aniosEnRango(d.desde, d.hasta));
            }
        } else if (d.inicio) {
            const n = cantidadPedida();
            const signo = d.operacion === 'restar' ? -1 : 1;
            let anios = [Number(d.inicio.slice(0, 4))];
            feriados.value = await obtener(anios);

            for (let i = 0; i < 10; i++) {
                const tentativo = sumarHabiles(
                    d.inicio,
                    signo * n,
                    crearCalendario(feriados.value, {
                        noLaborablesComoHabiles: d.noLaborablesComoHabiles,
                    }),
                ).fecha;
                const necesarios = aniosEnRango(d.inicio, tentativo);

                if (necesarios.every((a) => anios.includes(a))) {
                    break;
                }

                anios = necesarios;
                feriados.value = await obtener(anios);
            }
        }
    } catch {
        // La validación de los campos la informa ejecutar().
    }

    ejecutar();
}

useReusar('dias-habiles', (entrada) => {
    datos.value = {
        ...datos.value,
        ...(entrada as Partial<typeof datos.value>),
    };
    void enviar();
});

const listaFeriados = computed(() => {
    const r = resultado.value;

    return r ? r.feriados : [];
});

const tipoTexto: Record<Feriado['tipo'], string> = {
    inamovible: 'Feriado',
    trasladable: 'Feriado trasladable',
    puente: 'No laborable (puente)',
    no_laborable: 'No laborable',
};

const apartados = [
    { id: 'como', titulo: 'Cómo cuenta' },
    { id: 'fuente', titulo: 'De dónde salen los feriados' },
];
</script>

<template>
    <EncabezadoCalculadora clave="dias-habiles" />

    <div class="grid items-start gap-6 lg:grid-cols-2">
        <form
            class="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
            @submit.prevent="enviar"
        >
            <SelectorOpciones
                v-model="datos.modo"
                nombre="modo"
                etiqueta="¿Qué querés hacer?"
                :opciones="[
                    { valor: 'sumar', titulo: 'Sumar o restar hábiles' },
                    { valor: 'contar', titulo: 'Contar hábiles entre fechas' },
                ]"
            />

            <template v-if="datos.modo === 'sumar'">
                <CampoFecha
                    id="inicio"
                    v-model="datos.inicio"
                    etiqueta="Fecha de partida"
                    ayuda="El día de partida no se cuenta."
                />
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
                    etiqueta="Días hábiles"
                    entero
                    placeholder="Por ejemplo: 10"
                />
            </template>

            <div v-else class="grid gap-5 sm:grid-cols-2">
                <CampoFecha id="desde" v-model="datos.desde" etiqueta="Desde" />
                <CampoFecha id="hasta" v-model="datos.hasta" etiqueta="Hasta" />
            </div>

            <Casilla
                id="no-laborables"
                v-model="datos.noLaborablesComoHabiles"
                etiqueta="Contar los días no laborables como hábiles"
                ayuda="Los puentes turísticos son optativos para el sector privado: muchos comercios y empresas trabajan."
            />

            <Button
                type="submit"
                size="lg"
                class="h-11 text-base"
                :disabled="cargando"
            >
                <Spinner v-if="cargando" />
                Calcular
            </Button>
        </form>

        <TarjetaResultado
            :etiqueta="
                resultado?.modo === 'contar'
                    ? 'Entre las dos fechas (inclusive) hay'
                    : 'La fecha resultante es'
            "
            :valor="
                resultado
                    ? resultado.modo === 'contar'
                        ? habiles(resultado.habiles)
                        : formatoLargo(resultado.fecha)
                    : null
            "
            :error="error"
            :desactualizado="desactualizado"
        >
            <template v-if="resultado">
                <template v-if="resultado.modo === 'sumar'">
                    <FilaDato
                        etiqueta="Fecha"
                        :valor="formatoCorto(resultado.fecha)"
                    />
                    <FilaDato
                        etiqueta="Días corridos"
                        :valor="formatearNumero(resultado.diasCorridos)"
                    />
                </template>
                <template v-else>
                    <FilaDato
                        etiqueta="Días corridos"
                        :valor="formatearNumero(resultado.corridos)"
                    />
                    <FilaDato
                        etiqueta="Sábados y domingos"
                        :valor="formatearNumero(resultado.finesDeSemana)"
                    />
                </template>
                <FilaDato
                    etiqueta="Feriados en días de semana"
                    :valor="formatearNumero(listaFeriados.length)"
                />
            </template>
            <template #extra>
                <p
                    v-if="resultado && sinDatos.length"
                    class="mt-2 rounded-lg bg-sol-suave px-3 py-2 text-sm"
                    role="status"
                >
                    Todavía no hay calendario de feriados de
                    {{ sinDatos.join(' y ') }}: para
                    {{ sinDatos.length === 1 ? 'ese año' : 'esos años' }} solo
                    se descuentan sábados y domingos.
                </p>
                <ul
                    v-if="listaFeriados.length"
                    class="mt-3 divide-y divide-border rounded-xl border border-border"
                    aria-label="Feriados que cayeron en el período"
                >
                    <li
                        v-for="f in listaFeriados"
                        :key="f.fecha"
                        class="flex items-baseline justify-between gap-3 px-3 py-2 text-sm"
                    >
                        <span>
                            <span class="numeros font-medium">{{
                                formatoCorto(f.fecha)
                            }}</span>
                            · {{ f.nombre }}
                        </span>
                        <span
                            class="shrink-0 text-xs"
                            :class="
                                esNoLaborable(f)
                                    ? 'text-muted-foreground'
                                    : 'font-medium text-primary'
                            "
                            >{{ tipoTexto[f.tipo] }}</span
                        >
                    </li>
                </ul>
            </template>
        </TarjetaResultado>
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #como>
            <ul>
                <li>
                    Son hábiles los días de lunes a viernes que no son feriado.
                </li>
                <li>
                    Al sumar o restar, el día de partida no cuenta: un viernes
                    más 1 hábil es el lunes (si no es feriado).
                </li>
                <li>Al contar entre dos fechas se incluyen las dos puntas.</li>
                <li>
                    No considera feriados provinciales ni municipales, ni
                    asuetos.
                </li>
            </ul>
        </template>
        <template #fuente>
            <p>
                Los feriados nacionales y días no laborables salen del
                calendario oficial publicado por el Gobierno, a través de
                ArgentinaDatos, y se actualizan todas las semanas. Si se anuncia
                un feriado nuevo, puede tardar unos días en aparecer.
            </p>
        </template>
    </SeccionExplicacion>
</template>
