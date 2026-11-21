import { describe, expect, it } from 'vite-plus/test';
import {
    calcularInteresCompuesto,
    montoFormulaCerrada,
} from './interesCompuesto';
import { D } from './numero';
import { calcularPlazoFijo, renovaciones } from './plazoFijo';
import {
    aumentar,
    descontar,
    porcentajeDe,
    quePorcentajeEs,
    valorOriginal,
    variacion,
} from './porcentajes';
import {
    convertirTasa,
    teaDesdeTna,
    teaPorRenovacion,
    tnaDesdeTea,
} from './tasas';

const redondear = (d: InstanceType<typeof D>, decimales = 2) =>
    d.toDecimalPlaces(decimales).toFixed(decimales);

describe('TNA ↔ TEA', () => {
    it('TNA 60 % mensual → TEA 79,59 %', () => {
        expect(redondear(teaDesdeTna(new D('0.6'), 12).times(100))).toBe(
            '79.59',
        );
    });

    it('TEA → TNA es la inversa', () => {
        const tea = teaDesdeTna(new D('0.35'), 365);
        expect(redondear(tnaDesdeTea(tea, 365).times(100), 10)).toBe(
            '35.0000000000',
        );
    });

    it('con capitalización anual TNA = TEA', () => {
        expect(teaDesdeTna(new D('0.4'), 1).toString()).toBe('0.4');
    });

    it('devuelve tasa periódica y mensual', () => {
        const r = convertirTasa('tna-a-tea', new D('0.6'), 12);
        expect(r.tasaPeriodica.toString()).toBe('0.05');
        expect(redondear(r.tem.times(100))).toBe('5.00');
    });

    it('rechaza TEA menor o igual a −100 %', () => {
        expect(() => tnaDesdeTea(new D(-1), 12)).toThrow();
    });
});

describe('plazo fijo', () => {
    it('interés simple base 365', () => {
        const r = calcularPlazoFijo(new D(1_000_000), new D('0.365'), 30);
        expect(r.interes.toString()).toBe('30000');
        expect(r.montoFinal.toString()).toBe('1030000');
        expect(r.tasaPeriodo.toString()).toBe('0.03');
    });

    it('la TEA renovando es mayor a la TNA', () => {
        expect(teaPorRenovacion(new D('0.365'), 30).gt('0.365')).toBe(true);
    });

    it('renovaciones reinvierten los intereses', () => {
        const filas = renovaciones(new D(1000), new D('0.365'), 30, 2);
        expect(filas[1].capitalInicial.toString()).toBe('1030');
        expect(filas[1].montoFinal.toString()).toBe('1060.9');
    });

    it('valida capital y días', () => {
        expect(() => calcularPlazoFijo(new D(0), new D('0.3'), 30)).toThrow();
        expect(() => calcularPlazoFijo(new D(10), new D('0.3'), 0)).toThrow();
    });
});

describe('interés compuesto', () => {
    const entrada = {
        capital: new D(100_000),
        tna: new D('0.4'),
        n: 12,
        anios: 3,
        aporte: new D(5_000),
    };

    it('la simulación coincide con la fórmula cerrada', () => {
        const r = calcularInteresCompuesto(entrada);
        expect(redondear(r.montoFinal, 6)).toBe(
            redondear(montoFormulaCerrada(entrada), 6),
        );
    });

    it('separa aportes e intereses', () => {
        const r = calcularInteresCompuesto(entrada);
        expect(r.totalAportado.toString()).toBe('280000');
        expect(r.interesesGanados.plus(r.totalAportado).eq(r.montoFinal)).toBe(
            true,
        );
        expect(r.porAnio).toHaveLength(3);
    });

    it('sin aportes y sin tasa no cambia', () => {
        const r = calcularInteresCompuesto({
            capital: new D(500),
            tna: new D(0),
            n: 12,
            anios: 1,
        });
        expect(r.montoFinal.toString()).toBe('500');
    });
});

describe('porcentajes', () => {
    it('el 21 % de 1000', () => {
        expect(porcentajeDe(new D(21), new D(1000)).toString()).toBe('210');
    });

    it('qué % es 50 de 200', () => {
        expect(quePorcentajeEs(new D(50), new D(200)).toString()).toBe('25');
    });

    it('variación de 80 a 100', () => {
        expect(variacion(new D(80), new D(100)).toString()).toBe('25');
        expect(variacion(new D(100), new D(80)).toString()).toBe('-20');
    });

    it('aumentos y descuentos', () => {
        expect(aumentar(new D(1000), new D(21)).toString()).toBe('1210');
        expect(descontar(new D(1000), new D(15)).toString()).toBe('850');
    });

    it('precio sin IVA', () => {
        expect(
            valorOriginal(new D(1210), new D(21), 'aumento').toString(),
        ).toBe('1000');
        expect(
            valorOriginal(new D(850), new D(15), 'descuento').toString(),
        ).toBe('1000');
    });
});
