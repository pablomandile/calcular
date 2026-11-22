import type { Dec } from './numero';
import { parsearNumero } from './numero';

/**
 * Lectura de campos de formulario con mensajes para la persona. El `nombre`
 * va con artículo: "el capital", "la TNA".
 */
export function numeroRequerido(texto: string, nombre: string): Dec {
    if (texto.trim() === '') {
        throw new Error(`Ingresá ${nombre}.`);
    }

    const n = parsearNumero(texto);

    if (!n) {
        throw new Error(`Revisá ${nombre}: no es un número válido.`);
    }

    return n;
}

export function numeroOpcional(texto: string, nombre: string): Dec | null {
    return texto.trim() === '' ? null : numeroRequerido(texto, nombre);
}

export function enteroRequerido(
    texto: string,
    nombre: string,
    { min = -Infinity, max = Infinity } = {},
): number {
    const n = numeroRequerido(texto, nombre);

    if (!n.isInteger()) {
        throw new Error(`${mayuscula(nombre)} tiene que ser un número entero.`);
    }

    const v = n.toNumber();

    if (v < min || v > max) {
        throw new Error(
            Number.isFinite(max)
                ? `${mayuscula(nombre)} tiene que estar entre ${min} y ${max}.`
                : `${mayuscula(nombre)} tiene que ser al menos ${min}.`,
        );
    }

    return v;
}

/** "la TNA" → "La TNA" */
function mayuscula(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}
