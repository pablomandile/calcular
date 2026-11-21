<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { Copy, Delete, History } from '@lucide/vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
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
        return 'text-2xl';
    }

    if (largo > 13) {
        return 'text-3xl';
    }

    if (largo > 10) {
        return 'text-4xl';
    }

    return 'text-5xl';
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
    tipo: 'numero' | 'funcion' | 'operador' | 'igual';
    ariaLabel?: string;
    clase?: string;
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
              tipo: 'funcion',
              ariaLabel: 'Borrar el número',
          }
        : {
              etiqueta: 'C',
              accion: aplicar(limpiarTodo),
              tipo: 'funcion',
              ariaLabel: 'Borrar todo',
          },
    {
        etiqueta: '⌫',
        accion: aplicar(borrar),
        tipo: 'funcion',
        ariaLabel: 'Borrar el último dígito',
    },
    {
        etiqueta: '%',
        accion: aplicar(porcentaje),
        tipo: 'funcion',
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
        tipo: 'funcion',
        ariaLabel: 'Borrar la memoria',
    },
    {
        etiqueta: 'MR',
        accion: aplicar(memoriaRecuperar),
        tipo: 'funcion',
        ariaLabel: 'Recuperar la memoria',
    },
    {
        etiqueta: 'M+',
        accion: aplicar(memoriaSumar),
        tipo: 'funcion',
        ariaLabel: 'Sumar a la memoria',
    },
    {
        etiqueta: 'M−',
        accion: aplicar(memoriaRestar),
        tipo: 'funcion',
        ariaLabel: 'Restar de la memoria',
    },
];

const estilos: Record<Tecla['tipo'], string> = {
    numero: 'bg-card text-foreground hover:bg-muted text-2xl',
    funcion: 'bg-secondary text-foreground hover:bg-muted text-xl',
    operador:
        'bg-celeste-suave text-primary hover:bg-celeste/30 text-3xl font-medium',
    igual: 'bg-primary text-primary-foreground hover:bg-primary/90 text-3xl font-medium',
};

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
            class="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4"
            aria-label="Calculadora"
        >
            <!-- Pantalla -->
            <div
                class="mb-3 flex min-h-32 flex-col justify-end rounded-xl bg-muted/60 px-4 py-3 text-right"
            >
                <div class="flex items-center justify-between gap-2">
                    <span
                        class="text-xs font-semibold text-primary"
                        :class="hayMemoria ? 'visible' : 'invisible'"
                        title="Hay un valor en memoria"
                        >M</span
                    >
                    <span
                        class="numeros min-h-6 truncate text-base text-muted-foreground"
                        data-test="expresion"
                    >
                        {{ textoExpresion }}
                    </span>
                </div>
                <div class="flex items-end justify-end gap-2">
                    <output
                        :class="
                            cn(
                                'numeros min-w-0 font-semibold tracking-tight break-all',
                                tamanioNumero,
                                estado.error && 'text-destructive',
                            )
                        "
                        aria-live="polite"
                        data-test="pantalla"
                        >{{ textoPantalla }}</output
                    >
                </div>
            </div>

            <div class="mb-2 grid grid-cols-5 gap-2">
                <button
                    v-for="t in teclasMemoria"
                    :key="t.etiqueta"
                    type="button"
                    class="h-10 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    :aria-label="t.ariaLabel"
                    @click="t.accion"
                >
                    {{ t.etiqueta }}
                </button>
                <button
                    type="button"
                    class="flex h-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Copiar el resultado"
                    @click="copiar"
                >
                    <Copy class="size-4" />
                </button>
            </div>

            <div class="grid grid-cols-4 gap-2">
                <button
                    v-for="t in teclas"
                    :key="t.etiqueta"
                    type="button"
                    :class="
                        cn(
                            'numeros flex h-16 items-center justify-center rounded-xl border border-border/60 shadow-xs transition-colors select-none active:scale-[0.97] sm:h-[4.25rem]',
                            estilos[t.tipo],
                        )
                    "
                    :aria-label="t.ariaLabel ?? t.etiqueta"
                    :data-tecla="t.etiqueta"
                    @click="t.accion"
                >
                    <Delete v-if="t.etiqueta === '⌫'" class="size-6" />
                    <template v-else>{{ t.etiqueta }}</template>
                </button>
            </div>
            <p
                class="mt-3 hidden text-center text-xs text-muted-foreground sm:block"
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
