import { describe, expect, it } from 'vite-plus/test';
import {
    aFecha,
    aniosMesesDias,
    calcularEdad,
    diasEntre,
    sumarRestar,
} from './calc/fechas';
import { inflacionAcumulada } from './calc/inflacion';
import { D } from './calc/numero';
import { interesEnCuotas } from './calc/cuotas';
import { descuentoConTope } from './calc/descuentos';
import { rendimientoCuenta } from './calc/rendimiento';
import { teaDesdeTna } from './calc/tasas';
import {
    preguntasFechas,
    preguntasFinanzas,
    preguntasInflacion,
} from './preguntasFrecuentes';

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

describe('preguntas frecuentes de inflación: los ejemplos son ciertos', () => {
    const texto = preguntasInflacion
        .find((p) => p.pregunta.startsWith('¿Por qué no se suma'))!
        .respuesta.flat()
        .join(' ');

    it('2 % y 3 % dan 5,06 %', () => {
        expect(texto).toContain('5,06 %');
        expect(new D('1.02').times('1.03').minus(1).toNumber()).toBe(0.0506);
    });

    it('5 % por mes durante un año da 79,59 %', () => {
        expect(texto).toContain('79,59 %');
        expect(
            inflacionAcumulada(new D('0.05'), 12)
                .acumulada.toDecimalPlaces(4)
                .toNumber(),
        ).toBe(0.7959);
    });
});

describe('preguntas frecuentes de finanzas: los ejemplos son ciertos', () => {
    const texto = (inicio: string) =>
        preguntasFinanzas
            .find((p) => p.pregunta.startsWith(inicio))!
            .respuesta.flat()
            .join(' ');

    it('60 % TNA mensual es 79,59 % TEA', () => {
        expect(texto('¿Qué diferencia hay entre la TNA')).toContain('79,59 %');
        expect(
            teaDesdeTna(new D('0.6'), 12).toDecimalPlaces(4).toNumber(),
        ).toBe(0.7959);
    });

    it('12 cuotas de $ 110.000 por $ 1.000.000: 4,55 % mensual, 70,6 % TEA', () => {
        expect(texto('¿Por qué el recargo')).toContain('4,55 % mensual');
        const r = interesEnCuotas(new D(1000000), {
            cuotas: 12,
            valorCuota: new D(110000),
            primeraDias: 30,
            frecuenciaDias: 30,
        });

        expect(r.tasaMensual.toDecimalPlaces(4).toNumber()).toBe(0.0455);
        expect(r.tea.toDecimalPlaces(3).toNumber()).toBe(0.706);
        expect(r.recargoPorcentaje.toNumber()).toBe(0.32);
    });

    it('$ 1.000.000 al 18,8 % TNA: $ 515,07 por día y 20,68 % TEA', () => {
        const respuesta = texto('¿Cuánto me rinde por día');

        expect(respuesta).toContain('$ 515,07');
        expect(respuesta).toContain('20,68 %');
        const r = rendimientoCuenta(new D(1000000), new D('0.188'), 'tna');

        expect(r.porDia.toDecimalPlaces(2).toNumber()).toBe(515.07);
        expect(r.tea.toDecimalPlaces(4).toNumber()).toBe(0.2068);
    });

    it('20 % con tope de $ 6.000: hasta $ 30.000; con $ 60.000, 10 % real', () => {
        expect(texto('¿Cuánto puedo gastar')).toContain('$ 30.000');
        const r = descuentoConTope(new D('0.2'), new D(6000), new D(60000));

        expect(r.compraMaxima.toNumber()).toBe(30000);
        expect(r.compra!.descuentoEfectivo.toNumber()).toBe(0.1);
    });

    it('30 % de rendimiento con 25 % de inflación: 4 % real', () => {
        expect(texto('¿Cómo sé si una inversión')).toContain('ganaste 4 %');
        expect(
            new D('1.3').div('1.25').minus(1).toDecimalPlaces(4).toNumber(),
        ).toBe(0.04);
    });
});
