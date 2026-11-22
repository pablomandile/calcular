import { router } from '@inertiajs/vue3';
import { onMounted } from 'vue';
import type { Calculo, TipoCalculo } from '@/composables/useHistorial';
import { cargarHistorial, useHistorial } from '@/composables/useHistorial';

/**
 * "Reusar" desde el historial: la calculadora se abre con ?reusar=<id> y
 * recibe la entrada guardada. Después se limpia la URL para que recargar la
 * página no vuelva a aplicarla.
 */
export function useReusar(
    tipo: TipoCalculo,
    aplicar: (entrada: Record<string, unknown>, calculo: Calculo) => void,
): void {
    const { buscar } = useHistorial();

    onMounted(async () => {
        const url = new URL(window.location.href);
        const id = url.searchParams.get('reusar');

        if (!id) {
            return;
        }

        await cargarHistorial();
        const calculo = buscar(id);

        if (calculo && calculo.tipo === tipo) {
            aplicar(calculo.entrada, calculo);
        }

        // Con router.replace la URL limpia queda también en el estado de
        // Inertia; un replaceState a mano lo pisa Inertia al inicializarse.
        url.searchParams.delete('reusar');
        router.replace({
            url: url.pathname + url.search + url.hash,
            preserveScroll: true,
            preserveState: true,
        });
    });
}
