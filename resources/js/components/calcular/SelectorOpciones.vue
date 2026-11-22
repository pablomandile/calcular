<script setup lang="ts" generic="T extends string | number">
import { cn } from '@/lib/utils';

/**
 * Grupo de opciones tipo "pastillas", hecho con radios nativos: se maneja con
 * flechas del teclado y los lectores de pantalla lo anuncian como grupo.
 */
defineProps<{
    nombre: string;
    etiqueta: string;
    opciones: { valor: T; titulo: string }[];
}>();

const modelo = defineModel<T>({ required: true });
</script>

<template>
    <fieldset class="grid gap-1.5">
        <legend class="mb-1.5 text-sm font-medium">{{ etiqueta }}</legend>
        <div class="flex flex-wrap gap-2">
            <label
                v-for="o in opciones"
                :key="String(o.valor)"
                :class="
                    cn(
                        'flex h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
                        modelo === o.valor
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground hover:text-foreground',
                    )
                "
            >
                <input
                    v-model="modelo"
                    type="radio"
                    class="sr-only"
                    :name="nombre"
                    :value="o.valor"
                />
                {{ o.titulo }}
            </label>
        </div>
    </fieldset>
</template>
