<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { ChevronLeft } from '@lucide/vue';
import { computed } from 'vue';
import { buscarCalculadora, titulosSeccion } from '@/lib/catalogo';

const props = defineProps<{
    clave: string;
    /** En el celular oculta la descripción: el teclado necesita el lugar. */
    compacto?: boolean;
}>();

const calc = computed(() => buscarCalculadora(props.clave));

const volver = computed(() => {
    const seccion = calc.value?.seccion;

    if (seccion === 'finanzas' || props.clave === 'porcentajes') {
        return { href: '/finanzas', titulo: titulosSeccion.finanzas };
    }

    if (seccion === 'fechas' || seccion === 'inflacion') {
        return { href: `/${seccion}`, titulo: titulosSeccion[seccion] };
    }

    return null;
});
</script>

<template>
    <Head :title="calc?.titulo" />
    <h1 v-if="calc && compacto" class="sr-only sm:hidden">
        {{ calc.titulo }}
    </h1>
    <div
        v-if="calc"
        :class="compacto ? 'mb-5 hidden sm:block md:mb-7' : 'mb-5 md:mb-7'"
    >
        <Link
            v-if="volver"
            :href="volver.href"
            class="-ml-1 inline-flex min-h-10 items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
        >
            <ChevronLeft class="size-4" />
            {{ volver.titulo }}
        </Link>
        <div class="flex items-center gap-3">
            <span
                class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-celeste-suave text-primary"
            >
                <component :is="calc.icono" class="size-5" />
            </span>
            <h1 class="text-2xl font-bold tracking-tight md:text-3xl">
                {{ calc.titulo }}
            </h1>
        </div>
        <p class="mt-2 text-muted-foreground">
            {{ calc.descripcion }}
        </p>
    </div>
</template>
