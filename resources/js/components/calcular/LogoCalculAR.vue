<script setup lang="ts">
withDefaults(defineProps<{ conIsotipo?: boolean }>(), { conIsotipo: true });
</script>

<template>
    <span class="inline-flex items-center gap-2">
        <!-- resources/marca/isotipo.png, generado con npm run generar:iconos -->
        <img
            v-if="conIsotipo"
            src="/img/isotipo.webp?v=1"
            alt=""
            width="96"
            height="96"
            class="size-8 shrink-0"
        />
        <span class="text-xl leading-none font-semibold tracking-tight">
            Calcul<span class="font-extrabold text-celeste">AR</span>
        </span>
    </span>
</template>
