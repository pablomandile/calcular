import { describe, expect, it } from 'vite-plus/test';
import { descuentoConTope, reintegroDe } from './descuentos';
import { D } from './numero';

const d = (v: string | number) => new D(v);
const veintePorCiento = d('0.2');
const tope = d(6000);

describe('descuento con tope', () => {
    it('20 % con tope de $ 6.000: se aprovecha entero hasta $ 30.000', () => {
        const r = descuentoConTope(veintePorCiento, tope);

        expect(r.compraMaxima.toNumber()).toBe(30000);
        expect(r.compra).toBeNull();
    });

    it('debajo del tope, el porcentaje entero', () => {
        const c = descuentoConTope(veintePorCiento, tope, d(20000)).compra!;

        expect(c.reintegro.toNumber()).toBe(4000);
        expect(c.pagas.toNumber()).toBe(16000);
        expect(c.descuentoEfectivo.toNumber()).toBe(0.2);
        expect(c.sinDescuento.toNumber()).toBe(0);
        expect(c.llegaAlTope).toBe(false);
    });

    it('justo en el tope', () => {
        const c = descuentoConTope(veintePorCiento, tope, d(30000)).compra!;

        expect(c.reintegro.toNumber()).toBe(6000);
        expect(c.descuentoEfectivo.toNumber()).toBe(0.2);
        expect(c.llegaAlTope).toBe(true);
    });

    it('pasado el tope, el reintegro queda fijo y el descuento real baja', () => {
        const c = descuentoConTope(veintePorCiento, tope, d(60000)).compra!;

        expect(c.reintegro.toNumber()).toBe(6000);
        expect(c.pagas.toNumber()).toBe(54000);
        expect(c.descuentoEfectivo.toNumber()).toBe(0.1);
        expect(c.sinDescuento.toNumber()).toBe(30000);
    });

    it('un porcentaje que no divide justo da el monto exacto', () => {
        // 30 % con tope de $ 10.000: $ 33.333,33…
        const r = descuentoConTope(d('0.3'), d(10000));

        expect(r.compraMaxima.toDecimalPlaces(2).toNumber()).toBe(33333.33);
        expect(reintegroDe(r.compraMaxima, d('0.3'), d(10000)).toNumber()).toBe(
            10000,
        );
    });

    it('valida los datos', () => {
        expect(() => descuentoConTope(d(0), tope)).toThrow();
        expect(() => descuentoConTope(d('1.5'), tope)).toThrow();
        expect(() => descuentoConTope(veintePorCiento, d(0))).toThrow();
        expect(() => descuentoConTope(veintePorCiento, tope, d(0))).toThrow();
    });
});
