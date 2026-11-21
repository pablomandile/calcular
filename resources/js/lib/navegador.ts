/**
 * Utilidades del navegador con alternativa para contextos sin HTTPS
 * (http://calcular.test en desarrollo): ahí no existen crypto.randomUUID ni
 * navigator.clipboard.
 */

/** UUID v4. */
export function uuid(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        try {
            return crypto.randomUUID();
        } catch {
            // Contexto inseguro: sigue con la alternativa.
        }
    }

    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export async function copiarTexto(texto: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(texto);

            return true;
        }
    } catch {
        // Sigue con la alternativa.
    }

    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();

    try {
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        area.remove();
    }
}

/** localStorage que nunca tira error (modo privado, almacenamiento bloqueado). */
export const almacenLocal = {
    leer(clave: string): string | null {
        try {
            return localStorage.getItem(clave);
        } catch {
            return null;
        }
    },
    guardar(clave: string, valor: string): void {
        try {
            localStorage.setItem(clave, valor);
        } catch {
            // Sin almacenamiento: el dato vive solo en esta pestaña.
        }
    },
};
