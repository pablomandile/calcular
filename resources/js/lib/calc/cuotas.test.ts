import { describe, expect, it } from 'vite-plus/test';
import type { Plan } from './cuotas';
import {
    contadoVsCuotas,
    interesEnCuotas,
    mensualDesdeAnual,
    tasaImplicitaMensual,
    valorPresenteCuotas,
} from './cuotas';
import { D } from './numero';

const d = (v: string | number) => new D(v);

const doceDe110mil: Plan = {
    cuotas: 12,
    valorCuota: d(110000),
    primeraDias: 30,
    frecuenciaDias: 30,
};

describe('valor presente de las cuotas', () => {
    it('a tasa 0 es la suma', () => {
        expect(valorPresenteCuotas(doceDe110mil, d(0)).toNumber()).toBe(
            1320000,
        );
    });

    it('coincide con la fórmula de la renta cuando son mensuales', () => {
        const r = d('0.0375');
        const renta = d(110000).times(d(1).minus(d(1).plus(r).pow(-12)).div(r));

        expect(
            valorPresenteCuotas(doceDe110mil, r).minus(renta).abs().lt('1e-20'),
        ).toBe(true);
    });

    it('una cuota en el momento no se descuenta', () => {
        const plan: Plan = { ...doceDe110mil, cuotas: 1, primeraDias: 0 };

        expect(valorPresenteCuotas(plan, d('0.5')).toNumber()).toBe(110000);
    });
});

describe('interés en cuotas', () => {
    it('$1.000.000 en 12 cuotas de $110.000: 4,55 % mensual, 70,6 % TEA', () => {
        const r = interesEnCuotas(d(1000000), doceDe110mil);

        expect(r.tasaMensual.toDecimalPlaces(4).toNumber()).toBe(0.0455);
        expect(r.tea.toDecimalPlaces(3).toNumber()).toBe(0.706);
        expect(r.recargo.toNumber()).toBe(320000);
        expect(r.recargoPorcentaje.toNumber()).toBe(0.32);
        // La tasa encontrada devuelve exactamente el monto.
        expect(
            valorPresenteCuotas(doceDe110mil, r.tasaMensual)
                .minus(1000000)
                .abs()
                .lt('1e-6'),
        ).toBe(true);
    });

    it('cuotas sin interés de verdad: tasa 0', () => {
        const plan: Plan = { ...doceDe110mil, valorCuota: d(100000) };

        expect(tasaImplicitaMensual(d(1200000), plan).toNumber()).toBe(0);
    });

    it('pagar menos que el monto da una tasa negativa (un descuento)', () => {
        const plan: Plan = { ...doceDe110mil, valorCuota: d(90000) };

        expect(tasaImplicitaMensual(d(1200000), plan).isNegative()).toBe(true);
    });

    it('la primera cuota en el momento sube la tasa', () => {
        const hoy = tasaImplicitaMensual(d(1000000), {
            ...doceDe110mil,
            primeraDias: 0,
        });
        const a30 = tasaImplicitaMensual(d(1000000), doceDe110mil);

        expect(hoy.gt(a30)).toBe(true);
    });

    it('valida los datos', () => {
        expect(() =>
            tasaImplicitaMensual(d(1000), { ...doceDe110mil, cuotas: 0 }),
        ).toThrow();
        expect(() =>
            tasaImplicitaMensual(d(1000), {
                ...doceDe110mil,
                valorCuota: d(0),
            }),
        ).toThrow();
        expect(() => tasaImplicitaMensual(d(0), doceDe110mil)).toThrow();
    });
});

describe('contado vs cuotas', () => {
    const base = {
        contado: d(1200000),
        anticipo: d(200000),
        costos: d(0),
        plan: doceDe110mil,
        oportunidadMensual: mensualDesdeAnual(d('0.45'), 'tna'),
        inflacionMensual: d('0.03'),
    };

    it('con 45 % TNA de rendimiento conviene el contado', () => {
        const r = contadoVsCuotas(base);

        expect(r.totalNominal.toNumber()).toBe(1520000);
        expect(r.conviene).toBe('contado');
        expect(r.valorPresente.toDecimalPlaces(2).toNumber()).toBe(1247496.33);
        expect(r.diferencia.gt(0)).toBe(true);
        // Financia 1.000.000 con las mismas cuotas: la misma tasa.
        expect(r.tasaImplicitaMensual.toDecimalPlaces(4).toNumber()).toBe(
            0.0455,
        );
    });

    it('si tu plata rinde más que la tasa del plan, conviene en cuotas', () => {
        const r = contadoVsCuotas({
            ...base,
            oportunidadMensual: d('0.06'),
        });

        expect(r.conviene).toBe('cuotas');
        expect(r.diferencia.isNegative()).toBe(true);
    });

    it('el costo en pesos de hoy usa la inflación', () => {
        const r = contadoVsCuotas(base);
        const esperado = d(200000).plus(
            valorPresenteCuotas(doceDe110mil, d('0.03')),
        );

        expect(r.costoReal!.eq(esperado)).toBe(true);
        expect(
            contadoVsCuotas({ ...base, inflacionMensual: null }).costoReal,
        ).toBeNull();
    });

    it('los costos al inicio cuentan como pago y suben la tasa', () => {
        const sin = contadoVsCuotas(base);
        const con = contadoVsCuotas({ ...base, costos: d(30000) });

        expect(con.tasaImplicitaMensual.gt(sin.tasaImplicitaMensual)).toBe(
            true,
        );
        expect(con.valorPresente.minus(sin.valorPresente).toNumber()).toBe(
            30000,
        );
    });

    it('un anticipo que cubre todo es un error claro', () => {
        expect(() =>
            contadoVsCuotas({ ...base, anticipo: d(1200000) }),
        ).toThrow(/no queda nada financiado/);
    });
});

describe('tasa de oportunidad', () => {
    it('TNA con capitalización mensual: dividir por 12', () => {
        expect(mensualDesdeAnual(d('0.45'), 'tna').toNumber()).toBe(0.0375);
    });

    it('TEA: la mensual equivalente', () => {
        const m = mensualDesdeAnual(d('0.5'), 'tea');

        expect(
            d(1).plus(m).pow(12).minus(1).toDecimalPlaces(12).toNumber(),
        ).toBe(0.5);
    });
});
