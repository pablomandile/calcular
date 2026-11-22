<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { Copy, Delete, History, SquareRadical } from '@lucide/vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import TeclaCalc from '@/components/calcular/TeclaCalc.vue';
import { useHistorial } from '@/composables/useHistorial';
import { useReusar } from '@/composables/useReusar';
import type { EstadoBasica, Operador } from '@/lib/calc/basica';
import {
    borrar,
    cambiarSigno,
    coma,
    digito,
    estadoInicial,
    expresionEnCurso,
    igual,
    limpiarEntrada,
    limpiarTodo,
    memoriaLimpiar,
    memoriaRecuperar,
    memoriaRestar,
    memoriaSumar,
    operador,
    pantalla,
    porcentaje,
    usarValor,
    valorActual,
} from '@/lib/calc/basica';
import { almacenLocal, copiarTexto } from '@/lib/navegador';
import { cn } from '@/lib/utils';

const CLAVE_MEMORIA = 'calcular.memoria';

const estado = ref<EstadoBasica>(
    estadoInicial(almacenLocal.leer(CLAVE_MEMORIA) ?? '0'),
);
const { agregar, deTipo } = useHistorial();
const cinta = deTipo('basica', 30);

watch(
    () => estado.value.memoria,
    (m) => almacenLocal.guardar(CLAVE_MEMORIA, m),
);

useReusar('basica', (entrada) => {
    if (typeof entrada.valor === 'string') {
        estado.value = usarValor(estado.value, entrada.valor);
    }
});

const textoPantalla = computed(() => pantalla(estado.value));
const textoExpresion = computed(() => expresionEnCurso(estado.value));

function pantallaDe(canonico: string): string {
    return pantalla({
        ...estadoInicial(),
        entrada: canonico,
        sobrescribir: true,
    });
}

const hayMemoria = computed(() => estado.value.memoria !== '0');
const hayEntrada = computed(
    () =>
        !estado.value.recienCalculado &&
        estado.value.entrada !== '0' &&
        estado.value.entrada !== '',
);

/** Achica el número si no entra en el ancho de la pantalla. */
const tamanioNumero = computed(() => {
    const largo = textoPantalla.value.length;

    if (estado.value.error) {
        return 'text-2xl';
    }

    if (largo > 18) {
        return 'text-3xl';
    }

    if (largo > 13) {
        return 'text-4xl';
    }

    if (largo > 9) {
        return 'text-5xl';
    }

    return 'text-6xl';
});

function calcularIgual() {
    const { estado: nuevo, registro } = igual(estado.value);
    estado.value = nuevo;

    if (registro) {
        agregar({
            tipo: 'basica',
            titulo: registro.expresion,
            resultado: registro.resultado,
            entrada: { valor: nuevo.entrada },
        });
    }
}

type Tecla = {
    etiqueta: string;
    accion: () => void;
    tipo: 'numero' | 'operador' | 'igual';
    ariaLabel?: string;
};

const aplicar = (f: (e: EstadoBasica) => EstadoBasica) => () => {
    estado.value = f(estado.value);
};
const num = (d: string): Tecla => ({
    etiqueta: d,
    accion: aplicar((e) => digito(e, d)),
    tipo: 'numero',
});
const op = (o: Operador, aria: string): Tecla => ({
    etiqueta: o,
    accion: aplicar((e) => operador(e, o)),
    tipo: 'operador',
    ariaLabel: aria,
});

const teclas = computed<Tecla[]>(() => [
    hayEntrada.value
        ? {
              etiqueta: 'CE',
              accion: aplicar(limpiarEntrada),
              tipo: 'numero',
              ariaLabel: 'Borrar el número',
          }
        : {
              etiqueta: 'C',
              accion: aplicar(limpiarTodo),
              tipo: 'numero',
              ariaLabel: 'Borrar todo',
          },
    {
        etiqueta: '⌫',
        accion: aplicar(borrar),
        tipo: 'numero',
        ariaLabel: 'Borrar el último dígito',
    },
    {
        etiqueta: '%',
        accion: aplicar(porcentaje),
        tipo: 'numero',
        ariaLabel: 'Porcentaje',
    },
    op('÷', 'Dividido'),
    num('7'),
    num('8'),
    num('9'),
    op('×', 'Por'),
    num('4'),
    num('5'),
    num('6'),
    op('−', 'Menos'),
    num('1'),
    num('2'),
    num('3'),
    op('+', 'Más'),
    {
        etiqueta: '±',
        accion: aplicar(cambiarSigno),
        tipo: 'numero',
        ariaLabel: 'Cambiar el signo',
    },
    num('0'),
    {
        etiqueta: ',',
        accion: aplicar(coma),
        tipo: 'numero',
        ariaLabel: 'Coma decimal',
    },
    {
        etiqueta: '=',
        accion: calcularIgual,
        tipo: 'igual',
        ariaLabel: 'Igual',
    },
]);

const teclasMemoria: Tecla[] = [
    {
        etiqueta: 'MC',
        accion: aplicar(memoriaLimpiar),
        tipo: 'numero',
        ariaLabel: 'Borrar la memoria',
    },
    {
        etiqueta: 'MR',
        accion: aplicar(memoriaRecuperar),
        tipo: 'numero',
        ariaLabel: 'Recuperar la memoria',
    },
    {
        etiqueta: 'M+',
        accion: aplicar(memoriaSumar),
        tipo: 'numero',
        ariaLabel: 'Sumar a la memoria',
    },
    {
        etiqueta: 'M−',
        accion: aplicar(memoriaRestar),
        tipo: 'numero',
        ariaLabel: 'Restar de la memoria',
    },
];

/** Teclado físico. */
function alTeclear(ev: KeyboardEvent) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) {
        return;
    }

    const destino = ev.target as HTMLElement | null;

    if (destino && ['INPUT', 'TEXTAREA', 'SELECT'].includes(destino.tagName)) {
        return;
    }

    const k = ev.key;
    const mapa: Record<string, () => void> = {
        '+': aplicar((e) => operador(e, '+')),
        '-': aplicar((e) => operador(e, '−')),
        '*': aplicar((e) => operador(e, '×')),
        x: aplicar((e) => operador(e, '×')),
        '/': aplicar((e) => operador(e, '÷')),
        ',': aplicar(coma),
        '.': aplicar(coma),
        '%': aplicar(porcentaje),
        Enter: calcularIgual,
        '=': calcularIgual,
        Backspace: aplicar(borrar),
        Escape: aplicar(limpiarTodo),
        Delete: aplicar(limpiarEntrada),
        F9: aplicar(cambiarSigno),
    };

    if (/^\d$/.test(k)) {
        estado.value = digito(estado.value, k);
    } else if (mapa[k]) {
        mapa[k]();
    } else {
        return;
    }

    ev.preventDefault();
}

onMounted(() => window.addEventListener('keydown', alTeclear));
onBeforeUnmount(() => window.removeEventListener('keydown', alTeclear));

async function copiar() {
    if (estado.value.error) {
        return;
    }

    const ok = await copiarTexto(
        pantallaDe(valorActual(estado.value).toString()),
    );
    toast[ok ? 'success' : 'error'](
        ok ? 'Resultado copiado' : 'No se pudo copiar',
    );
}

function usarDeCinta(valor: unknown) {
    if (typeof valor === 'string') {
        estado.value = usarValor(estado.value, valor);
    }
}
</script>

<template>
    <EncabezadoCalculadora clave="basica" compacto />

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <section
            class="-mx-4 -mt-5 bg-calc-fondo px-4 pt-2 pb-4 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-md sm:rounded-3xl sm:border sm:border-border sm:p-5 sm:shadow-sm dark:sm:border-transparent"
            aria-label="Calculadora"
        >
            <!-- Barra de íconos -->
            <div class="flex items-center gap-1 text-calc-pantalla">
                <Link
                    href="/historial"
                    class="flex size-11 items-center justify-center rounded-full hover:bg-calc-num"
                    aria-label="Historial"
                >
                    <History class="size-6" />
                </Link>
                <span
                    class="ml-1 text-sm font-semibold"
                    :class="hayMemoria ? 'visible' : 'invisible'"
                    title="Hay un valor en memoria"
                    >M</span
                >
                <Link
                    href="/cientifica"
                    class="ml-auto flex size-11 items-center justify-center rounded-full hover:bg-calc-num"
                    aria-label="Pasar a la científica"
                >
                    <SquareRadical class="size-6" />
                </Link>
                <button
                    type="button"
                    class="flex size-11 items-center justify-center rounded-full hover:bg-calc-num"
                    aria-label="Copiar el resultado"
                    @click="copiar"
                >
                    <Copy class="size-5" />
                </button>
            </div>

            <!-- Pantalla -->
            <div
                class="flex min-h-28 flex-col justify-end px-2 pt-2 pb-2 text-right sm:min-h-40 sm:pt-4 sm:pb-3"
            >
                <span
                    class="numeros min-h-7 truncate text-lg text-muted-foreground"
                    data-test="expresion"
                >
                    {{ textoExpresion }}
                </span>
                <output
                    :class="
                        cn(
                            'numeros min-w-0 font-light tracking-tight break-all text-calc-pantalla',
                            tamanioNumero,
                            estado.error && 'text-destructive',
                        )
                    "
                    aria-live="polite"
                    data-test="pantalla"
                    >{{ textoPantalla }}</output
                >
            </div>

            <!-- Memoria -->
            <div
                class="mb-2 grid grid-cols-4 gap-2 border-t border-border/60 pt-2 sm:mb-3"
            >
                <button
                    v-for="t in teclasMemoria"
                    :key="t.etiqueta"
                    type="button"
                    class="h-9 rounded-full text-sm font-medium text-calc-num-texto/80 transition-colors hover:bg-calc-num hover:text-calc-num-texto"
                    :aria-label="t.ariaLabel"
                    @click="t.accion"
                >
                    {{ t.etiqueta }}
                </button>
            </div>

            <div
                class="grid grid-cols-4 gap-3 [--alto-tecla:clamp(3rem,calc((100dvh-25rem)/5),5rem)] sm:[--alto-tecla:5rem]"
            >
                <TeclaCalc
                    v-for="t in teclas"
                    :key="t.etiqueta"
                    forma="circulo"
                    :variante="t.tipo"
                    :aria-label="t.ariaLabel ?? t.etiqueta"
                    :data-tecla="t.etiqueta"
                    @click="t.accion"
                >
                    <Delete v-if="t.etiqueta === '⌫'" class="size-7" />
                    <span v-else :class="t.tipo !== 'numero' && 'text-4xl'">{{
                        t.etiqueta
                    }}</span>
                </TeclaCalc>
            </div>
            <p
                class="mt-4 hidden text-center text-xs text-muted-foreground sm:block"
            >
                También podés usar el teclado: números, + − * /, Enter y Esc.
            </p>
        </section>

        <!-- Cinta: últimas cuentas -->
        <section
            class="rounded-2xl border border-border bg-card p-4"
            aria-labelledby="titulo-cinta"
        >
            <div class="mb-2 flex items-center justify-between">
                <h2 id="titulo-cinta" class="font-semibold">Últimas cuentas</h2>
                <Link
                    href="/historial"
                    class="inline-flex min-h-10 items-center gap-1 text-sm text-primary hover:underline"
                >
                    <History class="size-4" />
                    Historial
                </Link>
            </div>
            <p
                v-if="cinta.length === 0"
                class="py-6 text-sm text-muted-foreground"
            >
                Cada cuenta que hagas con = queda guardada acá. Tocá una para
                usar su resultado.
            </p>
            <ul
                v-else
                class="max-h-[28rem] divide-y divide-border overflow-y-auto"
            >
                <li v-for="c in cinta" :key="c.id">
                    <button
                        type="button"
                        class="w-full rounded-md px-2 py-2.5 text-right transition-colors hover:bg-muted"
                        :aria-label="`Usar ${c.resultado}`"
                        @click="usarDeCinta(c.entrada.valor)"
                    >
                        <span
                            class="numeros block truncate text-sm text-muted-foreground"
                            >{{ c.titulo }} =</span
                        >
                        <span class="numeros block text-lg font-semibold">{{
                            c.resultado
                        }}</span>
                    </button>
                </li>
            </ul>
        </section>
    </div>
</template>
