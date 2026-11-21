import { addDays } from 'date-fns';
import type { FechaISO } from './fechas';
import { aFecha, aISO } from './fechas';

/**
 * Días hábiles en Argentina: lunes a viernes que no son feriado. Los
 * feriados llegan de afuera (el servidor los guarda por año), así esta
 * lógica se prueba sin red.
 */
export type TipoFeriado =
    | 'inamovible'
    | 'trasladable'
    | 'puente'
    | 'no_laborable';

export type Feriado = {
    fecha: FechaISO;
    nombre: string;
    tipo: TipoFeriado;
};

export type OpcionesHabiles = {
    /**
     * Los días no laborables son optativos para el sector privado: muchos
     * los trabajan. Si es true, cuentan como hábiles.
     */
    noLaborablesComoHabiles?: boolean;
};

export type Calendario = {
    feriados: Map<FechaISO, Feriado>;
    opciones: OpcionesHabiles;
};

export function crearCalendario(
    feriados: Feriado[],
    opciones: OpcionesHabiles = {},
): Calendario {
    return {
        feriados: new Map(feriados.map((f) => [f.fecha, f])),
        opciones,
    };
}

function feriadoQueCuenta(iso: FechaISO, cal: Calendario): Feriado | undefined {
    const f = cal.feriados.get(iso);

    if (
        f &&
        f.tipo === 'no_laborable' &&
        cal.opciones.noLaborablesComoHabiles
    ) {
        return undefined;
    }

    return f;
}

export function esFinDeSemana(fecha: Date): boolean {
    const d = fecha.getDay();

    return d === 0 || d === 6;
}

export function esHabil(iso: FechaISO, cal: Calendario): boolean {
    return !esFinDeSemana(aFecha(iso)) && !feriadoQueCuenta(iso, cal);
}

export type ResultadoHabiles = {
    fecha: FechaISO;
    /** Feriados (en días de semana) que se salteó o que cayeron en el rango. */
    feriados: Feriado[];
    /** Días corridos entre el inicio y el resultado. */
    diasCorridos: number;
};

/**
 * Suma (o resta, si n < 0) n días hábiles. El día de inicio no cuenta:
 * viernes + 1 hábil = lunes (si el lunes no es feriado).
 */
export function sumarHabiles(
    inicio: FechaISO,
    n: number,
    cal: Calendario,
): ResultadoHabiles {
    if (!Number.isInteger(n)) {
        throw new Error('La cantidad tiene que ser un número entero');
    }

    const paso = n < 0 ? -1 : 1;
    let restantes = Math.abs(n);
    let fecha = aFecha(inicio);
    const feriados: Feriado[] = [];
    let corridos = 0;

    while (restantes > 0) {
        fecha = addDays(fecha, paso);
        corridos++;
        const iso = aISO(fecha);
        const feriado = feriadoQueCuenta(iso, cal);

        if (esFinDeSemana(fecha)) {
            continue;
        }

        if (feriado) {
            feriados.push(feriado);
            continue;
        }

        restantes--;
    }

    return { fecha: aISO(fecha), feriados, diasCorridos: corridos };
}

export type ResultadoConteo = {
    habiles: number;
    corridos: number;
    finesDeSemana: number;
    feriados: Feriado[];
};

/** Cuenta los días hábiles entre dos fechas, incluyendo las dos puntas. */
export function contarHabiles(
    a: FechaISO,
    b: FechaISO,
    cal: Calendario,
): ResultadoConteo {
    let desde = aFecha(a);
    let hasta = aFecha(b);

    if (hasta < desde) {
        [desde, hasta] = [hasta, desde];
    }

    let habiles = 0;
    let corridos = 0;
    let finesDeSemana = 0;
    const feriados: Feriado[] = [];

    for (let f = desde; f <= hasta; f = addDays(f, 1)) {
        corridos++;

        if (esFinDeSemana(f)) {
            finesDeSemana++;
            continue;
        }

        const feriado = feriadoQueCuenta(aISO(f), cal);

        if (feriado) {
            feriados.push(feriado);
            continue;
        }

        habiles++;
    }

    return { habiles, corridos, finesDeSemana, feriados };
}

/** Años que toca un cálculo, para avisar si falta el calendario de alguno. */
export function aniosEnRango(a: FechaISO, b: FechaISO): number[] {
    const [x, y] = [Number(a.slice(0, 4)), Number(b.slice(0, 4))].sort(
        (p, q) => p - q,
    );
    const anios: number[] = [];

    for (let anio = x; anio <= y; anio++) {
        anios.push(anio);
    }

    return anios;
}
