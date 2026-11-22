import { describe, expect, it } from 'vite-plus/test';
import type { PuntoIndice } from './inflacion';
import {
    acumuladaDeMeses,
    actualizarMonto,
    actualizarPorIpc,
    filasMensuales,
    inflacionAcumulada,
    mesesEntre,
    nombreMes,
    nombreMesCorto,
    porMes,
    resumenPeriodo,
    sumarMeses,
} from './inflacion';
import { D } from './numero';

const d = (v: string | number) => new D(v);

/** IPC real del INDEC (base dic-2016 = 100), primeros meses. */
const IPC: PuntoIndice[] = [
    ['2016-12-01', '100'],
    ['2017-01-01', '101.5859'],
    ['2017-02-01', '103.6859'],
    ['2017-03-01', '106.1476'],
].map(([fecha, valor]) => ({ fecha, valor: d(valor) }));

describe('meses', () => {
    it('suma y resta meses cruzando el año', () => {
        expect(sumarMeses('2026-11', 3)).toBe('2027-02');
        expect(sumarMeses('2027-01', -1)).toBe('2026-12');
        expect(sumarMeses('2026-01', -12)).toBe('2025-01');
    });

    it('cuenta meses entre dos', () => {
        expect(mesesEntre('2016-12', '2026-10')).toBe(118);
        expect(mesesEntre('2026-10', '2026-01')).toBe(-9);
    });

    it('nombra el mes en castellano', () => {
        expect(nombreMes('2026-10')).toBe('octubre de 2026');
        expect(nombreMesCorto('2026-09')).toBe('sep 2026');
    });
});

describe('inflación acumulada con tasa constante', () => {
    it('5 % mensual en 12 meses es 79,59 %, no 60 %', () => {
        const r = inflacionAcumulada(d('0.05'), 12);

        expect(r.acumulada.toDecimalPlaces(6).toNumber()).toBe(0.795856);
        expect(r.sumaSimple.toNumber()).toBe(0.6);
        expect(r.anualEquivalente.toDecimalPlaces(6).toNumber()).toBe(0.795856);
    });

    it('un mes es la misma tasa', () => {
        expect(inflacionAcumulada(d('0.021'), 1).acumulada.toNumber()).toBe(
            0.021,
        );
    });

    it('rechaza tasas imposibles y meses no enteros', () => {
        expect(() => inflacionAcumulada(d(-1), 3)).toThrow();
        expect(() => inflacionAcumulada(d('0.02'), 1.5)).toThrow();
        expect(() => inflacionAcumulada(d('0.02'), 0)).toThrow();
    });
});

describe('actualizar un monto con un porcentaje', () => {
    it('$100.000 con 150 % da $250.000', () => {
        const r = actualizarMonto(d(100000), d('1.5'));

        expect(r.montoFinal.toNumber()).toBe(250000);
        expect(r.diferencia.toNumber()).toBe(150000);
    });

    it('con 100 % de inflación se pierde la mitad del poder de compra', () => {
        expect(
            actualizarMonto(d(1), d(1)).poderDeCompraPerdido.toNumber(),
        ).toBe(0.5);
    });

    it('rechaza −100 % o menos', () => {
        expect(() => actualizarMonto(d(1), d(-1))).toThrow();
    });
});

describe('IPC', () => {
    it('variación mensual e interanual desde el número índice', () => {
        const filas = filasMensuales(IPC);

        expect(filas[0].mensual).toBeNull();
        expect(filas[1].mensual!.toDecimalPlaces(6).toNumber()).toBe(0.015859);
        expect(filas[3].interanual).toBeNull();
    });

    it('acumulada de enero a marzo de 2017 (los dos incluidos)', () => {
        const r = acumuladaDeMeses(porMes(IPC), '2017-01', '2017-03');

        expect(r.toDecimalPlaces(6).toNumber()).toBe(0.061476);
    });

    it('acumulada sin el mes anterior al inicio avisa', () => {
        expect(() =>
            acumuladaDeMeses(porMes(IPC), '2016-12', '2017-03'),
        ).toThrow(/No hay datos/);
    });

    it('actualiza un monto con el cociente de índices', () => {
        const r = actualizarPorIpc(d(1000), '2016-12', '2017-03', porMes(IPC));

        expect(r.montoFinal.toDecimalPlaces(3).toNumber()).toBe(1061.476);
        expect(r.meses).toBe(3);
    });

    it('hacia atrás el coeficiente es menor a 1', () => {
        const r = actualizarPorIpc(
            d(1061.476),
            '2017-03',
            '2016-12',
            porMes(IPC),
        );

        expect(r.montoFinal.toDecimalPlaces(6).toNumber()).toBe(1000);
        expect(r.coeficiente.lt(1)).toBe(true);
    });

    it('un mes sin publicar da un error claro', () => {
        expect(() =>
            actualizarPorIpc(d(1), '2016-12', '2017-04', porMes(IPC)),
        ).toThrow('Todavía no hay IPC de abril de 2017');
    });
});

describe('series diarias', () => {
    const CER: PuntoIndice[] = [
        ['2026-11-19', '873'],
        ['2026-11-20', '873.6111'],
        ['2026-11-21', '874.2226'],
        ['2026-11-22', '875.1257'],
    ].map(([fecha, valor]) => ({ fecha, valor: d(valor) }));

    it('resume un período y la variación diaria usa el registro anterior', () => {
        const r = resumenPeriodo(CER, '2026-11-20', '2026-11-22')!;

        expect(r.filas).toHaveLength(3);
        expect(r.primero.variacion!.toDecimalPlaces(6).toNumber()).toBe(0.0007);
        expect(r.variacion.toDecimalPlaces(6).toNumber()).toBe(0.001734);
    });

    it('un período sin registros da null', () => {
        expect(resumenPeriodo(CER, '2020-01-01', '2020-02-01')).toBeNull();
    });
});
