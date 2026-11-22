import { describe, expect, it } from 'vite-plus/test';
import { armarCsv, numeroCsv } from './csv';
import { D } from './calc/numero';

describe('csv', () => {
    it('usa punto y coma, BOM y comillas cuando hace falta', () => {
        const csv = armarCsv(
            ['Mes', 'Nota'],
            [['2026-10', 'dijo "hola"; chau']],
        );

        expect(csv.startsWith('﻿Mes;Nota\r\n')).toBe(true);
        expect(csv).toContain('2026-10;"dijo ""hola""; chau"');
    });

    it('números con coma decimal y sin miles', () => {
        expect(numeroCsv(new D('12785.9321'))).toBe('12785,9321');
        expect(numeroCsv(null)).toBe('');
    });
});
