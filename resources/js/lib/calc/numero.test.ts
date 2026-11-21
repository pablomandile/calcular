import { describe, expect, it } from 'vite-plus/test';
import {
    D,
    formatearNumero,
    formatearPesos,
    formatearPorcentaje,
    parsearNumero,
} from './numero';

describe('parsearNumero', () => {
    it.each([
        ['1.234,56', '1234.56'],
        ['1234,5', '1234.5'],
        ['1.234', '1234'],
        ['1.234.567', '1234567'],
        ['1.5', '1.5'],
        ['1.2345', '1.2345'],
        ['-3', '-3'],
        ['−3,5', '-3.5'],
        ['$ 1.000', '1000'],
        ['21 %', '21'],
        [',5', '0.5'],
    ])('"%s" → %s', (texto, esperado) => {
        expect(parsearNumero(texto)?.toString()).toBe(esperado);
    });

    it.each(['', '-', 'abc', '1,2,3', '1..2', null, undefined])(
        'rechaza %s',
        (texto) => {
            expect(parsearNumero(texto)).toBeNull();
        },
    );
});

describe('formatearNumero', () => {
    it('usa punto de miles y coma decimal', () => {
        expect(formatearNumero('1234567.891')).toBe('1.234.567,891');
    });

    it('0,1 + 0,2 da 0,3 exacto', () => {
        expect(formatearNumero(new D('0.1').plus('0.2'))).toBe('0,3');
    });

    it('redondea y completa decimales', () => {
        expect(formatearNumero('2.005', { maxDecimales: 2 })).toBe('2,01');
        expect(formatearNumero('2', { minDecimales: 2 })).toBe('2,00');
    });

    it('usa el signo menos tipográfico', () => {
        expect(formatearNumero('-1500')).toBe('−1.500');
    });

    it('pasa a notación científica fuera de rango', () => {
        expect(formatearNumero('1.5e18')).toBe('1,5 × 10¹⁸');
        expect(formatearNumero('2e-12')).toBe('2 × 10⁻¹²');
    });

    it('formatea porcentajes y pesos', () => {
        expect(formatearPorcentaje('0.795856')).toBe('79,59 %');
        expect(formatearPesos('1234.5')).toBe('$ 1.234,50');
    });
});
