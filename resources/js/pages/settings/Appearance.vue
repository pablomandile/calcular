<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import AppearanceTabs from '@/components/AppearanceTabs.vue';
import Heading from '@/components/Heading.vue';
import { edit } from '@/routes/appearance';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                title: 'Pantalla',
                href: edit(),
            },
        ],
    },
});
</script>

<template>
    <Head title="Pantalla" />

    <h1 class="sr-only">Pantalla</h1>

    <div class="space-y-6">
        <Heading
            variant="small"
            title="Pantalla"
            description="Elegí el tema claro, oscuro o el del sistema"
        />
        <AppearanceTabs />
    </div>
</template>
