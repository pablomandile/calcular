import type { Dec } from './numero';
import { D } from './numero';
import { teaPorRenovacion } from './tasas';

/**
 * Plazo fijo tradicional en pesos. Los bancos argentinos calculan interés
 * simple sobre base 365: interés = capital · TNA · días / 365.
 */
export type ResultadoPlazoFijo = {
    interes: Dec;
    montoFinal: Dec;
    /** Tasa efectiva del período (TNA · días / 365). */
    tasaPeriodo: Dec;
    /** TEA si se renueva siempre el capital más los intereses. */
    teaRenovando: Dec;
};

export function calcularPlazoFijo(
    capital: Dec,
    tna: Dec,
    dias: number,
): ResultadoPlazoFijo {
    if (capital.lte(0)) {
        throw new Error('El capital tiene que ser mayor a cero');
    }

    if (!Number.isInteger(dias) || dias < 1) {
        throw new Error('El plazo tiene que ser de al menos un día');
    }

    const tasaPeriodo = tna.times(dias).div(365);
    const interes = capital.times(tasaPeriodo);

    return {
        interes,
        montoFinal: capital.plus(interes),
        tasaPeriodo,
        teaRenovando: teaPorRenovacion(tna, dias),
    };
}

export type Renovacion = {
    numero: number;
    capitalInicial: Dec;
    interes: Dec;
    montoFinal: Dec;
};

/** Renovar `veces` veces el mismo plazo reinvirtiendo los intereses. */
export function renovaciones(
    capital: Dec,
    tna: Dec,
    dias: number,
    veces: number,
): Renovacion[] {
    const filas: Renovacion[] = [];
    let saldo = new D(capital);

    for (let i = 1; i <= veces; i++) {
        const { interes, montoFinal } = calcularPlazoFijo(saldo, tna, dias);
        filas.push({ numero: i, capitalInicial: saldo, interes, montoFinal });
        saldo = montoFinal;
    }

    return filas;
}
