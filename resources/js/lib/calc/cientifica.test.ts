import { describe, expect, it } from 'vite-plus/test';
import type { ResultadoCientifica } from './cientifica';
import { calcular, traducir } from './cientifica';
import { formatearNumero } from './numero';

function valor(r: ResultadoCientifica): string {
    if (!r.ok) {
        throw new Error(r.error);
    }

    return formatearNumero(r.valor, { maxDecimales: 10 });
}

describe('científica', () => {
    it('traduce los símbolos visibles', () => {
        expect(traducir('2×π÷√(4)−1,5')).toBe('2*pi/sqrt(4)-1.5');
        expect(traducir('log(8;2')).toBe('log(8,2)');
    });

    it('trigonometría en grados con valores exactos', () => {
        expect(valor(calcular('sin(30)'))).toBe('0,5');
        expect(valor(calcular('sin(180)'))).toBe('0');
        expect(valor(calcular('cos(90)'))).toBe('0');
        expect(valor(calcular('tan(45)'))).toBe('1');
    });

    it('tan(90°) no está definida', () => {
        const r = calcular('tan(90)');
        expect(r.ok).toBe(false);
    });

    it('trigonometría en radianes', () => {
        expect(valor(calcular('sin(π÷2)', 'RAD'))).toBe('1');
    });

    it('inversas devuelven grados en modo DEG', () => {
        expect(valor(calcular('asin(0,5)'))).toBe('30');
    });

    it('logaritmos', () => {
        expect(valor(calcular('log(1000)'))).toBe('3');
        expect(valor(calcular('ln(e)'))).toBe('1');
        expect(valor(calcular('log(8;2)'))).toBe('3');
    });

    it('potencias, raíces y factorial', () => {
        expect(valor(calcular('2^10'))).toBe('1.024');
        expect(valor(calcular('∛(27)'))).toBe('3');
        expect(valor(calcular('5!'))).toBe('120');
    });

    it('precedencia y paréntesis sin cerrar', () => {
        expect(valor(calcular('2+3×(4−1'))).toBe('11');
    });

    it('usa Ans', () => {
        expect(valor(calcular('Ans×2', 'DEG', '21'))).toBe('42');
    });

    it('errores en español', () => {
        const raiz = calcular('√(−1)');
        expect(raiz.ok).toBe(false);
        expect(calcular('2,5!').ok).toBe(false);
        expect(calcular('2+').ok).toBe(false);
        expect(calcular('').ok).toBe(false);
    });

    it('no permite evaluar código', () => {
        expect(calcular('evaluate("1+1")').ok).toBe(false);
        expect(calcular('import({}, {})').ok).toBe(false);
    });
});
