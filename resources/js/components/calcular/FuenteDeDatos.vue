<script setup lang="ts">
import { CloudOff, Info } from '@lucide/vue';
import { Spinner } from '@/components/ui/spinner';
import type { DatosSerie } from '@/composables/useIndice';

/** De dónde salen los datos, hasta cuándo hay, y si se usa la copia guardada. */
defineProps<{
    datos: DatosSerie | null;
    cargando: boolean;
    fuente: string;
    enlace: string;
    /** "octubre de 2026" o "22/11/2026". */
    ultimo?: string;
}>();
</script>

<template>
    <div
        class="flex items-center gap-2 text-sm text-muted-foreground"
        role="status"
    >
        <template v-if="cargando">
            <Spinner class="size-4" /> Cargando los datos oficiales…
        </template>
        <template v-else-if="datos">
            <Info class="size-4 shrink-0" aria-hidden="true" />
            <p class="min-w-0 wrap-anywhere">
                Fuente:
                <a
                    :href="enlace"
                    target="_blank"
                    rel="noopener"
                    class="underline underline-offset-2 hover:text-foreground"
                    >{{ fuente }}</a
                >. Último dato: <span class="numeros">{{ ultimo }}</span
                >.
            </p>
        </template>
    </div>
    <p
        v-if="!cargando && datos?.guardada"
        class="mt-2 flex items-center gap-2 rounded-lg bg-celeste-suave px-3 py-2 text-sm"
    >
        <CloudOff class="size-4 shrink-0" aria-hidden="true" />
        Sin conexión: se usan los datos que quedaron guardados en este
        dispositivo.
    </p>
    <p
        v-if="!cargando && !datos"
        class="mt-2 rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive"
        role="alert"
    >
        No se pudieron cargar los datos oficiales. Revisá la conexión y volvé a
        abrir la pantalla.
    </p>
</template>
