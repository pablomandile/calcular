<script setup lang="ts">
import { Copy } from '@lucide/vue';
import { toast } from 'vue-sonner';
import { copiarTexto } from '@/lib/navegador';
import { cn } from '@/lib/utils';

/**
 * Resultado de una calculadora de formulario: un valor principal grande con
 * el acento del Sol y, debajo, filas de detalle (slot).
 */
const props = defineProps<{
    etiqueta?: string;
    valor?: string | null;
    error?: string | null;
    /** Los datos cambiaron después de calcular. */
    desactualizado?: boolean;
    vacio?: string;
}>();

async function copiar() {
    if (!props.valor) {
        return;
    }

    const ok = await copiarTexto(props.valor);
    toast[ok ? 'success' : 'error'](
        ok ? 'Resultado copiado' : 'No se pudo copiar',
    );
}
</script>

<template>
    <section
        class="rounded-2xl border border-border bg-card p-5 shadow-sm"
        aria-live="polite"
        aria-label="Resultado"
    >
        <p
            v-if="error"
            class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
        >
            {{ error }}
        </p>

        <p v-else-if="!valor" class="py-6 text-center text-muted-foreground">
            {{
                vacio ??
                'Completá los datos y tocá Calcular para ver el resultado.'
            }}
        </p>

        <div
            v-else
            :class="cn('transition-opacity', desactualizado && 'opacity-50')"
        >
            <div
                class="flex items-start justify-between gap-3 rounded-xl border-l-4 border-sol bg-sol-suave px-4 py-3"
            >
                <div class="min-w-0">
                    <p v-if="etiqueta" class="text-sm text-muted-foreground">
                        {{ etiqueta }}
                    </p>
                    <p
                        class="numeros text-3xl font-bold tracking-tight break-words"
                        data-test="resultado-principal"
                    >
                        {{ valor }}
                    </p>
                </div>
                <button
                    type="button"
                    class="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
                    aria-label="Copiar el resultado"
                    @click="copiar"
                >
                    <Copy class="size-4" />
                </button>
            </div>
            <dl class="mt-3 divide-y divide-border">
                <slot />
            </dl>
            <slot name="extra" />
        </div>

        <p
            v-if="valor && desactualizado && !error"
            class="mt-3 text-sm text-muted-foreground"
        >
            Cambiaste los datos: tocá Calcular para actualizar.
        </p>
    </section>
</template>
