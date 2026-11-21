import Decimal from 'decimal.js';

/**
 * Decimal propio de CalculAR: 40 dígitos significativos y redondeo "half up"
 * (el de la escuela). Todo cálculo con plata o tasas pasa por acá, nunca por
 * `number`: 0,1 + 0,2 tiene que dar 0,3.
 */
export const D = Decimal.clone({
    precision: 40,
    rounding: Decimal.ROUND_HALF_UP,
    toExpNeg: -40,
    toExpPos: 40,
});
export type Dec = InstanceType<typeof D>;

const MILES = /^-?\d{1,3}(\.\d{3})+$/;

/**
 * Lee un número escrito "a la argentina": coma decimal y punto de miles.
 * También acepta punto decimal si no hay ambigüedad.
 *
 *   "1.234,56" → 1234.56     "1234,5" → 1234.5     "1.234" → 1234
 *   "1.5"      → 1.5         "-3"     → -3          ""      → null
 */
export function parsearNumero(texto: string | null | undefined): Dec | null {
    if (texto === null || texto === undefined) {
        return null;
    }

    let t = String(texto)
        .trim()
        .replace(/\s/g, '')
        .replace(/\$|%/g, '')
        .replace(/−/g, '-');

    if (t === '' || t === '-' || t === ',' || t === '.') {
        return null;
    }

    if (t.includes(',')) {
        t = t.replace(/\./g, '').replace(',', '.');
    } else if (MILES.test(t)) {
        t = t.replace(/\./g, '');
    }

    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) {
        return null;
    }

    return new D(t);
}

/** Agrega el punto de miles a la parte entera ("1234567" → "1.234.567"). */
function agruparMiles(entero: string): string {
    return entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export type OpcionesFormato = {
    /** Máximo de decimales a mostrar (se recorta, redondeando). */
    maxDecimales?: number;
    /** Mínimo de decimales (se completa con ceros). */
    minDecimales?: number;
};

/**
 * Formatea un número en formato argentino: "1.234.567,89".
 * Números enormes o diminutos pasan a notación científica ("1,5 × 10¹⁸").
 */
export function formatearNumero(
    valor: Dec | number | string,
    { maxDecimales = 10, minDecimales = 0 }: OpcionesFormato = {},
): string {
    const d = valor instanceof D ? valor : new D(valor);

    if (!d.isFinite()) {
        return d.isNaN() ? 'Error' : d.isNegative() ? '−∞' : '∞';
    }

    const abs = d.abs();

    if (!abs.isZero() && (abs.gte('1e16') || abs.lt('1e-9'))) {
        return formatearCientifico(d);
    }

    const redondeado = d.toDecimalPlaces(maxDecimales);
    let [entero, decimales = ''] = redondeado.abs().toFixed().split('.');
    decimales = decimales.replace(/0+$/, '');

    while (decimales.length < minDecimales) {
        decimales += '0';
    }

    const signo = redondeado.isNegative() && !redondeado.isZero() ? '−' : '';

    return signo + agruparMiles(entero) + (decimales ? ',' + decimales : '');
}

const SUPERINDICES: Record<string, string> = {
    '-': '⁻',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
};

function formatearCientifico(d: Dec): string {
    const [mantisa, exponente] = d.toExponential(9).split('e');
    const m = new D(mantisa);
    const exp = String(Number(exponente));

    return (
        formatearNumero(m, { maxDecimales: 9 }) +
        ' × 10' +
        exp
            .split('')
            .map((c) => SUPERINDICES[c] ?? c)
            .join('')
    );
}

/** Porcentaje a partir de una fracción: 0.7959 → "79,59 %". */
export function formatearPorcentaje(
    fraccion: Dec | number | string,
    decimales = 2,
): string {
    const d = fraccion instanceof D ? fraccion : new D(fraccion);

    return (
        formatearNumero(d.times(100), {
            maxDecimales: decimales,
            minDecimales: decimales,
        }) + ' %'
    );
}

/** Pesos: "$ 1.234,50". */
export function formatearPesos(valor: Dec | number | string): string {
    const d = valor instanceof D ? valor : new D(valor);

    return '$ ' + formatearNumero(d, { maxDecimales: 2, minDecimales: 2 });
}
