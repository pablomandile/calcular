import type { Dec } from './numero';
import { D } from './numero';

/**
 * Tasas. Todas las funciones reciben y devuelven FRACCIONES (0,6 = 60 %);
 * la conversión desde y hacia porcentaje es cosa de la vista.
 *
 * n = cantidad de capitalizaciones por año.
 */
export type Capitalizacion = {
    n: number;
    nombre: string;
    periodo: string;
};

export const CAPITALIZACIONES: Capitalizacion[] = [
    { n: 365, nombre: 'Diaria', periodo: 'diaria' },
    { n: 12, nombre: 'Mensual', periodo: 'mensual' },
    { n: 4, nombre: 'Trimestral', periodo: 'trimestral' },
    { n: 2, nombre: 'Semestral', periodo: 'semestral' },
    { n: 1, nombre: 'Anual', periodo: 'anual' },
];

export function nombreCapitalizacion(n: number): string {
    return CAPITALIZACIONES.find((c) => c.n === n)?.nombre ?? `${n} por año`;
}

/** TEA = (1 + TNA/n)^n − 1 */
export function teaDesdeTna(tna: Dec, n: number): Dec {
    return new D(1).plus(tna.div(n)).pow(n).minus(1);
}

/** TNA = n · ((1 + TEA)^(1/n) − 1) */
export function tnaDesdeTea(tea: Dec, n: number): Dec {
    if (tea.lte(-1)) {
        throw new Error('La TEA tiene que ser mayor a −100 %');
    }

    return new D(1).plus(tea).pow(new D(1).div(n)).minus(1).times(n);
}

/** Tasa de cada período de capitalización: TNA / n. */
export function tasaPeriodica(tna: Dec, n: number): Dec {
    return tna.div(n);
}

/** Tasa efectiva mensual equivalente a una TEA: (1 + TEA)^(1/12) − 1. */
export function temDesdeTea(tea: Dec): Dec {
    return new D(1).plus(tea).pow(new D(1).div(12)).minus(1);
}

/**
 * TEA de renovar siempre un plazo de `dias` días a una TNA:
 * (1 + TNA · días/365)^(365/días) − 1
 */
export function teaPorRenovacion(tna: Dec, dias: number): Dec {
    return new D(1)
        .plus(tna.times(dias).div(365))
        .pow(new D(365).div(dias))
        .minus(1);
}

export type ConversionTasa = {
    tna: Dec;
    tea: Dec;
    tasaPeriodica: Dec;
    tem: Dec;
};

export function convertirTasa(
    sentido: 'tna-a-tea' | 'tea-a-tna',
    tasa: Dec,
    n: number,
): ConversionTasa {
    const tna = sentido === 'tna-a-tea' ? tasa : tnaDesdeTea(tasa, n);
    const tea = sentido === 'tna-a-tea' ? teaDesdeTna(tasa, n) : tasa;

    return {
        tna,
        tea,
        tasaPeriodica: tasaPeriodica(tna, n),
        tem: temDesdeTea(tea),
    };
}
