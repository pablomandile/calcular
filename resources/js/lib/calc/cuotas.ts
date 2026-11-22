import type { Dec } from './numero';
import { D } from './numero';

/**
 * Compras en cuotas. Tasas como FRACCIONES (0,05 = 5 %), como en tasas.ts.
 *
 * El tiempo se cuenta en días y se pasa a meses de 30 días: una cuota a los
 * 30 días se descuenta un mes; una semanal, 7/30 de mes. La tasa mensual se
 * lleva a TNA (× 12) y a TEA ((1 + r)^12 − 1), como hacen los bancos.
 */

/** Cuántos días hay entre cuota y cuota. */
export type Frecuencia = 7 | 15 | 30;

export type Plan = {
    cuotas: number;
    valorCuota: Dec;
    /** Días hasta la primera cuota (0 = se paga en el momento). */
    primeraDias: number;
    frecuenciaDias: Frecuencia;
};

const UNO = new D(1);

function validarPlan({ cuotas, valorCuota, primeraDias }: Plan): void {
    if (!Number.isInteger(cuotas) || cuotas < 1 || cuotas > 360) {
        throw new Error('La cantidad de cuotas tiene que estar entre 1 y 360.');
    }

    if (valorCuota.lte(0)) {
        throw new Error('El valor de la cuota tiene que ser mayor a cero.');
    }

    if (
        !Number.isInteger(primeraDias) ||
        primeraDias < 0 ||
        primeraDias > 365
    ) {
        throw new Error(
            'Los días hasta la primera cuota tienen que estar entre 0 y 365.',
        );
    }
}

/**
 * Valor hoy de las cuotas descontadas a una tasa mensual:
 * Σ cuota / (1 + r)^(días / 30).
 *
 * Como las cuotas son iguales y equiespaciadas, alcanzan dos potencias: la de
 * la primera cuota y la del intervalo entre cuotas.
 */
export function valorPresenteCuotas(plan: Plan, tasaMensual: Dec): Dec {
    const base = UNO.plus(tasaMensual);
    let descuento = base.pow(new D(plan.primeraDias).div(30));
    const paso = base.pow(new D(plan.frecuenciaDias).div(30));
    let suma = new D(0);

    for (let k = 0; k < plan.cuotas; k++) {
        suma = suma.plus(plan.valorCuota.div(descuento));
        descuento = descuento.times(paso);
    }

    return suma;
}

/**
 * La tasa mensual que hace que las cuotas valgan hoy lo mismo que el monto
 * financiado. Bisección: el valor presente baja cuando la tasa sube, así que
 * hay una sola solución. Puede ser negativa si se paga menos que el monto
 * (un descuento disfrazado de cuotas).
 */
export function tasaImplicitaMensual(monto: Dec, plan: Plan): Dec {
    validarPlan(plan);

    if (monto.lte(0)) {
        throw new Error('El monto financiado tiene que ser mayor a cero.');
    }

    const total = plan.valorCuota.times(plan.cuotas);

    if (total.eq(monto)) {
        return new D(0);
    }

    let bajo = new D('-0.99');
    let alto = new D(1);

    // El valor presente a la tasa "alta" tiene que quedar por debajo del monto.
    while (valorPresenteCuotas(plan, alto).gt(monto)) {
        alto = alto.times(2);

        if (alto.gt(1000)) {
            throw new Error(
                'La tasa implícita es demasiado alta para calcularla.',
            );
        }
    }

    if (valorPresenteCuotas(plan, bajo).lt(monto)) {
        throw new Error('Las cuotas no alcanzan a cubrir el monto financiado.');
    }

    for (let i = 0; i < 200 && alto.minus(bajo).gt('1e-15'); i++) {
        const medio = bajo.plus(alto).div(2);

        if (valorPresenteCuotas(plan, medio).gt(monto)) {
            bajo = medio;
        } else {
            alto = medio;
        }
    }

    return bajo.plus(alto).div(2);
}

export type ResultadoInteresEnCuotas = {
    tasaMensual: Dec;
    tna: Dec;
    tea: Dec;
    totalPagado: Dec;
    /** Lo que se paga de más, en pesos. */
    recargo: Dec;
    /** Recargo sobre el monto financiado (no es una tasa anual). */
    recargoPorcentaje: Dec;
};

export function interesEnCuotas(
    monto: Dec,
    plan: Plan,
): ResultadoInteresEnCuotas {
    const tasaMensual = tasaImplicitaMensual(monto, plan);
    const totalPagado = plan.valorCuota.times(plan.cuotas);
    const recargo = totalPagado.minus(monto);

    return {
        tasaMensual,
        tna: tasaMensual.times(12),
        tea: UNO.plus(tasaMensual).pow(12).minus(1),
        totalPagado,
        recargo,
        recargoPorcentaje: recargo.div(monto),
    };
}

/** Tasa anual (TNA con capitalización mensual o TEA) a tasa mensual efectiva. */
export function mensualDesdeAnual(tasa: Dec, tipo: 'tna' | 'tea'): Dec {
    if (tipo === 'tna') {
        return tasa.div(12);
    }

    if (tasa.lte(-1)) {
        throw new Error('La TEA tiene que ser mayor a −100 %.');
    }

    return UNO.plus(tasa).pow(UNO.div(12)).minus(1);
}

export type DatosContadoVsCuotas = {
    contado: Dec;
    anticipo: Dec;
    /** Seguros, gastos de otorgamiento, envío: se pagan al principio. */
    costos: Dec;
    plan: Plan;
    /** Lo que rinde tu plata por mes (la tasa contra la que comparar). */
    oportunidadMensual: Dec;
    /** Inflación mensual esperada, si se quiere ver el costo en pesos de hoy. */
    inflacionMensual: Dec | null;
};

export type ResultadoContadoVsCuotas = {
    /** Anticipo + costos + todas las cuotas, sin descontar. */
    totalNominal: Dec;
    /** Anticipo + costos + cuotas descontadas a tu tasa. */
    valorPresente: Dec;
    /** valorPresente − contado: negativo si conviene en cuotas. */
    diferencia: Dec;
    conviene: 'contado' | 'cuotas' | 'da-igual';
    /** Tasa del plan sobre lo que de verdad se financia. */
    tasaImplicitaMensual: Dec;
    teaImplicita: Dec;
    teaOportunidad: Dec;
    /** Anticipo + costos + cuotas en pesos de hoy, según la inflación. */
    costoReal: Dec | null;
};

export function contadoVsCuotas(
    d: DatosContadoVsCuotas,
): ResultadoContadoVsCuotas {
    validarPlan(d.plan);

    if (d.contado.lte(0)) {
        throw new Error('El precio de contado tiene que ser mayor a cero.');
    }

    if (d.anticipo.lt(0) || d.costos.lt(0)) {
        throw new Error('El anticipo y los costos no pueden ser negativos.');
    }

    const financiado = d.contado.minus(d.anticipo).minus(d.costos);

    if (financiado.lte(0)) {
        throw new Error(
            'El anticipo y los costos cubren todo el precio de contado: no queda nada financiado.',
        );
    }

    const inicial = d.anticipo.plus(d.costos);
    const totalNominal = inicial.plus(d.plan.valorCuota.times(d.plan.cuotas));
    const valorPresente = inicial.plus(
        valorPresenteCuotas(d.plan, d.oportunidadMensual),
    );
    const diferencia = valorPresente.minus(d.contado);
    const tasaImplicita = tasaImplicitaMensual(financiado, d.plan);

    // Menos de un peso de diferencia: da igual.
    const conviene = diferencia.abs().lt(1)
        ? 'da-igual'
        : diferencia.isNegative()
          ? 'cuotas'
          : 'contado';

    return {
        totalNominal,
        valorPresente,
        diferencia,
        conviene,
        tasaImplicitaMensual: tasaImplicita,
        teaImplicita: UNO.plus(tasaImplicita).pow(12).minus(1),
        teaOportunidad: UNO.plus(d.oportunidadMensual).pow(12).minus(1),
        costoReal:
            d.inflacionMensual === null
                ? null
                : inicial.plus(valorPresenteCuotas(d.plan, d.inflacionMensual)),
    };
}
