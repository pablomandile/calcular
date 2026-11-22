import { describe, expect, it } from 'vite-plus/test';
import {
    aFecha,
    aniosMesesDias,
    calcularEdad,
    diasEntre,
    sumarRestar,
} from './calc/fechas';
import { preguntasFechas } from './preguntasFrecuentes';

/** Todo el texto de una pregunta, para comprobar que el ejemplo sigue ahí. */
function texto(inicio: string): string {
    const p = preguntasFechas.find((q) => q.pregunta.startsWith(inicio));

    if (!p) {
        throw new Error(`No está la pregunta "${inicio}"`);
    }

    return p.respuesta.flat().join(' ');
}

describe('preguntas frecuentes de fechas: los ejemplos son ciertos', () => {
    it('bisiestos', () => {
        expect(texto('¿Tiene en cuenta los años bisiestos')).toContain(
            '29 días',
        );
        expect(diasEntre('2028-02-01', '2028-03-01').dias).toBe(29);
        expect(diasEntre('2027-02-01', '2027-03-01').dias).toBe(28);
    });

    it('meses de calendario, no de 30 días', () => {
        const desdeEnero = aniosMesesDias(
            aFecha('2026-01-15'),
            aFecha('2026-02-15'),
        );
        const desdeFebrero = aniosMesesDias(
            aFecha('2026-02-15'),
            aFecha('2026-03-15'),
        );

        expect(desdeEnero).toEqual({ anios: 0, meses: 1, dias: 0 });
        expect(desdeFebrero).toEqual({ anios: 0, meses: 1, dias: 0 });
    });

    it('primer y último día', () => {
        expect(diasEntre('2026-11-23', '2026-11-24').dias).toBe(1);
        expect(diasEntre('2026-11-23', '2026-11-24', true).dias).toBe(2);
    });

    it('sumar un mes a un 31 y un año a un 29 de febrero', () => {
        expect(texto('¿Qué pasa si le sumo un mes')).toContain('28/2/2026');
        expect(sumarRestar('2026-01-31', 1, 'meses')).toEqual({
            fecha: '2026-02-28',
            recortada: true,
        });
        expect(sumarRestar('2028-01-31', 1, 'meses')).toEqual({
            fecha: '2028-02-29',
            recortada: true,
        });
        expect(sumarRestar('2024-02-29', 1, 'anios')).toEqual({
            fecha: '2025-02-28',
            recortada: true,
        });
    });

    it('fechas en orden inverso', () => {
        expect(diasEntre('2026-12-01', '2026-11-01').invertidas).toBe(true);
        expect(() => calcularEdad('2000-01-01', '1999-01-01')).toThrow();
    });

    it('cumpleaños del 29 de febrero', () => {
        const r = calcularEdad('2004-02-29', '2025-02-28');

        expect(r.cumpleHoy).toBe(true);
        expect(r.edad.anios).toBe(21);
    });

    it('cada pregunta tiene respuesta y no se repite', () => {
        const preguntas = preguntasFechas.map((p) => p.pregunta);

        expect(new Set(preguntas).size).toBe(preguntas.length);
        preguntasFechas.forEach((p) =>
            expect(p.respuesta.length).toBeGreaterThan(0),
        );
    });
});
