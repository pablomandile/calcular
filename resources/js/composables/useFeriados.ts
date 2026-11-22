import { ref } from 'vue';
import type { Feriado } from '@/lib/calc/diasHabiles';
import { almacenLocal } from '@/lib/navegador';

/**
 * Feriados de Argentina por año, desde /api/feriados/{año}. Cada año se pide
 * una sola vez y queda guardado en el navegador: sin conexión se usa lo
 * último que se bajó.
 */
type Anio = { disponible: boolean; feriados: Feriado[] };

const cache = new Map<number, Promise<Anio>>();
const PREFIJO = 'calcular.feriados.';

async function pedir(anio: number): Promise<Anio> {
    try {
        const r = await fetch(`/api/feriados/${anio}`, {
            headers: { Accept: 'application/json' },
        });

        if (!r.ok) {
            throw new Error(String(r.status));
        }

        const datos = (await r.json()) as Anio;

        if (datos.disponible) {
            almacenLocal.guardar(PREFIJO + anio, JSON.stringify(datos));
        }

        return datos;
    } catch {
        const guardado = almacenLocal.leer(PREFIJO + anio);

        if (guardado) {
            return JSON.parse(guardado) as Anio;
        }

        // Se puede volver a intentar más tarde.
        cache.delete(anio);

        return { disponible: false, feriados: [] };
    }
}

export function useFeriados() {
    const cargando = ref(false);
    /** Años pedidos que no tienen calendario (para avisar). */
    const sinDatos = ref<number[]>([]);

    async function obtener(anios: number[]): Promise<Feriado[]> {
        cargando.value = true;

        try {
            const unicos = [...new Set(anios)];
            const resultados = await Promise.all(
                unicos.map((a) => {
                    if (!cache.has(a)) {
                        cache.set(a, pedir(a));
                    }

                    return cache.get(a)!;
                }),
            );

            sinDatos.value = unicos.filter((_, i) => !resultados[i].disponible);

            return resultados.flatMap((r) => r.feriados);
        } finally {
            cargando.value = false;
        }
    }

    return { obtener, cargando, sinDatos };
}
