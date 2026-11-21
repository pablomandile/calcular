<script setup lang="ts">
/**
 * Bloque de explicación debajo de cada calculadora: qué calcula, fórmula,
 * ejemplo, supuestos. Cada apartado es un slot con el nombre de su `id`.
 */
defineProps<{ apartados: { id: string; titulo: string }[] }>();
</script>

<template>
    <section
        class="mt-10 space-y-6 border-t border-border pt-8"
        aria-label="Cómo funciona"
    >
        <div
            v-for="a in apartados"
            :key="a.id"
            class="max-w-3xl [&_p]:mt-2 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted-foreground"
        >
            <h2 class="text-lg font-semibold">{{ a.titulo }}</h2>
            <slot :name="a.id" />
        </div>
    </section>
</template>
