import { describe, expect, it } from 'vite-plus/test';
import type { Feriado } from './diasHabiles';
import { contarHabiles, crearCalendario, sumarHabiles } from './diasHabiles';
import {
    aFecha,
    calcularEdad,
    diasEntre,
    formatoLargo,
    sumarRestar,
    textoAniosMesesDias,
} from './fechas';

describe('días entre fechas', () => {
    it('cuenta días corridos y semanas', () => {
        const r = diasEntre('2026-01-01', '2026-03-01');
        expect(r.dias).toBe(59);
        expect(r.semanas).toBe(8);
        expect(r.diasSueltos).toBe(3);
        expect(r.periodo).toEqual({ anios: 0, meses: 2, dias: 0 });
    });

    it('considera los años bisiestos', () => {
        expect(diasEntre('2024-02-01', '2024-03-01').dias).toBe(29);
        expect(diasEntre('2025-02-01', '2025-03-01').dias).toBe(28);
    });

    it('acepta las fechas al revés y avisa', () => {
        const r = diasEntre('2026-12-31', '2026-01-01');
        expect(r.invertidas).toBe(true);
        expect(r.dias).toBe(364);
    });

    it('puede incluir el último día', () => {
        expect(diasEntre('2026-01-01', '2026-01-31', true).dias).toBe(31);
    });

    it('arma el texto de años, meses y días', () => {
        expect(textoAniosMesesDias({ anios: 1, meses: 2, dias: 1 })).toBe(
            '1 año, 2 meses y 1 día',
        );
        expect(textoAniosMesesDias({ anios: 0, meses: 0, dias: 0 })).toBe(
            '0 días',
        );
    });
});

describe('sumar o restar', () => {
    it('31/01 + 1 mes → último día de febrero', () => {
        expect(sumarRestar('2026-01-31', 1, 'meses')).toEqual({
            fecha: '2026-02-28',
            recortada: true,
        });
        expect(sumarRestar('2024-01-31', 1, 'meses').fecha).toBe('2024-02-29');
    });

    it('resta días cruzando el año', () => {
        expect(sumarRestar('2026-01-05', -10, 'dias').fecha).toBe('2025-12-26');
    });

    it('29/02 + 1 año → 28/02', () => {
        expect(sumarRestar('2024-02-29', 1, 'anios')).toEqual({
            fecha: '2025-02-28',
            recortada: true,
        });
    });
});

describe('edad', () => {
    it('edad exacta y próximo cumpleaños', () => {
        const r = calcularEdad('1990-05-15', '2026-11-21');
        expect(r.edad).toEqual({ anios: 36, meses: 6, dias: 6 });
        expect(r.proximoCumple).toBe('2027-05-15');
        expect(r.cumpleAnios).toBe(37);
        expect(r.cumpleHoy).toBe(false);
    });

    it('detecta el cumpleaños de hoy', () => {
        const r = calcularEdad('2000-11-21', '2026-11-21');
        expect(r.cumpleHoy).toBe(true);
        expect(r.diasParaCumple).toBe(0);
        expect(r.edad.anios).toBe(26);
    });

    it('rechaza una referencia anterior al nacimiento', () => {
        expect(() => calcularEdad('2026-01-01', '2025-01-01')).toThrow();
    });
});

describe('fechas inválidas y formato', () => {
    it('rechaza el 31 de abril', () => {
        expect(() => aFecha('2026-04-31')).toThrow();
    });

    it('formatea en español', () => {
        expect(formatoLargo('2026-11-21')).toBe(
            'sábado 21 de noviembre de 2026',
        );
    });
});

describe('días hábiles', () => {
    const feriados: Feriado[] = [
        {
            fecha: '2026-11-23',
            nombre: 'Día de la Soberanía Nacional',
            tipo: 'trasladable',
        },
        { fecha: '2026-12-07', nombre: 'Feriado puente', tipo: 'puente' },
        {
            fecha: '2026-12-08',
            nombre: 'Inmaculada Concepción de María',
            tipo: 'inamovible',
        },
        { fecha: '2026-04-02', nombre: 'Jueves Santo', tipo: 'no_laborable' },
    ];
    const cal = crearCalendario(feriados);

    it('viernes + 1 hábil saltea el finde y el feriado del lunes', () => {
        // 20/11/2026 es viernes; el lunes 23 es feriado.
        const r = sumarHabiles('2026-11-20', 1, cal);
        expect(r.fecha).toBe('2026-11-24');
        expect(r.feriados.map((f) => f.fecha)).toEqual(['2026-11-23']);
    });

    it('resta hábiles hacia atrás', () => {
        expect(sumarHabiles('2026-12-09', -1, cal).fecha).toBe('2026-12-04');
    });

    it('los no laborables pueden contar como hábiles', () => {
        const flexible = crearCalendario(feriados, {
            noLaborablesComoHabiles: true,
        });
        expect(sumarHabiles('2026-04-01', 1, cal).fecha).toBe('2026-04-03');
        expect(sumarHabiles('2026-04-01', 1, flexible).fecha).toBe(
            '2026-04-02',
        );
    });

    it('los puentes también son no laborables', () => {
        const flexible = crearCalendario(feriados, {
            noLaborablesComoHabiles: true,
        });
        // Viernes 4/12 + 1 hábil: el lunes 7 es puente y el martes 8 feriado.
        expect(sumarHabiles('2026-12-04', 1, cal).fecha).toBe('2026-12-09');
        expect(sumarHabiles('2026-12-04', 1, flexible).fecha).toBe(
            '2026-12-07',
        );
    });

    it('cuenta hábiles incluyendo las dos puntas', () => {
        const r = contarHabiles('2026-11-16', '2026-11-27', cal);
        expect(r.corridos).toBe(12);
        expect(r.finesDeSemana).toBe(2);
        expect(r.habiles).toBe(9);
        expect(r.feriados).toHaveLength(1);
    });
});
