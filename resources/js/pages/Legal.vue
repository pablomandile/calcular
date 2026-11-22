<script setup lang="ts">
import { Head } from '@inertiajs/vue3';

/*
 * Términos y condiciones, y política de privacidad: la misma página con otro
 * texto. Los textos viven en `resources/legales/*.md` y llegan ya convertidos
 * a HTML desde `LegalesController`; son del repo, no de un usuario.
 */
defineProps<{
    titulo: string;
    version: string;
    html: string;
}>();
</script>

<template>
    <Head :title="titulo" />

    <div class="mx-auto flex w-full max-w-2xl flex-col gap-2">
        <h1 class="text-2xl font-bold tracking-tight md:text-3xl">
            {{ titulo }}
        </h1>
        <p class="text-sm text-muted-foreground">Versión del {{ version }}</p>

        <!-- eslint-disable vue/no-v-html -- texto propio del repo, ver LegalesController -->
        <article
            class="mt-3 rounded-2xl border border-border bg-card p-5 leading-relaxed text-pretty wrap-anywhere sm:p-6 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary [&_blockquote]:mt-4 [&_blockquote]:border-l-4 [&_blockquote]:border-celeste [&_blockquote]:pl-4 [&_blockquote]:text-sm [&_blockquote]:text-muted-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2:first-child]:mt-0 [&_li]:mt-1.5 [&_p]:mt-3 [&_p:first-child]:mt-0 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
            v-html="html"
        />
    </div>
</template>
