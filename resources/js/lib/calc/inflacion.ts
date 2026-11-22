import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import type { FechaISO } from './fechas';
import { aFecha } from './fechas';
import type { Dec } from './numero';
import { D } from './numero';

/**
 * Inflación. Las tasas son FRACCIONES (0,05 = 5 %), como en tasas.ts.
 *
 * Las series oficiales llegan como número índice (IPC base dic-2016 = 100,
 * CER, UVA): el coeficiente entre dos fechas es el cociente de los índices,
 * sin encadenar porcentajes redondeados.
 */

/** Mes como texto "AAAA-MM". */
export type Mes = string;

export type PuntoIndice = { fecha: FechaISO; valor: Dec };

const UNO = new D(1);

// ── Meses ───────────────────────────────────────────────────────────────────

export function mesDe(fecha: FechaISO): Mes {
    return fecha.slice(0, 7);
}

export function sumarMeses(mes: Mes, n: number): Mes {
    const [a, m] = mes.split('-').map(Number);
    const total = a * 12 + (m - 1) + n;

    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

/** Meses de `desde` a `hasta` (positivo si hasta es posterior). */
export function mesesEntre(desde: Mes, hasta: Mes): number {
    const [a1, m1] = desde.split('-').map(Number);
    const [a2, m2] = hasta.split('-').map(Number);

    return (a2 - a1) * 12 + (m2 - m1);
}

/** "octubre de 2026" */
export function nombreMes(mes: Mes): string {
    return format(aFecha(`${mes}-01`), "MMMM 'de' yyyy", { locale: es });
}

/** "oct 2026" */
export function nombreMesCorto(mes: Mes): string {
    return format(aFecha(`${mes}-01`), 'MMM yyyy', { locale: es }).replace(
        '.',
        '',
    );
}

// ── Escenario: inflación mensual constante ─────────────────────────────────

export type ResultadoAcumulada = {
    /** (1 + i)^n */
    factor: Dec;
    /** factor − 1 */
    acumulada: Dec;
    /** (1 + i)^12 − 1: la misma tasa mensual llevada a un año. */
    anualEquivalente: Dec;
    /** i × n: lo que da sumar los meses, que subestima la inflación. */
    sumaSimple: Dec;
};

export function inflacionAcumulada(
    tasaMensual: Dec,
    meses: number,
): ResultadoAcumulada {
    if (tasaMensual.lte(-1)) {
        throw new Error('La inflación mensual tiene que ser mayor a −100 %.');
    }

    if (!Number.isInteger(meses) || meses < 1) {
        throw new Error(
            'La cantidad de meses tiene que ser un entero positivo.',
        );
    }

    const base = UNO.plus(tasaMensual);
    const factor = base.pow(meses);

    return {
        factor,
        acumulada: factor.minus(1),
        anualEquivalente: base.pow(12).minus(1),
        sumaSimple: tasaMensual.times(meses),
    };
}

// ── Actualizar un monto con un porcentaje conocido ─────────────────────────

export type ResultadoActualizar = {
    factor: Dec;
    montoFinal: Dec;
    diferencia: Dec;
    /**
     * Cuánto poder de compra perdió el monto original: 1 − 1/factor. Con
     * 100 % de inflación, la plata compra la mitad (−50 %), no "nada".
     */
    poderDeCompraPerdido: Dec;
};

export function actualizarMonto(
    monto: Dec,
    inflacionDelPeriodo: Dec,
): ResultadoActualizar {
    if (inflacionDelPeriodo.lte(-1)) {
        throw new Error(
            'La inflación del período tiene que ser mayor a −100 %.',
        );
    }

    const factor = UNO.plus(inflacionDelPeriodo);
    const montoFinal = monto.times(factor);

    return {
        factor,
        montoFinal,
        diferencia: montoFinal.minus(monto),
        poderDeCompraPerdido: UNO.minus(UNO.div(factor)),
    };
}

// ── IPC: serie mensual ─────────────────────────────────────────────────────

export type FilaMensual = {
    mes: Mes;
    indice: Dec;
    /** Contra el mes anterior; null en el primer mes de la serie. */
    mensual: Dec | null;
    /** Contra el mismo mes del año anterior; null el primer año. */
    interanual: Dec | null;
};

/** Índice por mes. */
export function porMes(puntos: PuntoIndice[]): Map<Mes, Dec> {
    return new Map(puntos.map((p) => [mesDe(p.fecha), p.valor]));
}

export function filasMensuales(puntos: PuntoIndice[]): FilaMensual[] {
    const indice = porMes(puntos);

    return [...indice.keys()].sort().map((mes) => {
        const actual = indice.get(mes)!;
        const anterior = indice.get(sumarMeses(mes, -1));
        const haceUnAnio = indice.get(sumarMeses(mes, -12));

        return {
            mes,
            indice: actual,
            mensual: anterior ? actual.div(anterior).minus(1) : null,
            interanual: haceUnAnio ? actual.div(haceUnAnio).minus(1) : null,
        };
    });
}

/**
 * Inflación de los meses `desde` a `hasta`, los dos incluidos: el índice de
 * `hasta` contra el del mes anterior a `desde`.
 */
export function acumuladaDeMeses(
    indice: Map<Mes, Dec>,
    desde: Mes,
    hasta: Mes,
): Dec {
    if (hasta < desde) {
        throw new Error('El mes final tiene que ser posterior al inicial.');
    }

    const base = indice.get(sumarMeses(desde, -1));
    const fin = indice.get(hasta);

    if (!base || !fin) {
        throw new Error(
            `No hay datos del IPC para calcular de ${nombreMes(desde)} a ${nombreMes(hasta)}.`,
        );
    }

    return fin.div(base).minus(1);
}

export type ResultadoIpc = {
    coeficiente: Dec;
    variacion: Dec;
    montoFinal: Dec;
    indiceDesde: Dec;
    indiceHasta: Dec;
    meses: number;
};

/**
 * Lleva un monto de precios de `desde` a precios de `hasta`: monto ×
 * IPC(hasta) / IPC(desde). Si `hasta` es anterior, el coeficiente es menor a
 * 1 (el monto se lleva a precios de antes).
 */
export function actualizarPorIpc(
    monto: Dec,
    desde: Mes,
    hasta: Mes,
    indice: Map<Mes, Dec>,
): ResultadoIpc {
    const indiceDesde = indice.get(desde);
    const indiceHasta = indice.get(hasta);

    for (const [mes, valor] of [
        [desde, indiceDesde],
        [hasta, indiceHasta],
    ] as const) {
        if (!valor) {
            throw new Error(
                `Todavía no hay IPC de ${nombreMes(mes)}. Elegí un mes con datos.`,
            );
        }
    }

    const coeficiente = indiceHasta!.div(indiceDesde!);

    return {
        coeficiente,
        variacion: coeficiente.minus(1),
        montoFinal: monto.times(coeficiente),
        indiceDesde: indiceDesde!,
        indiceHasta: indiceHasta!,
        meses: mesesEntre(desde, hasta),
    };
}

// ── CER y UVA: series diarias ──────────────────────────────────────────────

export type FilaDiaria = {
    fecha: FechaISO;
    valor: Dec;
    /** Contra el registro anterior de la serie; null en el primero. */
    variacion: Dec | null;
};

export type ResumenPeriodo = {
    filas: FilaDiaria[];
    primero: FilaDiaria;
    ultimo: FilaDiaria;
    /** Último contra primero del período. */
    variacion: Dec;
};

/** Los registros entre dos fechas (incluidas), ya con su variación diaria. */
export function resumenPeriodo(
    puntos: PuntoIndice[],
    desde: FechaISO,
    hasta: FechaISO,
): ResumenPeriodo | null {
    if (hasta < desde) {
        throw new Error('La fecha final tiene que ser posterior a la inicial.');
    }

    const filas: FilaDiaria[] = [];

    puntos.forEach((p, i) => {
        if (p.fecha >= desde && p.fecha <= hasta) {
            const anterior = puntos[i - 1];
            filas.push({
                fecha: p.fecha,
                valor: p.valor,
                variacion: anterior
                    ? p.valor.div(anterior.valor).minus(1)
                    : null,
            });
        }
    });

    if (filas.length === 0) {
        return null;
    }

    const primero = filas[0];
    const ultimo = filas[filas.length - 1];

    return {
        filas,
        primero,
        ultimo,
        variacion: ultimo.valor.div(primero.valor).minus(1),
    };
}
