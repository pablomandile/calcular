<script setup lang="ts">
import CalcLayout from '@/layouts/CalcLayout.vue';
import type { BreadcrumbItem } from '@/types';

// Las páginas de configuración del kit pasan breadcrumbs; el layout de
// CalculAR no los muestra, pero los declara para que no caigan como atributo.
defineProps<{ breadcrumbs?: BreadcrumbItem[] }>();
</script>

<template>
    <CalcLayout>
        <slot />
    </CalcLayout>
</template>
