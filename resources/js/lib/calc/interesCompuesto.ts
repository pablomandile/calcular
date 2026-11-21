import type { Dec } from './numero';
import { D } from './numero';

/**
 * Interés compuesto con aportes periódicos.
 *
 * Se capitaliza n veces por año a la tasa TNA/n y, al final de cada período,
 * se suma el aporte (si hay). Fórmula cerrada equivalente:
 *
 *   M = C·(1+i)^N + A·((1+i)^N − 1)/i     con i = TNA/n y N = n·años
 */
export type FilaAnual = {
    anio: number;
    aportesAcumulados: Dec;
    interesesAcumulados: Dec;
    saldo: Dec;
};

export type ResultadoInteresCompuesto = {
    montoFinal: Dec;
    totalAportado: Dec;
    interesesGanados: Dec;
    porAnio: FilaAnual[];
};

export type EntradaInteresCompuesto = {
    capital: Dec;
    tna: Dec;
    /** Capitalizaciones por año. */
    n: number;
    anios: number;
    /** Aporte al final de cada período de capitalización. */
    aporte?: Dec;
};

export const MAX_ANIOS = 100;

export function calcularInteresCompuesto({
    capital,
    tna,
    n,
    anios,
    aporte = new D(0),
}: EntradaInteresCompuesto): ResultadoInteresCompuesto {
    if (capital.lt(0) || aporte.lt(0)) {
        throw new Error('El capital y los aportes no pueden ser negativos');
    }

    if (!Number.isInteger(anios) || anios < 1 || anios > MAX_ANIOS) {
        throw new Error(`El plazo tiene que ser de 1 a ${MAX_ANIOS} años`);
    }

    const i = tna.div(n);
    let saldo = new D(capital);
    let aportes = new D(capital);
    const porAnio: FilaAnual[] = [];

    for (let anio = 1; anio <= anios; anio++) {
        for (let p = 0; p < n; p++) {
            saldo = saldo.times(i.plus(1)).plus(aporte);
            aportes = aportes.plus(aporte);
        }

        porAnio.push({
            anio,
            aportesAcumulados: aportes,
            interesesAcumulados: saldo.minus(aportes),
            saldo,
        });
    }

    return {
        montoFinal: saldo,
        totalAportado: aportes,
        interesesGanados: saldo.minus(aportes),
        porAnio,
    };
}

/** Fórmula cerrada, para verificar la simulación período a período. */
export function montoFormulaCerrada({
    capital,
    tna,
    n,
    anios,
    aporte = new D(0),
}: EntradaInteresCompuesto): Dec {
    const i = tna.div(n);
    const N = n * anios;
    const factor = i.plus(1).pow(N);

    if (i.isZero()) {
        return capital.plus(aporte.times(N));
    }

    return capital.times(factor).plus(aporte.times(factor.minus(1)).div(i));
}
