import { computed, onMounted, onUnmounted, ref } from 'vue';

/**
 * Instalar CalculAR como app. El evento beforeinstallprompt se captura en el
 * <head> (app.blade.php), antes de que monte Vue: si se escuchara acá, Chrome
 * ya lo habría disparado y el botón no aparecería nunca.
 */
type EventoInstalacion = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

declare global {
    interface Window {
        __pwaInstall?: { prompt: EventoInstalacion | null; installed: boolean };
    }

    interface Navigator {
        /** Safari de iOS, con la app abierta desde la pantalla de inicio. */
        standalone?: boolean;
    }
}

const STANDALONE = '(display-mode: standalone)';

/** Safari de iOS/iPadOS: no dispara el evento, se instala a mano. */
function esIosSafari(): boolean {
    const ua = navigator.userAgent;
    const ios =
        /iPad|iPhone|iPod/.test(ua) ||
        // iPadOS se presenta como Mac; se distingue por el toque.
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Chrome, Firefox o Edge en iOS no pueden instalar PWAs.
    return ios && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

function yaInstalada(): boolean {
    return (
        window.matchMedia?.(STANDALONE).matches === true ||
        navigator.standalone === true ||
        window.__pwaInstall?.installed === true
    );
}

export function usePwaInstall() {
    const instalada = ref(typeof window !== 'undefined' && yaInstalada());
    const ios = typeof window !== 'undefined' && esIosSafari();
    // Queda en true aunque el aviso ya se haya usado: el segundo toque muestra
    // los pasos a mano en vez de dejar el botón muerto.
    const ofrecida = ref(
        typeof window !== 'undefined' && !!window.__pwaInstall?.prompt,
    );

    const puedeInstalar = computed(
        () => !instalada.value && (ofrecida.value || ios),
    );

    const alOfrecer = () => (ofrecida.value = true);
    const alInstalar = () => (instalada.value = true);
    const alCambiarModo = (e: MediaQueryListEvent) =>
        (instalada.value = e.matches);
    const consulta =
        typeof window !== 'undefined' ? window.matchMedia?.(STANDALONE) : null;

    onMounted(() => {
        window.addEventListener('pwa:installable', alOfrecer);
        window.addEventListener('pwa:installed', alInstalar);
        consulta?.addEventListener?.('change', alCambiarModo);
    });

    onUnmounted(() => {
        window.removeEventListener('pwa:installable', alOfrecer);
        window.removeEventListener('pwa:installed', alInstalar);
        consulta?.removeEventListener?.('change', alCambiarModo);
    });

    async function instalar(): Promise<'accepted' | 'dismissed' | 'manual'> {
        const evento = window.__pwaInstall?.prompt;

        if (!evento || !window.__pwaInstall) {
            return 'manual';
        }

        // El evento sirve una sola vez.
        window.__pwaInstall.prompt = null;
        await evento.prompt();
        const { outcome } = await evento.userChoice;

        return outcome;
    }

    return { puedeInstalar, instalada, ios, instalar };
}
