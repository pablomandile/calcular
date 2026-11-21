<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { ChevronRight } from '@lucide/vue';
import type { Calculadora } from '@/lib/catalogo';

defineProps<{ calculadora: Calculadora }>();
</script>

<template>
    <Link
        :href="calculadora.href"
        class="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-celeste hover:bg-celeste-suave/40"
    >
        <span
            class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-celeste-suave text-primary"
        >
            <component :is="calculadora.icono" class="size-5" />
        </span>
        <span class="min-w-0 flex-1">
            <span class="block font-semibold">{{ calculadora.titulo }}</span>
            <span class="mt-0.5 block text-sm text-muted-foreground">
                {{ calculadora.descripcion }}
            </span>
        </span>
        <ChevronRight
            class="mt-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
    </Link>
</template>
