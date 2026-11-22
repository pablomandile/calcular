<script setup lang="ts">
/** Casilla de verificación nativa, con área de toque de 44px. */
defineProps<{ id: string; etiqueta: string; ayuda?: string }>();

const modelo = defineModel<boolean>({ required: true });
</script>

<template>
    <div class="flex items-start gap-3">
        <input
            :id="id"
            v-model="modelo"
            type="checkbox"
            class="mt-0.5 size-5 shrink-0 accent-primary"
        />
        <label :for="id" class="-my-2.5 py-2.5 text-sm">
            <span class="font-medium">{{ etiqueta }}</span>
            <span v-if="ayuda" class="block text-muted-foreground">{{
                ayuda
            }}</span>
        </label>
    </div>
</template>
