import type { Calculo } from '@/composables/useHistorial';
import {
    cargarHistorial,
    historialLocal,
    reemplazarHistorial,
    registrarOyentes,
} from '@/composables/useHistorial';
import { almacenLocal } from '@/lib/navegador';

/**
 * Sincronización del historial del dispositivo con la cuenta.
 *
 * - Sin sesión no se sincroniza nada: el historial vive solo en el dispositivo.
 * - Al entrar, lo que se calculó sin cuenta se suma a la cuenta. Si lo que hay
 *   en el dispositivo es de OTRA cuenta (la sesión venció sin cerrar), se
 *   descarta: nunca se sube a una cuenta ajena.
 * - Cada cambio (cálculo nuevo, nota, borrado, vaciar) queda anotado como
 *   pendiente y se manda en lote; sin conexión espera a que vuelva la red.
 * - Al cerrar la sesión se borra la copia local (limpiarDatosLocales).
 */
const CLAVE_PENDIENTES = 'calcular.sync.pendientes';
const CLAVE_USUARIO = 'calcular.sync.usuario';
const ESPERA_MS = 1200;

type Pendientes = {
    /** ids de cálculos nuevos o con nota cambiada. */
    sucios: string[];
    borrados: string[];
    vaciar: boolean;
};

let usuarioActual: number | null = null;
let temporizador: ReturnType<typeof setTimeout> | null = null;
let enCurso: Promise<void> | null = null;
let pausada = false;

function leerPendientes(): Pendientes {
    try {
        const p = JSON.parse(almacenLocal.leer(CLAVE_PENDIENTES) ?? '');

        return {
            sucios: Array.isArray(p.sucios) ? p.sucios : [],
            borrados: Array.isArray(p.borrados) ? p.borrados : [],
            vaciar: p.vaciar === true,
        };
    } catch {
        return { sucios: [], borrados: [], vaciar: false };
    }
}

function guardarPendientes(p: Pendientes): void {
    almacenLocal.guardar(CLAVE_PENDIENTES, JSON.stringify(p));
}

function anotar(cambio: (p: Pendientes) => void): void {
    if (usuarioActual === null) {
        return;
    }

    const p = leerPendientes();
    cambio(p);
    guardarPendientes(p);
    programar();
}

function programar(): void {
    if (temporizador) {
        clearTimeout(temporizador);
    }

    temporizador = setTimeout(() => void sincronizar(), ESPERA_MS);
}

function tokenXsrf(): string {
    const m = /(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(document.cookie);

    return m ? decodeURIComponent(m[1]) : '';
}

/** Manda lo pendiente y reemplaza la copia local con la de la cuenta. */
export function sincronizar(): Promise<void> {
    if (usuarioActual === null || pausada) {
        return Promise.resolve();
    }

    enCurso ??= (async () => {
        try {
            await cargarHistorial();
            const pendientes = leerPendientes();
            const locales = historialLocal();
            const sucios = new Set(pendientes.sucios);
            const calculos = locales.filter((c) => sucios.has(c.id));

            const r = await fetch('/api/historial/sincronizar', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': tokenXsrf(),
                },
                body: JSON.stringify({
                    calculos,
                    borrados: pendientes.borrados,
                    vaciar: pendientes.vaciar,
                }),
            });

            if (r.status === 409) {
                // Falta aceptar los términos: el historial queda en el
                // dispositivo hasta que los acepte.
                pausada = true;

                return;
            }

            if (!r.ok) {
                return;
            }

            const { calculos: deLaCuenta } = (await r.json()) as {
                calculos: Calculo[];
            };

            // Lo que cambió mientras viajaba el pedido sigue pendiente.
            const despues = leerPendientes();
            const enviados = new Set(calculos.map((c) => c.id));
            const restantes: Pendientes = {
                sucios: despues.sucios.filter((id) => !enviados.has(id)),
                borrados: despues.borrados.filter(
                    (id) => !pendientes.borrados.includes(id),
                ),
                vaciar: despues.vaciar && !pendientes.vaciar,
            };
            guardarPendientes(restantes);

            const nuevosLocales = historialLocal().filter((c) =>
                restantes.sucios.includes(c.id),
            );
            const borradosLocales = new Set(restantes.borrados);
            await reemplazarHistorial(
                [
                    ...nuevosLocales,
                    ...deLaCuenta.filter(
                        (c) =>
                            !borradosLocales.has(c.id) &&
                            !restantes.sucios.includes(c.id),
                    ),
                ].filter(
                    (c, i, todos) =>
                        todos.findIndex((x) => x.id === c.id) === i,
                ),
            );

            if (restantes.sucios.length || restantes.borrados.length) {
                programar();
            }
        } catch {
            // Sin conexión: queda pendiente para cuando vuelva la red.
        } finally {
            enCurso = null;
        }
    })();

    return enCurso;
}

/**
 * Se llama en cada página con el usuario de la sesión (o null). Arranca la
 * sincronización cuando hay sesión y prepara el dispositivo si cambió la
 * cuenta.
 */
export async function alCambiarSesion(usuarioId: number | null): Promise<void> {
    if (usuarioId === usuarioActual) {
        return;
    }

    usuarioActual = usuarioId;
    pausada = false;

    if (usuarioId === null) {
        return;
    }

    const anterior = almacenLocal.leer(CLAVE_USUARIO);

    if (anterior !== String(usuarioId)) {
        await cargarHistorial();

        if (anterior !== null && anterior !== '') {
            // El dispositivo tenía el historial de otra cuenta: se descarta.
            await reemplazarHistorial([]);
            guardarPendientes({ sucios: [], borrados: [], vaciar: false });
        } else {
            // Lo calculado sin cuenta se suma a esta cuenta.
            guardarPendientes({
                ...leerPendientes(),
                sucios: historialLocal().map((c) => c.id),
            });
        }

        almacenLocal.guardar(CLAVE_USUARIO, String(usuarioId));
    }

    await sincronizar();
}

/** Al cerrar la sesión: el historial queda en la cuenta, no en el dispositivo. */
export async function limpiarDatosLocales(): Promise<void> {
    usuarioActual = null;
    guardarPendientes({ sucios: [], borrados: [], vaciar: false });
    almacenLocal.guardar(CLAVE_USUARIO, '');
    await reemplazarHistorial([]);

    // Las pantallas guardadas para usar sin conexión tienen el nombre y el
    // email de la cuenta: se borran (ver public/sw.js).
    try {
        const nombres = await caches.keys();
        await Promise.all(
            nombres
                .filter(
                    (n) =>
                        n.startsWith('calcular-paginas') ||
                        n.startsWith('calcular-inertia'),
                )
                .map((n) => caches.delete(n)),
        );
    } catch {
        // Sin Cache Storage (contexto sin HTTPS): no hay nada guardado.
    }
}

registrarOyentes({
    alAgregar: (c) => anotar((p) => p.sucios.push(c.id)),
    alActualizar: (c) =>
        anotar((p) => {
            if (!p.sucios.includes(c.id)) {
                p.sucios.push(c.id);
            }
        }),
    alEliminar: (id) =>
        anotar((p) => {
            p.sucios = p.sucios.filter((x) => x !== id);
            p.borrados.push(id);
        }),
    alVaciar: () =>
        anotar((p) => {
            p.sucios = [];
            p.borrados = [];
            p.vaciar = true;
        }),
});

if (typeof window !== 'undefined') {
    window.addEventListener('online', () => void sincronizar());
}
