import { describe, expect, it } from 'vite-plus/test';
import type { EstadoBasica, Operador } from './basica';
import {
    borrar,
    cambiarSigno,
    coma,
    digito,
    estadoInicial,
    igual,
    memoriaRecuperar,
    memoriaSumar,
    operador,
    pantalla,
    porcentaje,
} from './basica';

/** Tipea una secuencia: "12+3×2=" */
function tipear(secuencia: string, e: EstadoBasica = estadoInicial()) {
    let registro = null;

    for (const c of secuencia) {
        if (/\d/.test(c)) {
            e = digito(e, c);
        } else if (c === ',') {
            e = coma(e);
        } else if ('+−×÷'.includes(c)) {
            e = operador(e, c as Operador);
        } else if (c === '%') {
            e = porcentaje(e);
        } else if (c === '±') {
            e = cambiarSigno(e);
        } else if (c === '⌫') {
            e = borrar(e);
        } else if (c === '=') {
            const r = igual(e);
            e = r.estado;
            registro = r.registro ?? registro;
        }
    }

    return { e, registro };
}

describe('calculadora básica', () => {
    it('respeta la precedencia', () => {
        const { e, registro } = tipear('2+3×4=');
        expect(pantalla(e)).toBe('14');
        expect(registro).toEqual({ expresion: '2 + 3 × 4', resultado: '14' });
    });

    it('suma decimales sin error de coma flotante', () => {
        expect(pantalla(tipear('0,1+0,2=').e)).toBe('0,3');
    });

    it('divide con muchos decimales', () => {
        expect(pantalla(tipear('1÷3=').e)).toBe('0,333333333333');
    });

    it('avisa la división por cero', () => {
        const { e, registro } = tipear('5÷0=');
        expect(e.error).toBe('No se puede dividir por cero');
        expect(registro).toBeNull();
    });

    it('reemplaza el operador si se tocan dos seguidos', () => {
        expect(pantalla(tipear('8+×2=').e)).toBe('16');
    });

    it('ignora el operador colgado al final', () => {
        expect(pantalla(tipear('8+2+=').e)).toBe('10');
    });

    it('sigue operando sobre el resultado', () => {
        expect(pantalla(tipear('2+3=×10=').e)).toBe('50');
    });

    it('un dígito después de = arranca de cero', () => {
        expect(pantalla(tipear('2+3=7').e)).toBe('7');
    });

    it('porcentaje sobre lo acumulado en sumas', () => {
        expect(pantalla(tipear('200+10%=').e)).toBe('220');
        expect(pantalla(tipear('200−10%=').e)).toBe('180');
    });

    it('porcentaje como fracción en productos', () => {
        expect(pantalla(tipear('200×10%=').e)).toBe('20');
        expect(pantalla(tipear('50%').e)).toBe('0,5');
    });

    it('después del % un dígito reemplaza el número pero no la cuenta', () => {
        expect(pantalla(tipear('100+5%7=').e)).toBe('107');
    });

    it('cambia el signo', () => {
        expect(pantalla(tipear('5±+3=').e)).toBe('−2');
    });

    it('borra el último dígito y el operador', () => {
        expect(pantalla(tipear('123⌫').e)).toBe('12');
        expect(pantalla(tipear('12+⌫⌫').e)).toBe('1');
    });

    it('muestra la entrada con miles mientras se tipea', () => {
        expect(pantalla(tipear('1234567,5').e)).toBe('1.234.567,5');
        expect(pantalla(tipear('12,').e)).toBe('12,');
    });

    it('la memoria no rompe la cuenta en curso', () => {
        let { e } = tipear('5=');
        e = memoriaSumar(e);
        e = tipear('10+', e).e;
        e = memoriaRecuperar(e);
        e = tipear('=', e).e;
        expect(pantalla(e)).toBe('15');
    });
});
