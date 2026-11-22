import { usePage } from '@inertiajs/vue3';
import { computed, ref } from 'vue';

export type TamanioTexto = 'pequeno' | 'normal' | 'grande';

export type OpcionTamanio = {
    valor: TamanioTexto;
    etiqueta: string;
    descripcion: string;
    /** El porcentaje como número (87.5, 100, 112.5), para la muestra. */
    escala: number;
};

/**
 * Tamaño de letra (App\Enums\TamanioTexto). El servidor ya lo escribe en
 * <html data-texto> al cargar; esto es para cuando la persona lo cambia.
 *
 * Se aplica en el acto y se guarda con un fetch (cookie y, con sesión, la
 * cuenta). No es una visita de Inertia a propósito: recargar la página
 * borraría la cuenta que hay en la calculadora.
 */
const elegido = ref<TamanioTexto | null>(null);

function aplicar(valor: TamanioTexto): void {
    document.documentElement.dataset.texto = valor;
}

function tokenXsrf(): string {
    const m = /(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(document.cookie);

    return m ? decodeURIComponent(m[1]) : '';
}

export function useTamanioTexto() {
    const page = usePage();

    const tamanio = computed<TamanioTexto>(
        () =>
            elegido.value ??
            (page.props.tamanioTexto as TamanioTexto | undefined) ??
            'normal',
    );

    const opciones = computed<OpcionTamanio[]>(
        () => (page.props.tamaniosTexto as OpcionTamanio[] | undefined) ?? [],
    );

    async function cambiar(valor: TamanioTexto): Promise<void> {
        const anterior = tamanio.value;

        if (valor === anterior) {
            return;
        }

        elegido.value = valor;
        aplicar(valor);

        try {
            const r = await fetch('/tamanio-texto', {
                method: 'PUT',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': tokenXsrf(),
                },
                body: JSON.stringify({ tamanio_texto: valor }),
            });

            if (!r.ok) {
                throw new Error(String(r.status));
            }
        } catch {
            // Sin conexión: el cambio vale para esta visita y se pierde al
            // recargar. Mejor eso que dejar la letra a medio cambiar.
            if (!navigator.onLine) {
                return;
            }

            elegido.value = anterior;
            aplicar(anterior);
        }
    }

    return { tamanio, opciones, cambiar };
}
