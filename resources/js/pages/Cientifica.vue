<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { Calculator, Copy, Delete, History } from '@lucide/vue';
import { computed, nextTick, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import TeclaCalc from '@/components/calcular/TeclaCalc.vue';
import { useHistorial } from '@/composables/useHistorial';
import { useReusar } from '@/composables/useReusar';
import type { ModoAngulo } from '@/lib/calc/cientifica';
import { calcular, cerrarParentesis } from '@/lib/calc/cientifica';
import { formatearNumero } from '@/lib/calc/numero';
import { almacenLocal, copiarTexto } from '@/lib/navegador';
import { cn } from '@/lib/utils';

const CLAVE_MODO = 'calcular.modoAngulo';

const expresion = ref('');
const modo = ref<ModoAngulo>(
    almacenLocal.leer(CLAVE_MODO) === 'RAD' ? 'RAD' : 'DEG',
);
const ans = ref('0');
const resultado = ref<string | null>(null);
const error = ref<string | null>(null);
/** Expresión que dio el resultado visible ("sin(30) ="). */
const expresionResuelta = ref<string | null>(null);
const inversa = ref(false);
const campo = ref<HTMLInputElement | null>(null);

const { agregar, deTipo } = useHistorial();
const cinta = deTipo('cientifica', 30);

useReusar('cientifica', (entrada) => {
    if (typeof entrada.expresion === 'string') {
        expresion.value = entrada.expresion;
    }

    if (entrada.modo === 'DEG' || entrada.modo === 'RAD') {
        modo.value = entrada.modo;
    }
});

// Al escribir con el teclado físico, el resultado anterior deja lugar a la
// vista previa (igual() vacía la expresión y no entra en este caso).
watch(expresion, (nueva) => {
    if (nueva !== '') {
        resultado.value = null;
        error.value = null;
        expresionResuelta.value = null;
    }
});

/** Vista previa mientras se escribe, sin guardar en el historial. */
const vistaPrevia = computed(() => {
    if (expresion.value.trim() === '') {
        return null;
    }

    const r = calcular(expresion.value, modo.value, ans.value);

    return r.ok ? formatearNumero(r.valor, { maxDecimales: 12 }) : null;
});

function cambiarModo() {
    modo.value = modo.value === 'DEG' ? 'RAD' : 'DEG';
    almacenLocal.guardar(CLAVE_MODO, modo.value);
}

/**
 * Inserta texto en la posición del cursor. Si hay un resultado en pantalla
 * y se empieza con un operador, la cuenta sigue desde Ans.
 */
async function insertar(texto: string) {
    const el = campo.value;
    let actual = expresion.value;

    if (resultado.value !== null && actual === '') {
        if (/^[+−×÷^!%]/.test(texto)) {
            actual = 'Ans';
        }
    }

    resultado.value = null;
    error.value = null;
    expresionResuelta.value = null;

    const inicio = el?.selectionStart ?? actual.length;
    const fin = el?.selectionEnd ?? actual.length;
    const enFoco = document.activeElement === el;
    const desde = enFoco ? inicio : actual.length;
    const hasta = enFoco ? fin : actual.length;

    expresion.value = actual.slice(0, desde) + texto + actual.slice(hasta);
    await nextTick();

    if (el && enFoco) {
        const pos = desde + texto.length;
        el.setSelectionRange(pos, pos);
    }
}

function borrarUno() {
    error.value = null;
    // Borra un nombre de función entero: "sin(" de una.
    const m =
        /(asin\(|acos\(|atan\(|sinh\(|cosh\(|tanh\(|sin\(|cos\(|tan\(|log\(|ln\(|√\(|∛\(|abs\(|Ans)$/.exec(
            expresion.value,
        );
    expresion.value = m
        ? expresion.value.slice(0, -m[0].length)
        : expresion.value.slice(0, -1);
}

function limpiar() {
    expresion.value = '';
    resultado.value = null;
    error.value = null;
    expresionResuelta.value = null;
}

function igual() {
    const texto = cerrarParentesis(expresion.value);
    const r = calcular(texto, modo.value, ans.value);

    if (!r.ok) {
        error.value = r.error;

        return;
    }

    const formateado = formatearNumero(r.valor, { maxDecimales: 12 });
    resultado.value = formateado;
    expresionResuelta.value = texto;
    ans.value = r.valor.toString();
    expresion.value = '';
    error.value = null;

    agregar({
        tipo: 'cientifica',
        titulo: `${texto}${usaAngulos(texto) ? ` (${modo.value})` : ''}`,
        resultado: formateado,
        entrada: { expresion: texto, modo: modo.value },
    });
}

function usaAngulos(texto: string): boolean {
    return /(sin|cos|tan)\(/.test(texto) && !/(sinh|cosh|tanh)\(/.test(texto);
}

type Tecla = {
    etiqueta: string;
    inserta?: string;
    accion?: () => void;
    tipo: 'numero' | 'funcion' | 'operador' | 'igual';
    aria?: string;
    activa?: boolean;
};

const fn = (etiqueta: string, inserta: string, aria?: string): Tecla => ({
    etiqueta,
    inserta,
    tipo: 'funcion',
    aria,
});

/** Primera o segunda función según "2nd". */
const dos = (normal: Tecla, segunda: Tecla) =>
    inversa.value ? segunda : normal;

/**
 * Paréntesis "inteligente": cierra si hay uno abierto y lo anterior es un
 * número o un cierre; si no, abre.
 */
function parentesis() {
    const e = expresion.value;
    const abiertos =
        (e.match(/\(/g) ?? []).length - (e.match(/\)/g) ?? []).length;
    const cierra = abiertos > 0 && /([\d)πe!%]|Ans)$/.test(e);

    void insertar(cierra ? ')' : '(');
}

const teclasCientificas = computed<Tecla[]>(() => [
    {
        etiqueta: '2nd',
        accion: () => (inversa.value = !inversa.value),
        tipo: 'funcion',
        aria: 'Segundas funciones',
        activa: inversa.value,
    },
    {
        etiqueta: modo.value === 'DEG' ? 'Deg' : 'Rad',
        accion: cambiarModo,
        tipo: 'funcion',
        aria:
            modo.value === 'DEG'
                ? 'Ángulos en grados. Tocá para pasar a radianes'
                : 'Ángulos en radianes. Tocá para pasar a grados',
    },
    dos(fn('√', '√(', 'Raíz cuadrada'), fn('∛', '∛(', 'Raíz cúbica')),
    dos(fn('|x|', 'abs(', 'Valor absoluto'), fn('n!', '!', 'Factorial')),
    dos(fn('sin', 'sin(', 'Seno'), fn('sin⁻¹', 'asin(', 'Arcoseno')),
    dos(fn('cos', 'cos(', 'Coseno'), fn('cos⁻¹', 'acos(', 'Arcocoseno')),
    dos(fn('tan', 'tan(', 'Tangente'), fn('tan⁻¹', 'atan(', 'Arcotangente')),
    dos(fn('π', 'π', 'Pi'), fn('Ans', 'Ans', 'Resultado anterior')),
    dos(
        fn('ln', 'ln(', 'Logaritmo natural'),
        fn('sinh', 'sinh(', 'Seno hiperbólico'),
    ),
    dos(
        fn('log', 'log(', 'Logaritmo en base 10'),
        fn('cosh', 'cosh(', 'Coseno hiperbólico'),
    ),
    dos(
        fn('1/x', '^(−1)', 'Inverso'),
        fn('tanh', 'tanh(', 'Tangente hiperbólica'),
    ),
    dos(fn('e', 'e', 'Número e'), fn(';', ';', 'Separar argumentos')),
    dos(fn('eˣ', 'e^', 'e a la'), fn('10ˣ', '10^', 'Diez a la')),
    dos(fn('x²', '^2', 'Al cuadrado'), fn('x³', '^3', 'Al cubo')),
    dos(fn('xʸ', '^', 'Elevado a'), fn('EXP', '×10^', 'Por diez a la')),
    fn('+/−', '(−', 'Negativo'),
]);

const num = (d: string): Tecla => ({ etiqueta: d, inserta: d, tipo: 'numero' });
const op = (o: string, aria: string): Tecla => ({
    etiqueta: o,
    inserta: o,
    tipo: 'operador',
    aria,
});

const teclasBasicas: Tecla[] = [
    { etiqueta: 'C', accion: limpiar, tipo: 'numero', aria: 'Borrar todo' },
    {
        etiqueta: '⌫',
        accion: borrarUno,
        tipo: 'numero',
        aria: 'Borrar el último',
    },
    { etiqueta: '%', inserta: '%', tipo: 'numero', aria: 'Por ciento' },
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
        etiqueta: '( )',
        accion: parentesis,
        tipo: 'numero',
        aria: 'Paréntesis',
    },
    num('0'),
    { etiqueta: ',', inserta: ',', tipo: 'numero', aria: 'Coma decimal' },
    { etiqueta: '=', accion: igual, tipo: 'igual', aria: 'Igual' },
];

function tocar(t: Tecla) {
    if (t.accion) {
        t.accion();
    } else if (t.inserta) {
        void insertar(t.inserta);
    }
}

/** El teclado físico escribe en el campo; acá solo se traducen símbolos. */
function alTeclear(ev: KeyboardEvent) {
    const mapa: Record<string, string> = {
        '*': '×',
        '/': '÷',
        '-': '−',
        '.': ',',
        '+': '+',
        '^': '^',
        '!': '!',
        '%': '%',
    };

    if (ev.key === 'Enter' || ev.key === '=') {
        ev.preventDefault();
        igual();
    } else if (ev.key === 'Escape') {
        ev.preventDefault();
        limpiar();
    } else if (mapa[ev.key]) {
        ev.preventDefault();
        void insertar(mapa[ev.key]);
    }
}

async function copiar() {
    const texto = resultado.value ?? vistaPrevia.value;

    if (!texto) {
        return;
    }

    const ok = await copiarTexto(texto);
    toast[ok ? 'success' : 'error'](
        ok ? 'Resultado copiado' : 'No se pudo copiar',
    );
}

function reusarDeCinta(entrada: Record<string, unknown>) {
    if (typeof entrada.expresion === 'string') {
        expresion.value = entrada.expresion;
        resultado.value = null;
        error.value = null;
    }
}
</script>

<template>
    <EncabezadoCalculadora clave="cientifica" compacto />

    <div class="grid gap-6">
        <section
            class="-mx-4 -mt-5 bg-calc-fondo px-4 pt-2 pb-4 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-xl sm:rounded-3xl sm:border sm:border-border sm:p-5 sm:shadow-sm lg:max-w-5xl dark:sm:border-transparent"
            aria-label="Calculadora científica"
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
                    class="ml-1 text-xs font-semibold tracking-wide"
                    data-test="modo-visible"
                    >{{ modo === 'DEG' ? 'GRADOS' : 'RADIANES' }}</span
                >
                <Link
                    href="/calculadora"
                    class="ml-auto flex size-11 items-center justify-center rounded-full hover:bg-calc-num"
                    aria-label="Pasar a la calculadora normal"
                >
                    <Calculator class="size-6" />
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
            <div class="px-2 pt-1 pb-2 sm:pt-4 sm:pb-3">
                <p
                    class="numeros min-h-5 truncate text-right text-sm text-muted-foreground"
                    data-test="resuelta"
                >
                    {{ expresionResuelta ? expresionResuelta + ' =' : '' }}
                </p>
                <label for="expresion" class="sr-only">Expresión</label>
                <input
                    id="expresion"
                    ref="campo"
                    v-model="expresion"
                    type="text"
                    inputmode="none"
                    autocomplete="off"
                    spellcheck="false"
                    class="numeros w-full bg-transparent text-right text-3xl font-light text-calc-pantalla caret-calc-pantalla outline-none placeholder:text-calc-pantalla/60 sm:text-4xl"
                    :placeholder="resultado === null ? '0' : ''"
                    data-test="expresion"
                    @keydown="alTeclear"
                />
                <output
                    :class="
                        cn(
                            'numeros mt-1 block min-h-10 text-right break-all',
                            error
                                ? 'text-base text-destructive'
                                : 'text-4xl font-light text-calc-pantalla',
                        )
                    "
                    aria-live="polite"
                    data-test="resultado"
                >
                    <template v-if="error">{{ error }}</template>
                    <template v-else-if="resultado !== null">{{
                        resultado
                    }}</template>
                    <span
                        v-else-if="vistaPrevia"
                        class="text-2xl text-muted-foreground"
                        >= {{ vistaPrevia }}</span
                    >
                </output>
            </div>

            <div
                class="grid gap-x-6 gap-y-2 [--alto-tecla:clamp(2rem,calc((100dvh-23rem)/9),3rem)] lg:grid-cols-2 lg:items-end lg:[--alto-tecla:3rem]"
            >
                <div class="grid grid-cols-4 gap-2">
                    <TeclaCalc
                        v-for="(t, i) in teclasCientificas"
                        :key="i"
                        variante="funcion"
                        :activa="t.activa"
                        :aria-label="t.aria ?? t.etiqueta"
                        :aria-pressed="
                            t.etiqueta === '2nd' ? inversa : undefined
                        "
                        :data-tecla="t.etiqueta"
                        @click="tocar(t)"
                    >
                        {{ t.etiqueta }}
                    </TeclaCalc>
                </div>

                <div class="grid grid-cols-4 gap-2">
                    <TeclaCalc
                        v-for="(t, i) in teclasBasicas"
                        :key="i"
                        :variante="t.tipo"
                        :aria-label="t.aria ?? t.etiqueta"
                        :data-tecla="t.etiqueta"
                        @click="tocar(t)"
                    >
                        <Delete v-if="t.etiqueta === '⌫'" class="size-6" />
                        <span
                            v-else
                            :class="
                                (t.tipo === 'operador' || t.tipo === 'igual') &&
                                'text-3xl'
                            "
                            >{{ t.etiqueta }}</span
                        >
                    </TeclaCalc>
                </div>
            </div>
            <p
                class="mt-3 hidden text-center text-xs text-muted-foreground sm:block"
            >
                Con 2nd: inversas, hiperbólicas y ; para logaritmos en otra base
                → log(8;2) = 3.
            </p>
        </section>

        <section
            class="mx-auto w-full max-w-5xl rounded-2xl border border-border bg-card p-4"
            aria-labelledby="titulo-cinta"
        >
            <div class="mb-2 flex items-center justify-between">
                <h2 id="titulo-cinta" class="font-semibold">
                    Últimas expresiones
                </h2>
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
                Cada expresión que resuelvas queda acá. Tocá una para volver a
                editarla.
            </p>
            <ul
                v-else
                class="grid max-h-[32rem] gap-x-6 overflow-y-auto sm:grid-cols-2"
            >
                <li
                    v-for="c in cinta"
                    :key="c.id"
                    class="border-b border-border"
                >
                    <button
                        type="button"
                        class="w-full rounded-md px-2 py-2.5 text-right transition-colors hover:bg-muted"
                        :aria-label="`Editar ${c.titulo}`"
                        @click="reusarDeCinta(c.entrada)"
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
