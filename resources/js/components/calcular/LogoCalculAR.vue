<script setup lang="ts">
import IsotipoCalculAR from '@/components/calcular/IsotipoCalculAR.vue';

withDefaults(defineProps<{ conIsotipo?: boolean }>(), { conIsotipo: true });
</script>

<template>
    <span class="inline-flex items-center gap-2">
        <IsotipoCalculAR v-if="conIsotipo" class="size-8 shrink-0" />
        <span class="text-xl leading-none font-semibold tracking-tight">
            Calcul<span class="font-extrabold text-celeste">AR</span>
        </span>
    </span>
</template>
