import type { Dec } from './numero';
import { D } from './numero';

/**
 * Descuentos y reintegros con tope (los de bancos, billeteras, Cuenta DNI):
 * "20 % de reintegro, tope $ 6.000". El porcentaje va como FRACCIÓN
 * (0,2 = 20 %), como en tasas.ts.
 */

export type ResultadoConTope = {
    /** La compra que aprovecha el tope entero: tope / porcentaje. */
    compraMaxima: Dec;
    /** Solo si se indicó cuánto se va a gastar. */
    compra: {
        monto: Dec;
        reintegro: Dec;
        /** Lo que sale de verdad: monto − reintegro. */
        pagas: Dec;
        /** reintegro / monto: baja cuando se pasa el tope. */
        descuentoEfectivo: Dec;
        /** La parte de la compra que no tiene descuento (0 si no se pasa). */
        sinDescuento: Dec;
        llegaAlTope: boolean;
    } | null;
};

export function reintegroDe(monto: Dec, porcentaje: Dec, tope: Dec): Dec {
    return D.min(monto.times(porcentaje), tope);
}

export function descuentoConTope(
    porcentaje: Dec,
    tope: Dec,
    monto: Dec | null = null,
): ResultadoConTope {
    if (porcentaje.lte(0) || porcentaje.gt(1)) {
        throw new Error('El porcentaje tiene que estar entre 0 % y 100 %.');
    }

    if (tope.lte(0)) {
        throw new Error('El tope tiene que ser mayor a cero.');
    }

    if (monto !== null && monto.lte(0)) {
        throw new Error('El monto de la compra tiene que ser mayor a cero.');
    }

    const compraMaxima = tope.div(porcentaje);

    if (monto === null) {
        return { compraMaxima, compra: null };
    }

    const reintegro = reintegroDe(monto, porcentaje, tope);

    return {
        compraMaxima,
        compra: {
            monto,
            reintegro,
            pagas: monto.minus(reintegro),
            descuentoEfectivo: reintegro.div(monto),
            sinDescuento: D.max(monto.minus(compraMaxima), 0),
            llegaAlTope: monto.gte(compraMaxima),
        },
    };
}
