import type { LucideIcon } from '@lucide/vue';
import {
    Cake,
    Calculator,
    CalendarClock,
    CalendarDays,
    CalendarPlus,
    CalendarRange,
    FlaskConical,
    History,
    Landmark,
    Percent,
    PiggyBank,
    TrendingUp,
} from '@lucide/vue';

/**
 * Catálogo único de calculadoras. Lo leen la navegación, el Inicio y las
 * páginas índice de cada sección: agregar una calculadora es agregarla acá y
 * crear su ruta en routes/web.php.
 */
export type Seccion = 'basicas' | 'finanzas' | 'fechas';

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
        activoEn: ['/finanzas', '/porcentajes'],
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
