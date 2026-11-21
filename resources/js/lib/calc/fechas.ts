import {
    addDays,
    addMonths,
    addWeeks,
    addYears,
    differenceInCalendarDays,
    format,
    isValid,
} from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Fechas de calendario, sin hora ni zona horaria. Viajan como texto ISO
 * ("2026-11-21") y se convierten a Date al mediodía local, para que ningún
 * cambio de horario corra el día.
 */
export type FechaISO = string;

export function aFecha(iso: FechaISO): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);

    if (!m) {
        throw new Error('Fecha inválida');
    }

    const fecha = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);

    if (
        !isValid(fecha) ||
        fecha.getMonth() !== Number(m[2]) - 1 ||
        fecha.getDate() !== Number(m[3])
    ) {
        throw new Error('Fecha inválida');
    }

    return fecha;
}

export function aISO(fecha: Date): FechaISO {
    return format(fecha, 'yyyy-MM-dd');
}

export function hoyISO(): FechaISO {
    return aISO(new Date());
}

/** "21/11/2026" */
export function formatoCorto(iso: FechaISO): string {
    return format(aFecha(iso), 'dd/MM/yyyy');
}

/** "sábado 21 de noviembre de 2026" */
export function formatoLargo(iso: FechaISO): string {
    return format(aFecha(iso), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
}

export function diaDeLaSemana(iso: FechaISO): string {
    return format(aFecha(iso), 'EEEE', { locale: es });
}

export type AniosMesesDias = { anios: number; meses: number; dias: number };

/**
 * Años, meses y días reales entre dos fechas (desde ≤ hasta). Sin meses
 * ficticios de 30 días: se suman meses de calendario y el resto son días.
 */
export function aniosMesesDias(desde: Date, hasta: Date): AniosMesesDias {
    let meses =
        (hasta.getFullYear() - desde.getFullYear()) * 12 +
        (hasta.getMonth() - desde.getMonth());

    if (addMonths(desde, meses) > hasta) {
        meses--;
    }

    const intermedia = addMonths(desde, meses);

    return {
        anios: Math.floor(meses / 12),
        meses: meses % 12,
        dias: differenceInCalendarDays(hasta, intermedia),
    };
}

export function textoAniosMesesDias({
    anios,
    meses,
    dias,
}: AniosMesesDias): string {
    const partes: string[] = [];

    if (anios) {
        partes.push(`${anios} ${anios === 1 ? 'año' : 'años'}`);
    }

    if (meses) {
        partes.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`);
    }

    if (dias || partes.length === 0) {
        partes.push(`${dias} ${dias === 1 ? 'día' : 'días'}`);
    }

    if (partes.length === 1) {
        return partes[0];
    }

    return partes.slice(0, -1).join(', ') + ' y ' + partes.at(-1);
}

export type ResultadoDiasEntre = {
    dias: number;
    semanas: number;
    diasSueltos: number;
    periodo: AniosMesesDias;
    /** true si la fecha final era anterior a la inicial (se dieron vuelta). */
    invertidas: boolean;
    desde: FechaISO;
    hasta: FechaISO;
};

export function diasEntre(
    a: FechaISO,
    b: FechaISO,
    incluirUltimoDia = false,
): ResultadoDiasEntre {
    let desde = aFecha(a);
    let hasta = aFecha(b);
    const invertidas = hasta < desde;

    if (invertidas) {
        [desde, hasta] = [hasta, desde];
    }

    const finEfectivo = incluirUltimoDia ? addDays(hasta, 1) : hasta;
    const dias = differenceInCalendarDays(finEfectivo, desde);

    return {
        dias,
        semanas: Math.floor(dias / 7),
        diasSueltos: dias % 7,
        periodo: aniosMesesDias(desde, finEfectivo),
        invertidas,
        desde: aISO(desde),
        hasta: aISO(hasta),
    };
}

export type Unidad = 'dias' | 'semanas' | 'meses' | 'anios';

export type ResultadoSumar = {
    fecha: FechaISO;
    /**
     * true si el mes de destino no tenía ese día y se usó el último del mes
     * (31/01 + 1 mes → 28/02).
     */
    recortada: boolean;
};

export function sumarRestar(
    iso: FechaISO,
    cantidad: number,
    unidad: Unidad,
): ResultadoSumar {
    if (!Number.isInteger(cantidad)) {
        throw new Error('La cantidad tiene que ser un número entero');
    }

    const fecha = aFecha(iso);
    const operaciones: Record<Unidad, (f: Date, n: number) => Date> = {
        dias: addDays,
        semanas: addWeeks,
        meses: addMonths,
        anios: addYears,
    };
    const resultado = operaciones[unidad](fecha, cantidad);
    const recortada =
        (unidad === 'meses' || unidad === 'anios') &&
        resultado.getDate() !== fecha.getDate();

    return { fecha: aISO(resultado), recortada };
}

export type ResultadoEdad = {
    edad: AniosMesesDias;
    diasVividos: number;
    proximoCumple: FechaISO;
    diasParaCumple: number;
    cumpleHoy: boolean;
    /** Edad que cumple en el próximo cumpleaños. */
    cumpleAnios: number;
};

export function calcularEdad(
    nacimiento: FechaISO,
    referencia: FechaISO,
): ResultadoEdad {
    const nac = aFecha(nacimiento);
    const ref = aFecha(referencia);

    if (ref < nac) {
        throw new Error(
            'La fecha de referencia no puede ser anterior al nacimiento',
        );
    }

    const edad = aniosMesesDias(nac, ref);
    const cumpleHoy = edad.meses === 0 && edad.dias === 0;
    // addYears recorta el 29/02 al 28/02 en años no bisiestos.
    let cumpleAnios = edad.anios + (cumpleHoy ? 0 : 1);
    let proximo = addYears(nac, cumpleAnios);

    if (proximo < ref) {
        cumpleAnios++;
        proximo = addYears(nac, cumpleAnios);
    }

    return {
        edad,
        diasVividos: differenceInCalendarDays(ref, nac),
        proximoCumple: aISO(proximo),
        diasParaCumple: differenceInCalendarDays(proximo, ref),
        cumpleHoy,
        cumpleAnios,
    };
}
