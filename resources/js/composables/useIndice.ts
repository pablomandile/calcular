import { onMounted, ref, shallowRef } from 'vue';
import type { PuntoIndice } from '@/lib/calc/inflacion';
import { D } from '@/lib/calc/numero';
import { almacenLocal } from '@/lib/navegador';

/**
 * Series oficiales (IPC del INDEC, CER y UVA del BCRA) desde
 * /api/indices/{serie}. Cada serie se pide una vez por visita y queda
 * guardada en el navegador: sin conexión se usa lo último que se bajó.
 */
export type NombreSerie = 'ipc' | 'cer' | 'uva';

type Respuesta = {
    serie: NombreSerie;
    nombre: string;
    mensual: boolean;
    ultimo: string | null;
    valores: [string, string][];
};

export type DatosSerie = {
    nombre: string;
    mensual: boolean;
    /** Fecha del último valor publicado. */
    ultimo: string;
    puntos: PuntoIndice[];
    /** true si no hubo conexión y se usa la copia guardada. */
    guardada: boolean;
};

const PREFIJO = 'calcular.indices.';
const cache = new Map<NombreSerie, Promise<DatosSerie | null>>();

function convertir(r: Respuesta, guardada: boolean): DatosSerie | null {
    if (!r.ultimo || r.valores.length === 0) {
        return null;
    }

    return {
        nombre: r.nombre,
        mensual: r.mensual,
        ultimo: r.ultimo,
        puntos: r.valores.map(([fecha, valor]) => ({
            fecha,
            valor: new D(valor),
        })),
        guardada,
    };
}

async function pedir(serie: NombreSerie): Promise<DatosSerie | null> {
    try {
        const r = await fetch(`/api/indices/${serie}`, {
            headers: { Accept: 'application/json' },
        });

        if (!r.ok) {
            throw new Error(String(r.status));
        }

        const texto = await r.text();
        const datos = convertir(JSON.parse(texto) as Respuesta, false);

        if (datos) {
            almacenLocal.guardar(PREFIJO + serie, texto);
        }

        return datos;
    } catch {
        const guardado = almacenLocal.leer(PREFIJO + serie);
        const datos = guardado
            ? convertir(JSON.parse(guardado) as Respuesta, true)
            : null;

        if (!datos) {
            // Se puede volver a intentar en la próxima pantalla.
            cache.delete(serie);
        }

        return datos;
    }
}

export function obtenerSerie(serie: NombreSerie): Promise<DatosSerie | null> {
    if (!cache.has(serie)) {
        cache.set(serie, pedir(serie));
    }

    return cache.get(serie)!;
}

export function useIndice(serie: NombreSerie) {
    const datos = shallowRef<DatosSerie | null>(null);
    const cargando = ref(true);

    onMounted(async () => {
        datos.value = await obtenerSerie(serie);
        cargando.value = false;
    });

    return { datos, cargando };
}
