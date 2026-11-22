<script setup lang="ts">
import { cn } from '@/lib/utils';

/** Fecha con el selector nativo del sistema (en el celular, el calendario). */
defineProps<{
    id: string;
    etiqueta: string;
    ayuda?: string;
    error?: string | null;
    min?: string;
    max?: string;
}>();

const modelo = defineModel<string>({ required: true });
</script>

<template>
    <div class="grid gap-1.5">
        <label :for="id" class="text-sm font-medium">{{ etiqueta }}</label>
        <input
            :id="id"
            v-model="modelo"
            type="date"
            :min="min"
            :max="max"
            :aria-invalid="error ? true : undefined"
            :class="
                cn(
                    'numeros h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:[color-scheme:dark]',
                    error && 'border-destructive',
                )
            "
        />
        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        <p v-else-if="ayuda" class="text-sm text-muted-foreground">
            {{ ayuda }}
        </p>
    </div>
</template>
