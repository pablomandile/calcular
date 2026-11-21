import type { Dec } from './numero';
import { D } from './numero';

/**
 * Porcentajes. Acá los porcentajes van como "número de por ciento"
 * (21 = 21 %), porque así los escribe la gente en estos cálculos.
 */
const CIEN = new D(100);

/** ¿Cuánto es el p % de x?  →  x · p / 100 */
export function porcentajeDe(p: Dec, x: Dec): Dec {
    return x.times(p).div(CIEN);
}

/** ¿Qué porcentaje es x de y?  →  x / y · 100 */
export function quePorcentajeEs(x: Dec, y: Dec): Dec {
    if (y.isZero()) {
        throw new Error('El total no puede ser cero');
    }

    return x.div(y).times(CIEN);
}

/** Variación porcentual de a hacia b  →  (b − a) / a · 100 */
export function variacion(a: Dec, b: Dec): Dec {
    if (a.isZero()) {
        throw new Error('El valor inicial no puede ser cero');
    }

    return b.minus(a).div(a.abs()).times(CIEN);
}

/** x aumentado un p %  →  x · (1 + p/100) */
export function aumentar(x: Dec, p: Dec): Dec {
    return x.times(CIEN.plus(p)).div(CIEN);
}

/** x con un descuento del p %  →  x · (1 − p/100) */
export function descontar(x: Dec, p: Dec): Dec {
    return x.times(CIEN.minus(p)).div(CIEN);
}

/**
 * Valor antes de un aumento o descuento del p %.
 * Ejemplo: precio sin IVA de $ 1.210 con IVA 21 % → 1.210 / 1,21 = 1.000.
 */
export function valorOriginal(
    final: Dec,
    p: Dec,
    tipo: 'aumento' | 'descuento',
): Dec {
    const factor =
        tipo === 'aumento' ? CIEN.plus(p).div(CIEN) : CIEN.minus(p).div(CIEN);

    if (factor.isZero()) {
        throw new Error('Con un descuento del 100 % no hay valor original');
    }

    return final.div(factor);
}
