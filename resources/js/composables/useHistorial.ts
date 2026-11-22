import { createStore, del, get, set } from 'idb-keyval';
import type { UseStore } from 'idb-keyval';
import { computed, ref } from 'vue';
import { uuid } from '@/lib/navegador';

/**
 * Historial de cálculos. Vive en IndexedDB de este dispositivo; con sesión
 * iniciada, además se sincroniza con la cuenta (ver sincronizacion.ts).
 *
 * El estado es un singleton de módulo: todas las páginas ven la misma lista.
 */
export type TipoCalculo =
    | 'basica'
    | 'cientifica'
    | 'porcentajes'
    | 'tna-tea'
    | 'plazo-fijo'
    | 'interes-compuesto'
    | 'interes-en-cuotas'
    | 'contado-vs-cuotas'
    | 'descuento-con-tope'
    | 'inflacion-ipc'
    | 'inflacion-acumulada'
    | 'actualizar-monto'
    | 'dias-entre-fechas'
    | 'dias-habiles'
    | 'sumar-restar'
    | 'edad';

export type Calculo = {
    id: string;
    tipo: TipoCalculo;
    /** Qué se calculó, legible: "2 + 3 × 4", "TNA 60 % · mensual". */
    titulo: string;
    /** Resultado principal, ya formateado: "14", "TEA 79,59 %". */
    resultado: string;
    /** Datos para volver a abrir la calculadora con lo mismo ("Reusar"). */
    entrada: Record<string, unknown>;
    nota: string | null;
    /** ISO 8601 con hora. */
    creado_en: string;
    /** Última edición de la nota: entre dispositivos gana la más reciente. */
    actualizado_en?: string | null;
};

export type NuevoCalculo = Pick<
    Calculo,
    'tipo' | 'titulo' | 'resultado' | 'entrada'
>;

export const MAX_LOCAL = 500;
const CLAVE = 'calculos';

let store: UseStore | null = null;

function almacen(): UseStore | null {
    if (typeof indexedDB === 'undefined') {
        return null;
    }

    store ??= createStore('calcular', 'historial');

    return store;
}

const items = ref<Calculo[]>([]);
const cargado = ref(false);
let carga: Promise<void> | null = null;

/** Hooks que registra la sincronización con la cuenta (fase de cuentas). */
type Oyentes = {
    alAgregar?: (c: Calculo) => void;
    alActualizar?: (c: Calculo) => void;
    alEliminar?: (id: string) => void;
    alVaciar?: () => void;
};
const oyentes: Oyentes = {};

export function registrarOyentes(o: Oyentes): void {
    Object.assign(oyentes, o);
}

async function persistir(): Promise<void> {
    const s = almacen();

    if (!s) {
        return;
    }

    try {
        // Copia plana: IndexedDB no acepta los Proxy reactivos de Vue.
        await set(CLAVE, JSON.parse(JSON.stringify(items.value)), s);
    } catch {
        // Sin almacenamiento (modo privado): el historial dura la sesión.
    }
}

function ordenar(lista: Calculo[]): Calculo[] {
    return [...lista]
        .sort((a, b) => b.creado_en.localeCompare(a.creado_en))
        .slice(0, MAX_LOCAL);
}

export function cargarHistorial(): Promise<void> {
    carga ??= (async () => {
        const s = almacen();

        if (s) {
            try {
                const guardados = await get<Calculo[]>(CLAVE, s);
                // Lo agregado antes de terminar de cargar no se pierde.
                items.value = ordenar([...items.value, ...(guardados ?? [])]);
            } catch {
                // Ídem persistir().
            }
        }

        cargado.value = true;
    })();

    return carga;
}

/** La copia local tal como está (la usa la sincronización). */
export function historialLocal(): Calculo[] {
    return items.value;
}

/** Reemplaza la lista local entera (la usa la sincronización). */
export async function reemplazarHistorial(lista: Calculo[]): Promise<void> {
    items.value = ordenar(lista);
    await persistir();
}

export function useHistorial() {
    void cargarHistorial();

    function agregar(nuevo: NuevoCalculo): Calculo {
        const calculo: Calculo = {
            ...nuevo,
            entrada: JSON.parse(JSON.stringify(nuevo.entrada)),
            id: uuid(),
            nota: null,
            creado_en: new Date().toISOString(),
        };
        items.value = ordenar([calculo, ...items.value]);
        void persistir();
        oyentes.alAgregar?.(calculo);

        return calculo;
    }

    function actualizarNota(id: string, nota: string): void {
        const c = items.value.find((x) => x.id === id);

        if (!c) {
            return;
        }

        c.nota = nota.trim() === '' ? null : nota.trim();
        c.actualizado_en = new Date().toISOString();
        void persistir();
        oyentes.alActualizar?.(c);
    }

    function eliminar(id: string): void {
        items.value = items.value.filter((x) => x.id !== id);
        void persistir();
        oyentes.alEliminar?.(id);
    }

    async function vaciar(): Promise<void> {
        items.value = [];
        const s = almacen();

        if (s) {
            try {
                await del(CLAVE, s);
            } catch {
                // Ídem persistir().
            }
        }

        oyentes.alVaciar?.();
    }

    function buscar(id: string): Calculo | undefined {
        return items.value.find((x) => x.id === id);
    }

    function deTipo(tipo: TipoCalculo, limite = 20) {
        return computed(() =>
            items.value.filter((x) => x.tipo === tipo).slice(0, limite),
        );
    }

    return {
        items,
        cargado,
        agregar,
        actualizarNota,
        eliminar,
        vaciar,
        buscar,
        deTipo,
    };
}
