import type { BigNumber, MathJsInstance } from 'mathjs';
import { all, create } from 'mathjs';
import type { Dec } from './numero';
import { D } from './numero';

/**
 * Calculadora científica. La expresión se escribe con los símbolos que ve la
 * persona (×, ÷, −, π, √, coma decimal, ";" para separar argumentos) y acá se
 * traduce a la sintaxis de mathjs, que evalúa con BigNumber de 64 dígitos.
 */
export type ModoAngulo = 'DEG' | 'RAD';

const math: MathJsInstance = create(all, {
    number: 'BigNumber',
    precision: 64,
    predictable: true,
});

// Recomendación de seguridad de mathjs: sin funciones que evalúan código.
const evaluar = math.evaluate.bind(math);
math.import(
    {
        import: bloqueada,
        createUnit: bloqueada,
        evaluate: bloqueada,
        parse: bloqueada,
        simplify: bloqueada,
        derivative: bloqueada,
        resolve: bloqueada,
    },
    { override: true },
);

function bloqueada(): never {
    throw new Error('Función no disponible');
}

type Valor = BigNumber;

const PI = math.pi as unknown as Valor;
const A_RAD = math.divide(PI, math.bignumber(180)) as Valor;
const A_GRADOS = math.divide(math.bignumber(180), PI) as Valor;

/** sin/cos/tan exactos en múltiplos de 90° (sin(180°) = 0, no 1e−64). */
function trigExactaEnGrados(
    fn: 'sin' | 'cos' | 'tan',
    grados: Valor,
): Valor | null {
    const g = new D(grados.toString());

    if (!g.mod(90).isZero()) {
        return null;
    }

    const cuarto = g.div(90).mod(4).plus(4).mod(4).toNumber();
    const tabla = {
        sin: [0, 1, 0, -1],
        cos: [1, 0, -1, 0],
        tan: [0, NaN, 0, NaN],
    };
    const valor = tabla[fn][cuarto];

    if (Number.isNaN(valor)) {
        throw new Error('La tangente no está definida en ese ángulo');
    }

    return math.bignumber(valor);
}

function crearScope(modo: ModoAngulo, ans: string): Map<string, unknown> {
    const scope = new Map<string, unknown>();
    const grados = modo === 'DEG';

    for (const fn of ['sin', 'cos', 'tan'] as const) {
        scope.set(fn, (x: Valor) => {
            if (!grados) {
                return math[fn](x);
            }

            return (
                trigExactaEnGrados(fn, x) ??
                math[fn](math.multiply(x, A_RAD) as Valor)
            );
        });
    }

    for (const fn of ['asin', 'acos', 'atan'] as const) {
        scope.set(fn, (x: Valor) => {
            const inversa = math[fn] as (v: Valor) => Valor;
            const r = inversa(x);

            return grados ? math.multiply(r, A_GRADOS) : r;
        });
    }

    scope.set('ln', (x: Valor) => math.log(x));
    scope.set('log', (x: Valor, base?: Valor) =>
        base === undefined ? math.log10(x) : math.log(x, base),
    );
    scope.set('Ans', math.bignumber(ans));

    return scope;
}

/** Cierra los paréntesis que quedaron abiertos: "sin(30" → "sin(30)". */
export function cerrarParentesis(expresion: string): string {
    const abiertos =
        (expresion.match(/\(/g) ?? []).length -
        (expresion.match(/\)/g) ?? []).length;

    return abiertos > 0 ? expresion + ')'.repeat(abiertos) : expresion;
}

/** Traduce la expresión visible a sintaxis de mathjs. */
export function traducir(expresion: string): string {
    let t = expresion
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/π/g, 'pi')
        .replace(/√/g, 'sqrt')
        .replace(/∛/g, 'cbrt')
        .replace(/%/g, '/100')
        .replace(/,/g, '.')
        .replace(/;/g, ',');

    return cerrarParentesis(t);
}

export type ResultadoCientifica =
    | { ok: true; valor: Dec }
    | { ok: false; error: string };

export function calcular(
    expresion: string,
    modo: ModoAngulo = 'DEG',
    ans = '0',
): ResultadoCientifica {
    if (expresion.trim() === '') {
        return { ok: false, error: 'Escribí una expresión' };
    }

    let r: unknown;

    try {
        r = evaluar(traducir(expresion), crearScope(modo, ans));
    } catch (e) {
        return { ok: false, error: traducirError((e as Error).message) };
    }

    if (math.isBigNumber(r) || typeof r === 'number') {
        const valor = new D(r.toString());

        if (valor.isNaN()) {
            return { ok: false, error: 'El resultado no es un número real' };
        }

        if (!valor.isFinite()) {
            return { ok: false, error: 'El resultado es infinito' };
        }

        // 15 cifras significativas: borra el ruido de las funciones
        // trascendentes (0,49999…9 → 0,5) sin perder precisión útil.
        return { ok: true, valor: valor.toSignificantDigits(15) };
    }

    return { ok: false, error: 'El resultado no es un número' };
}

function traducirError(mensaje: string): string {
    if (/Integer BigNumber expected|integer/i.test(mensaje)) {
        return 'El factorial necesita un número entero no negativo';
    }

    if (/tangente|no disponible/i.test(mensaje)) {
        return mensaje;
    }

    if (/Unexpected end|Parenthesis|Value expected/i.test(mensaje)) {
        return 'La expresión está incompleta';
    }

    if (/Undefined symbol|Undefined function/i.test(mensaje)) {
        return 'Hay algo en la expresión que no se reconoce';
    }

    return 'Revisá la expresión';
}
