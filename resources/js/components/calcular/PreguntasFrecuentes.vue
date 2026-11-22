<script setup lang="ts">
import { ChevronDown } from '@lucide/vue';
import type { PreguntaFrecuente } from '@/lib/preguntasFrecuentes';

/**
 * Acordeón de preguntas frecuentes con <details>: abre con teclado y lo
 * anuncia el lector de pantalla sin código propio. Se pueden abrir varias.
 */
defineProps<{ preguntas: PreguntaFrecuente[] }>();
</script>

<template>
    <section
        class="mt-10 border-t border-border pt-8"
        aria-labelledby="preguntas-frecuentes"
    >
        <h2 id="preguntas-frecuentes" class="text-lg font-semibold">
            Preguntas frecuentes
        </h2>
        <div
            class="mt-4 max-w-3xl divide-y divide-border rounded-xl border border-border bg-card"
        >
            <details
                v-for="p in preguntas"
                :key="p.pregunta"
                class="group"
                data-test="pregunta-frecuente"
            >
                <summary
                    class="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden"
                >
                    <span class="min-w-0 wrap-anywhere">{{ p.pregunta }}</span>
                    <ChevronDown
                        class="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                        aria-hidden="true"
                    />
                </summary>
                <div
                    class="space-y-2 px-4 pb-4 leading-relaxed text-muted-foreground"
                >
                    <template v-for="(bloque, i) in p.respuesta" :key="i">
                        <ul
                            v-if="Array.isArray(bloque)"
                            class="list-disc space-y-1 pl-5"
                        >
                            <li v-for="item in bloque" :key="item">
                                {{ item }}
                            </li>
                        </ul>
                        <p v-else>{{ bloque }}</p>
                    </template>
                </div>
            </details>
        </div>
    </section>
</template>
