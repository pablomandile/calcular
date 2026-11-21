<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { Copy, Delete, History } from '@lucide/vue';
import { computed, nextTick, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
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
        if (/^[+−×÷^!]/.test(texto)) {
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
    tipo: 'numero' | 'funcion' | 'operador' | 'igual' | 'control';
    aria?: string;
};

const fn = (etiqueta: string, inserta: string, aria?: string): Tecla => ({
    etiqueta,
    inserta,
    tipo: 'funcion',
    aria,
});

const teclasCientificas = computed<Tecla[]>(() => [
    inversa.value
        ? fn('sin⁻¹', 'asin(', 'Arcoseno')
        : fn('sin', 'sin(', 'Seno'),
    inversa.value
        ? fn('cos⁻¹', 'acos(', 'Arcocoseno')
        : fn('cos', 'cos(', 'Coseno'),
    inversa.value
        ? fn('tan⁻¹', 'atan(', 'Arcotangente')
        : fn('tan', 'tan(', 'Tangente'),
    inversa.value
        ? fn('10ˣ', '10^', 'Diez a la')
        : fn('log', 'log(', 'Logaritmo en base 10'),
    inversa.value
        ? fn('eˣ', 'e^', 'e a la')
        : fn('ln', 'ln(', 'Logaritmo natural'),
    inversa.value
        ? fn('sinh', 'sinh(', 'Seno hiperbólico')
        : fn('x²', '^2', 'Al cuadrado'),
    inversa.value
        ? fn('cosh', 'cosh(', 'Coseno hiperbólico')
        : fn('xʸ', '^', 'Elevado a'),
    inversa.value
        ? fn('tanh', 'tanh(', 'Tangente hiperbólica')
        : fn('√', '√(', 'Raíz cuadrada'),
    inversa.value
        ? fn('|x|', 'abs(', 'Valor absoluto')
        : fn('∛', '∛(', 'Raíz cúbica'),
    fn('n!', '!', 'Factorial'),
    fn('π', 'π', 'Pi'),
    fn('e', 'e', 'Número e'),
    fn('(', '(', 'Abrir paréntesis'),
    fn(')', ')', 'Cerrar paréntesis'),
    fn('Ans', 'Ans', 'Resultado anterior'),
]);

const num = (d: string): Tecla => ({ etiqueta: d, inserta: d, tipo: 'numero' });
const op = (o: string, aria: string): Tecla => ({
    etiqueta: o,
    inserta: o,
    tipo: 'operador',
    aria,
});

const teclasBasicas: Tecla[] = [
    { etiqueta: 'C', accion: limpiar, tipo: 'control', aria: 'Borrar todo' },
    {
        etiqueta: '⌫',
        accion: borrarUno,
        tipo: 'control',
        aria: 'Borrar el último',
    },
    {
        etiqueta: ';',
        inserta: ';',
        tipo: 'control',
        aria: 'Separar argumentos',
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
    { etiqueta: 'EXP', inserta: '×10^', tipo: 'numero', aria: 'Por diez a la' },
    num('0'),
    { etiqueta: ',', inserta: ',', tipo: 'numero', aria: 'Coma decimal' },
    { etiqueta: '=', accion: igual, tipo: 'igual', aria: 'Igual' },
];

const estilos: Record<Tecla['tipo'], string> = {
    numero: 'bg-card text-foreground hover:bg-muted text-xl',
    control: 'bg-secondary text-foreground hover:bg-muted text-lg',
    funcion:
        'bg-secondary/70 text-foreground hover:bg-muted text-base font-medium',
    operador:
        'bg-celeste-suave text-primary hover:bg-celeste/30 text-2xl font-medium',
    igual: 'bg-primary text-primary-foreground hover:bg-primary/90 text-2xl font-medium',
};

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

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,34rem)_1fr]">
        <section
            class="mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4"
            aria-label="Calculadora científica"
        >
            <!-- Pantalla -->
            <div
                class="mb-2 rounded-xl bg-muted/60 px-3 py-2.5 sm:mb-3 sm:px-4 sm:py-3"
            >
                <div class="flex items-center gap-2 text-xs">
                    <button
                        type="button"
                        class="h-9 rounded-md border border-border bg-card px-2.5 font-semibold text-primary"
                        :aria-label="
                            modo === 'DEG'
                                ? 'Ángulos en grados. Tocá para pasar a radianes'
                                : 'Ángulos en radianes. Tocá para pasar a grados'
                        "
                        data-test="modo"
                        @click="cambiarModo"
                    >
                        {{ modo }}
                    </button>
                    <button
                        type="button"
                        :class="
                            cn(
                                'h-9 rounded-md border px-2.5 font-semibold transition-colors',
                                inversa
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                            )
                        "
                        :aria-pressed="inversa"
                        aria-label="Funciones inversas e hiperbólicas"
                        data-test="inversa"
                        @click="inversa = !inversa"
                    >
                        2nd
                    </button>
                    <button
                        type="button"
                        class="ml-auto flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"
                        aria-label="Copiar el resultado"
                        @click="copiar"
                    >
                        <Copy class="size-4" />
                    </button>
                </div>
                <p
                    class="numeros mt-1 min-h-4 truncate text-right text-xs text-muted-foreground"
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
                    class="numeros w-full bg-transparent text-right text-2xl outline-none placeholder:text-muted-foreground/60"
                    :placeholder="resultado === null ? '0' : ''"
                    data-test="expresion"
                    @keydown="alTeclear"
                />
                <output
                    :class="
                        cn(
                            'numeros mt-1 block min-h-10 text-right font-semibold break-all',
                            error ? 'text-base text-destructive' : 'text-3xl',
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
                        class="text-xl font-normal text-muted-foreground"
                        >= {{ vistaPrevia }}</span
                    >
                </output>
            </div>

            <div class="mb-2 grid grid-cols-5 gap-1.5">
                <button
                    v-for="t in teclasCientificas"
                    :key="t.etiqueta"
                    type="button"
                    :class="
                        cn(
                            'h-11 rounded-lg border border-border/60 transition-colors select-none active:scale-[0.97]',
                            estilos[t.tipo],
                        )
                    "
                    :aria-label="t.aria ?? t.etiqueta"
                    :data-tecla="t.etiqueta"
                    @click="tocar(t)"
                >
                    {{ t.etiqueta }}
                </button>
            </div>

            <div class="grid grid-cols-4 gap-1.5">
                <button
                    v-for="t in teclasBasicas"
                    :key="t.etiqueta"
                    type="button"
                    :class="
                        cn(
                            'numeros flex h-12 items-center justify-center rounded-xl border border-border/60 shadow-xs transition-colors select-none active:scale-[0.97] sm:h-14',
                            estilos[t.tipo],
                        )
                    "
                    :aria-label="t.aria ?? t.etiqueta"
                    :data-tecla="t.etiqueta"
                    @click="tocar(t)"
                >
                    <Delete v-if="t.etiqueta === '⌫'" class="size-5" />
                    <template v-else>{{ t.etiqueta }}</template>
                </button>
            </div>
            <p class="mt-3 text-center text-xs text-muted-foreground">
                Para logaritmos en otra base usá ; → log(8;2) = 3. Los
                paréntesis que falten se cierran solos.
            </p>
        </section>

        <section
            class="rounded-2xl border border-border bg-card p-4"
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
                class="max-h-[32rem] divide-y divide-border overflow-y-auto"
            >
                <li v-for="c in cinta" :key="c.id">
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
