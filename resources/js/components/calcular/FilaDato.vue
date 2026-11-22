<script setup lang="ts">
defineProps<{ etiqueta: string; valor: string; ayuda?: string }>();
</script>

<template>
    <div class="flex items-baseline justify-between gap-4 py-2.5">
        <dt class="text-sm text-muted-foreground">
            {{ etiqueta }}
            <span v-if="ayuda" class="block text-xs">{{ ayuda }}</span>
        </dt>
        <dd class="numeros text-right font-semibold">{{ valor }}</dd>
    </div>
</template>
