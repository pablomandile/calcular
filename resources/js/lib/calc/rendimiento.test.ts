import { describe, expect, it } from 'vite-plus/test';
import { D } from './numero';
import {
    contraInflacion,
    gananciaEn,
    rendimientoCuenta,
    tasaDiaria,
} from './rendimiento';

const d = (v: string | number) => new D(v);
const millon = d(1000000);
const tasa = d('0.188');

describe('rendimiento de una cuenta remunerada', () => {
    it('18,8 % TNA sobre $ 1.000.000: $ 515,07 por día', () => {
        const r = rendimientoCuenta(millon, tasa, 'tna');

        expect(r.porDia.toDecimalPlaces(2).toNumber()).toBe(515.07);
        expect(r.porMes.toDecimalPlaces(0).toNumber()).toBe(15568);
        expect(r.tea.toDecimalPlaces(4).toNumber()).toBe(0.2068);
        expect(r.porAnio.toDecimalPlaces(0).toNumber()).toBe(
            r.tea.times(millon).toDecimalPlaces(0).toNumber(),
        );
    });

    it('si la tasa es TEA, rinde menos por día: $ 472,09', () => {
        const r = rendimientoCuenta(millon, tasa, 'tea');

        expect(r.porDia.toDecimalPlaces(2).toNumber()).toBe(472.09);
        expect(r.tea.toDecimalPlaces(12).toNumber()).toBe(0.188);
    });

    it('la reinversión diaria hace que un mes rinda más que 30 días sueltos', () => {
        const r = rendimientoCuenta(millon, tasa, 'tna');

        expect(r.porMes.gt(r.porDia.times(30))).toBe(true);
    });

    it('con tope, lo que lo supera no rinde', () => {
        const r = rendimientoCuenta(d(2000000), tasa, 'tna', millon);

        expect(r.porDia.toDecimalPlaces(2).toNumber()).toBe(515.07);
        expect(r.noRinde.toNumber()).toBe(1000000);
        // Todo el mes rinde sobre el millón: sin interés compuesto.
        expect(r.porMes.toDecimalPlaces(2).toNumber()).toBe(
            millon
                .times(tasaDiaria(tasa, 'tna'))
                .times(30)
                .toDecimalPlaces(2)
                .toNumber(),
        );
    });

    it('debajo del tope, igual que sin tope', () => {
        const diaria = tasaDiaria(tasa, 'tna');

        expect(
            gananciaEn(millon, diaria, 30, d(5000000))
                .minus(gananciaEn(millon, diaria, 30))
                .abs()
                .lt('1e-20'),
        ).toBe(true);
    });

    it('valida los datos', () => {
        expect(() => rendimientoCuenta(d(0), tasa, 'tna')).toThrow();
        expect(() => rendimientoCuenta(millon, tasa, 'tna', d(0))).toThrow();
        expect(() => rendimientoCuenta(millon, d(-1), 'tea')).toThrow();
    });
});

describe('contra la inflación', () => {
    it('1,5 % de rendimiento con 2,2 % de inflación pierde poder de compra', () => {
        const r = contraInflacion(millon, d('0.015'), d('0.022'));

        expect(r.leGana).toBe(false);
        expect(r.real.toDecimalPlaces(4).toNumber()).toBe(-0.0068);
        expect(r.enPesos.toDecimalPlaces(0).toNumber()).toBe(-6849);
    });

    it('si rinde más que la inflación, le gana', () => {
        expect(contraInflacion(millon, d('0.03'), d('0.02')).leGana).toBe(true);
    });
});
