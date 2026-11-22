import type { LucideIcon } from '@lucide/vue';
import {
    BadgePercent,
    Cake,
    Calculator,
    CalendarClock,
    CalendarDays,
    CalendarPlus,
    CalendarRange,
    ChartLine,
    ChartNoAxesCombined,
    Coins,
    CreditCard,
    FlaskConical,
    History,
    Home,
    Landmark,
    Percent,
    PiggyBank,
    ReceiptText,
    Scale,
    Sigma,
    TrendingUp,
    Wallet,
} from '@lucide/vue';

/**
 * Catálogo único de calculadoras. Lo leen la navegación, el Inicio y las
 * páginas índice de cada sección: agregar una calculadora es agregarla acá y
 * crear su ruta en routes/web.php.
 */
export type Seccion = 'basicas' | 'finanzas' | 'inflacion' | 'fechas';

export type Calculadora = {
    clave: string;
    titulo: string;
    descripcion: string;
    href: string;
    icono: LucideIcon;
    seccion: Seccion;
};

export const calculadoras: Calculadora[] = [
    {
        clave: 'basica',
        titulo: 'Calculadora',
        descripcion: 'Cuentas rápidas con historial de cada operación.',
        href: '/calculadora',
        icono: Calculator,
        seccion: 'basicas',
    },
    {
        clave: 'cientifica',
        titulo: 'Científica',
        descripcion:
            'Trigonometría, logaritmos, potencias, factorial y paréntesis.',
        href: '/cientifica',
        icono: FlaskConical,
        seccion: 'basicas',
    },
    {
        clave: 'porcentajes',
        titulo: 'Porcentajes',
        descripcion:
            'Qué % es, aumentos, descuentos, variación y precio sin IVA.',
        href: '/porcentajes',
        icono: Percent,
        seccion: 'basicas',
    },
    {
        clave: 'tna-tea',
        titulo: 'TNA ↔ TEA',
        descripcion:
            'Convertí la tasa nominal anual en efectiva anual y al revés.',
        href: '/finanzas/tna-tea',
        icono: TrendingUp,
        seccion: 'finanzas',
    },
    {
        clave: 'plazo-fijo',
        titulo: 'Plazo fijo',
        descripcion: 'Cuánto te da un plazo fijo según capital, TNA y días.',
        href: '/finanzas/plazo-fijo',
        icono: Landmark,
        seccion: 'finanzas',
    },
    {
        clave: 'interes-compuesto',
        titulo: 'Interés compuesto',
        descripcion:
            'Cómo crece un capital con reinversión y aportes periódicos.',
        href: '/finanzas/interes-compuesto',
        icono: PiggyBank,
        seccion: 'finanzas',
    },
    {
        clave: 'rendimiento-cuenta',
        titulo: 'Rendimiento de tu cuenta',
        descripcion:
            'Cuánto te rinde por día la plata en Mercado Pago o tu banco.',
        href: '/finanzas/rendimiento-cuenta',
        icono: Wallet,
        seccion: 'finanzas',
    },
    {
        clave: 'interes-en-cuotas',
        titulo: 'Interés en cuotas',
        descripcion: 'Qué tasa pagás de verdad en una compra en cuotas.',
        href: '/finanzas/interes-en-cuotas',
        icono: CreditCard,
        seccion: 'finanzas',
    },
    {
        clave: 'contado-vs-cuotas',
        titulo: 'Contado vs. cuotas',
        descripcion: 'Qué conviene según lo que rinde tu plata y la inflación.',
        href: '/finanzas/contado-vs-cuotas',
        icono: Scale,
        seccion: 'finanzas',
    },
    {
        clave: 'descuento-con-tope',
        titulo: 'Descuento con tope',
        descripcion:
            'Cuánto gastar para aprovechar entero un reintegro con tope.',
        href: '/finanzas/descuento-con-tope',
        icono: BadgePercent,
        seccion: 'finanzas',
    },
    {
        clave: 'inflacion-ipc',
        titulo: 'Actualizar por IPC',
        descripcion:
            'Llevá un monto de un mes a otro con el IPC oficial del INDEC.',
        href: '/inflacion/ipc',
        icono: ReceiptText,
        seccion: 'inflacion',
    },
    {
        clave: 'inflacion-acumulada',
        titulo: 'Inflación acumulada',
        descripcion:
            'Cuánto suma una inflación mensual pareja en varios meses.',
        href: '/inflacion/acumulada',
        icono: Sigma,
        seccion: 'inflacion',
    },
    {
        clave: 'actualizar-monto',
        titulo: 'Actualizar un monto',
        descripcion:
            'Un monto a valores de hoy con el % de inflación del período.',
        href: '/inflacion/actualizar-monto',
        icono: Coins,
        seccion: 'inflacion',
    },
    {
        clave: 'serie-inflacion',
        titulo: 'Inflación mensual',
        descripcion:
            'La serie del INDEC mes a mes: mensual, interanual y acumulada.',
        href: '/inflacion/serie-mensual',
        icono: ChartLine,
        seccion: 'inflacion',
    },
    {
        clave: 'cer',
        titulo: 'Índice CER',
        descripcion: 'Valores diarios del CER del BCRA y su variación.',
        href: '/inflacion/cer',
        icono: ChartNoAxesCombined,
        seccion: 'inflacion',
    },
    {
        clave: 'uva',
        titulo: 'Valor de la UVA',
        descripcion: 'Valores diarios de la UVA del BCRA y su variación.',
        href: '/inflacion/uva',
        icono: Home,
        seccion: 'inflacion',
    },
    {
        clave: 'dias-entre-fechas',
        titulo: 'Días entre fechas',
        descripcion:
            'Días corridos, semanas y años/meses/días entre dos fechas.',
        href: '/fechas/dias-entre-fechas',
        icono: CalendarRange,
        seccion: 'fechas',
    },
    {
        clave: 'dias-habiles',
        titulo: 'Días hábiles',
        descripcion:
            'Sumá, restá o contá días hábiles con los feriados de Argentina.',
        href: '/fechas/dias-habiles',
        icono: CalendarClock,
        seccion: 'fechas',
    },
    {
        clave: 'sumar-restar',
        titulo: 'Sumar o restar',
        descripcion: 'Sumá o restá días, semanas, meses o años a una fecha.',
        href: '/fechas/sumar-restar',
        icono: CalendarPlus,
        seccion: 'fechas',
    },
    {
        clave: 'edad',
        titulo: 'Edad',
        descripcion: 'Edad exacta en años, meses y días, y próximo cumpleaños.',
        href: '/fechas/edad',
        icono: Cake,
        seccion: 'fechas',
    },
];

export const titulosSeccion: Record<Seccion, string> = {
    basicas: 'Calculadoras',
    finanzas: 'Finanzas',
    inflacion: 'Inflación',
    fechas: 'Fechas',
};

export function deSeccion(seccion: Seccion): Calculadora[] {
    return calculadoras.filter((c) => c.seccion === seccion);
}

export function buscarCalculadora(clave: string): Calculadora | undefined {
    return calculadoras.find((c) => c.clave === clave);
}

/** Navegación principal: barra inferior en el celular, menú en escritorio. */
export type ItemNav = {
    titulo: string;
    href: string;
    icono: LucideIcon;
    /** Rutas que marcan este ítem como activo (por prefijo). */
    activoEn: string[];
    /**
     * Solo desde xl en el menú de escritorio: entre lg y xl, con letra
     * grande, no entran todos.
     */
    soloXl?: boolean;
};

export const navegacion: ItemNav[] = [
    {
        titulo: 'Calculadora',
        href: '/calculadora',
        icono: Calculator,
        activoEn: ['/calculadora'],
    },
    {
        titulo: 'Científica',
        href: '/cientifica',
        icono: FlaskConical,
        activoEn: ['/cientifica'],
    },
    {
        titulo: 'Finanzas',
        href: '/finanzas',
        icono: TrendingUp,
        // En el celular, Inflación se abre desde Finanzas.
        activoEn: ['/finanzas', '/porcentajes', '/inflacion'],
    },
    {
        titulo: 'Fechas',
        href: '/fechas',
        icono: CalendarDays,
        activoEn: ['/fechas'],
    },
    {
        titulo: 'Historial',
        href: '/historial',
        icono: History,
        activoEn: ['/historial'],
    },
];
