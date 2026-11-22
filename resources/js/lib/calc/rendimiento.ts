import type { Dec } from './numero';
import { D } from './numero';

/**
 * Cuentas remuneradas y billeteras (Mercado Pago, Ualá, Naranja X, bancos):
 * pagan intereses todos los días sobre el saldo, y esos intereses se suman al
 * saldo y al otro día rinden también. Tasas como FRACCIONES (0,188 = 18,8 %).
 */

export type TipoTasa = 'tna' | 'tea';

/** Tasa de un día: TNA / 365, o la raíz 365 de la TEA. */
export function tasaDiaria(tasa: Dec, tipo: TipoTasa): Dec {
    if (tasa.lte(-1)) {
        throw new Error('La tasa tiene que ser mayor a −100 %.');
    }

    return tipo === 'tna'
        ? tasa.div(365)
        : new D(1).plus(tasa).pow(new D(1).div(365)).minus(1);
}

/**
 * Lo que se gana en `dias` días, con los intereses acreditados cada día. Si
 * hay tope, rinde solo el saldo hasta el tope: lo que lo supera (incluidos los
 * intereses que se van sumando) no gana nada.
 */
export function gananciaEn(
    saldo: Dec,
    diaria: Dec,
    dias: number,
    tope: Dec | null = null,
): Dec {
    if (tope === null) {
        return saldo.times(new D(1).plus(diaria).pow(dias).minus(1));
    }

    let actual = saldo;

    for (let i = 0; i < dias; i++) {
        actual = actual.plus(D.min(actual, tope).times(diaria));
    }

    return actual.minus(saldo);
}

export type ResultadoRendimiento = {
    diaria: Dec;
    porDia: Dec;
    porSemana: Dec;
    /** 30 días. */
    porMes: Dec;
    /** 365 días, sin tocar la plata. */
    porAnio: Dec;
    tna: Dec;
    tea: Dec;
    /** Lo que rinde en 30 días, como porcentaje del saldo. */
    mensual: Dec;
    /** Parte del saldo que supera el tope y no rinde (0 sin tope). */
    noRinde: Dec;
};

export function rendimientoCuenta(
    saldo: Dec,
    tasa: Dec,
    tipo: TipoTasa,
    tope: Dec | null = null,
): ResultadoRendimiento {
    if (saldo.lte(0)) {
        throw new Error('El saldo tiene que ser mayor a cero.');
    }

    if (tope !== null && tope.lte(0)) {
        throw new Error('El tope tiene que ser mayor a cero.');
    }

    const diaria = tasaDiaria(tasa, tipo);
    const porMes = gananciaEn(saldo, diaria, 30, tope);

    return {
        diaria,
        porDia: gananciaEn(saldo, diaria, 1, tope),
        porSemana: gananciaEn(saldo, diaria, 7, tope),
        porMes,
        porAnio: gananciaEn(saldo, diaria, 365, tope),
        tna: diaria.times(365),
        tea: new D(1).plus(diaria).pow(365).minus(1),
        mensual: porMes.div(saldo),
        noRinde: tope === null ? new D(0) : D.max(saldo.minus(tope), 0),
    };
}

export type ContraInflacion = {
    /** (1 + rendimiento) / (1 + inflación) − 1, en el mismo mes. */
    real: Dec;
    /** Poder de compra que se gana (o se pierde, si es negativo) en un mes. */
    enPesos: Dec;
    leGana: boolean;
};

/** El rendimiento de 30 días contra la inflación de un mes. */
export function contraInflacion(
    saldo: Dec,
    rendimientoMensual: Dec,
    inflacionMensual: Dec,
): ContraInflacion {
    const factor = new D(1).plus(rendimientoMensual);
    const inflacion = new D(1).plus(inflacionMensual);
    const real = factor.div(inflacion).minus(1);

    return {
        real,
        enPesos: saldo.times(factor).div(inflacion).minus(saldo),
        leGana: real.gt(0),
    };
}
