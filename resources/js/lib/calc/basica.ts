import type { Dec } from './numero';
import { D, formatearNumero } from './numero';

/**
 * Motor de la calculadora normal. Es una máquina de estados pura: cada tecla
 * recibe el estado y devuelve uno nuevo, sin tocar nada de afuera. La vista
 * solo dibuja `estado` y guarda en el historial lo que devuelve `igual`.
 *
 * Respeta la precedencia (2 + 3 × 4 = 14), como las calculadoras de los
 * celulares. Los números se guardan como texto canónico ("1234.5") y se
 * operan con decimal.js.
 */
export type Operador = '+' | '−' | '×' | '÷';

export type EstadoBasica = {
    /** Operandos y operadores ya cerrados: ["12", "+", "3", "×"]. */
    tokens: string[];
    /** Número que se está escribiendo, canónico con punto ("12.5"). */
    entrada: string;
    /** Expresión que dio el último resultado, para mostrar arriba. */
    expresionPrevia: string | null;
    /** true justo después de "=": un dígito arranca una cuenta nueva. */
    recienCalculado: boolean;
    /**
     * true después de %, M+, M− o MR: el próximo dígito reemplaza el número
     * en pantalla pero la cuenta en curso sigue.
     */
    sobrescribir: boolean;
    error: string | null;
    memoria: string;
};

export type RegistroBasica = {
    expresion: string;
    resultado: string;
};

const MAX_DIGITOS = 16;
const OPERADORES: Operador[] = ['+', '−', '×', '÷'];

export function estadoInicial(memoria = '0'): EstadoBasica {
    return {
        tokens: [],
        entrada: '0',
        expresionPrevia: null,
        recienCalculado: false,
        sobrescribir: false,
        error: null,
        memoria,
    };
}

function esOperador(t: string | undefined): t is Operador {
    return OPERADORES.includes(t as Operador);
}

function cantidadDigitos(entrada: string): number {
    return entrada.replace(/[-.]/g, '').length;
}

export function digito(e: EstadoBasica, d: string): EstadoBasica {
    if (e.error || e.recienCalculado) {
        e = { ...estadoInicial(e.memoria) };
    }

    if (e.sobrescribir) {
        e = { ...e, entrada: '0', sobrescribir: false };
    }

    if (cantidadDigitos(e.entrada) >= MAX_DIGITOS) {
        return e;
    }

    let entrada: string;

    if (e.entrada === '0') {
        entrada = d;
    } else if (e.entrada === '-0') {
        entrada = '-' + d;
    } else {
        entrada = e.entrada + d;
    }

    return { ...e, entrada };
}

export function coma(e: EstadoBasica): EstadoBasica {
    if (e.error || e.recienCalculado) {
        e = { ...estadoInicial(e.memoria) };
    }

    if (e.sobrescribir || e.entrada === '') {
        return { ...e, entrada: '0.', sobrescribir: false };
    }

    if (e.entrada.includes('.')) {
        return e;
    }

    return { ...e, entrada: e.entrada + '.' };
}

/**
 * Hay una entrada "viva" si el último token es un operador o no hay tokens:
 * es decir, si `entrada` es el operando que sigue. Después de un operador,
 * `entrada` vale "" hasta que se tipea algo.
 */
export function operador(e: EstadoBasica, op: Operador): EstadoBasica {
    if (e.error) {
        return e;
    }

    if (e.recienCalculado) {
        return {
            ...e,
            tokens: [normalizar(e.entrada), op],
            entrada: '',
            recienCalculado: false,
            sobrescribir: false,
            expresionPrevia: null,
        };
    }

    if (e.entrada === '' && esOperador(e.tokens.at(-1))) {
        return { ...e, tokens: [...e.tokens.slice(0, -1), op] };
    }

    return {
        ...e,
        tokens: [...e.tokens, normalizar(e.entrada), op],
        entrada: '',
        sobrescribir: false,
        expresionPrevia: null,
    };
}

function normalizar(entrada: string): string {
    if (entrada === '' || entrada === '-' || entrada === '.') {
        return '0';
    }

    return new D(entrada).toString();
}

/** Evalúa tokens respetando la precedencia de × y ÷ sobre + y −. */
export function evaluar(tokens: string[]): Dec {
    if (tokens.length === 0) {
        return new D(0);
    }

    // Primera pasada: × y ÷.
    const sumandos: (Dec | Operador)[] = [new D(tokens[0])];

    for (let i = 1; i < tokens.length; i += 2) {
        const op = tokens[i] as Operador;
        const valor = new D(tokens[i + 1]);

        if (op === '×' || op === '÷') {
            const anterior = sumandos.pop() as Dec;

            if (op === '÷' && valor.isZero()) {
                throw new Error('No se puede dividir por cero');
            }

            sumandos.push(
                op === '×' ? anterior.times(valor) : anterior.div(valor),
            );
        } else {
            sumandos.push(op, valor);
        }
    }

    // Segunda pasada: + y −.
    let total = sumandos[0] as Dec;

    for (let i = 1; i < sumandos.length; i += 2) {
        const op = sumandos[i] as Operador;
        const valor = sumandos[i + 1] as Dec;
        total = op === '+' ? total.plus(valor) : total.minus(valor);
    }

    return total;
}

/** Texto para mostrar: "12 + 3,5 ×". */
export function expresionVisible(tokens: string[], entrada = ''): string {
    const partes = tokens.map((t) =>
        esOperador(t) ? t : formatearNumero(t, { maxDecimales: 12 }),
    );

    if (entrada !== '') {
        partes.push(entradaVisible(entrada));
    }

    return partes.join(' ');
}

/** La entrada tal cual se tipea, en formato argentino ("1.234,"). */
export function entradaVisible(entrada: string): string {
    if (entrada === '') {
        return '';
    }

    const negativo = entrada.startsWith('-');
    const [entero, decimales] = entrada.replace('-', '').split('.');
    const conMiles = (entero || '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return (
        (negativo ? '−' : '') +
        conMiles +
        (decimales !== undefined ? ',' + decimales : '')
    );
}

export function igual(e: EstadoBasica): {
    estado: EstadoBasica;
    registro: RegistroBasica | null;
} {
    if (e.error || e.recienCalculado || e.tokens.length === 0) {
        return { estado: e, registro: null };
    }

    let tokens = [...e.tokens];

    if (e.entrada === '') {
        tokens = tokens.slice(0, -1);
    } else {
        tokens.push(normalizar(e.entrada));
    }

    const expresion = expresionVisible(tokens);

    try {
        const resultado = evaluar(tokens);

        return {
            estado: {
                ...e,
                tokens: [],
                entrada: resultado.toString(),
                expresionPrevia: expresion + ' =',
                recienCalculado: true,
                sobrescribir: false,
            },
            registro: {
                expresion,
                resultado: formatearNumero(resultado, { maxDecimales: 12 }),
            },
        };
    } catch (error) {
        return {
            estado: {
                ...e,
                tokens: [],
                entrada: '0',
                expresionPrevia: expresion + ' =',
                error: (error as Error).message,
            },
            registro: null,
        };
    }
}

/**
 * Porcentaje, como en las calculadoras de escritorio:
 *   200 + 10 %  → 200 + 20   (10 % de lo acumulado)
 *   200 × 10 %  → 200 × 0,1
 *   50 %        → 0,5
 */
export function porcentaje(e: EstadoBasica): EstadoBasica {
    if (e.error || e.entrada === '') {
        return e;
    }

    const valor = new D(normalizar(e.entrada));
    const ultimo = e.tokens.at(-1);
    let nuevo: Dec;

    if ((ultimo === '+' || ultimo === '−') && !e.recienCalculado) {
        const base = evaluar(e.tokens.slice(0, -1));
        nuevo = base.times(valor).div(100);
    } else {
        nuevo = valor.div(100);
    }

    return {
        ...e,
        entrada: nuevo.toString(),
        recienCalculado: false,
        sobrescribir: true,
    };
}

export function cambiarSigno(e: EstadoBasica): EstadoBasica {
    if (e.error) {
        return e;
    }

    const entrada = e.entrada === '' ? '0' : e.entrada;

    return {
        ...e,
        entrada: entrada.startsWith('-') ? entrada.slice(1) : '-' + entrada,
    };
}

/** ⌫: borra el último dígito de la entrada. */
export function borrar(e: EstadoBasica): EstadoBasica {
    if (e.error || e.recienCalculado) {
        return estadoInicial(e.memoria);
    }

    if (e.entrada === '' && esOperador(e.tokens.at(-1))) {
        // Sin entrada: se borra el operador y se recupera el número anterior.
        const tokens = e.tokens.slice(0, -2);

        return { ...e, tokens, entrada: e.tokens.at(-2) ?? '0' };
    }

    const entrada = e.entrada.slice(0, -1);

    return {
        ...e,
        entrada: entrada === '' || entrada === '-' ? '0' : entrada,
    };
}

/** CE: borra solo el número que se está escribiendo. */
export function limpiarEntrada(e: EstadoBasica): EstadoBasica {
    if (e.error || e.recienCalculado) {
        return estadoInicial(e.memoria);
    }

    return { ...e, entrada: '0' };
}

/** C: borra todo menos la memoria. */
export function limpiarTodo(e: EstadoBasica): EstadoBasica {
    return estadoInicial(e.memoria);
}

/** Valor que se ve en pantalla en este momento. */
export function valorActual(e: EstadoBasica): Dec {
    if (e.entrada !== '') {
        return new D(normalizar(e.entrada));
    }

    return evaluar(e.tokens.slice(0, -1));
}

export function memoriaSumar(e: EstadoBasica): EstadoBasica {
    return {
        ...e,
        memoria: new D(e.memoria).plus(valorActual(e)).toString(),
        sobrescribir: !e.recienCalculado,
    };
}

export function memoriaRestar(e: EstadoBasica): EstadoBasica {
    return {
        ...e,
        memoria: new D(e.memoria).minus(valorActual(e)).toString(),
        sobrescribir: !e.recienCalculado,
    };
}

export function memoriaRecuperar(e: EstadoBasica): EstadoBasica {
    if (e.recienCalculado || e.error) {
        e = { ...estadoInicial(e.memoria) };
    }

    return { ...e, entrada: e.memoria, sobrescribir: true };
}

export function memoriaLimpiar(e: EstadoBasica): EstadoBasica {
    return { ...e, memoria: '0' };
}

/** Número principal de la pantalla, ya formateado. */
export function pantalla(e: EstadoBasica): string {
    if (e.error) {
        return e.error;
    }

    if (e.entrada === '') {
        return formatearNumero(evaluar(e.tokens.slice(0, -1)), {
            maxDecimales: 12,
        });
    }

    if (e.recienCalculado || e.sobrescribir) {
        return formatearNumero(e.entrada, { maxDecimales: 12 });
    }

    return entradaVisible(e.entrada);
}
