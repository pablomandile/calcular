import type { Ref } from 'vue';
import { computed, ref, shallowRef } from 'vue';
import type { NuevoCalculo } from '@/composables/useHistorial';
import { useHistorial } from '@/composables/useHistorial';

/**
 * Calculadora de formulario: al tocar Calcular se ejecuta `calcular` con los
 * datos actuales, se muestra el resultado y se guarda en el historial. Si los
 * datos cambian después, `desactualizado` avisa que hay que recalcular.
 *
 * `calcular` tira Error con un mensaje para la persona si algo está mal.
 */
export function useCalculo<D extends object, R>(
    datos: Ref<D>,
    calcular: (d: D) => R,
    paraHistorial: (d: D, r: R) => NuevoCalculo,
) {
    const { agregar } = useHistorial();
    const resultado = shallowRef<R | null>(null);
    const error = ref<string | null>(null);
    const firma = ref<string | null>(null);

    const desactualizado = computed(
        () =>
            firma.value !== null && firma.value !== JSON.stringify(datos.value),
    );

    function ejecutar(): void {
        const d = datos.value;

        try {
            const r = calcular(d);
            resultado.value = r;
            error.value = null;
            firma.value = JSON.stringify(d);
            agregar(paraHistorial(d, r));
        } catch (e) {
            resultado.value = null;
            firma.value = null;
            error.value = (e as Error).message;
        }
    }

    return { resultado, error, desactualizado, ejecutar };
}
