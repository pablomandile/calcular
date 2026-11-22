<script setup lang="ts">
import { formatearNumero, parsearNumero } from '@/lib/calc/numero';
import { cn } from '@/lib/utils';

/**
 * Campo numérico "a la argentina": acepta 1.234,56 (o 1234.56), muestra el
 * teclado numérico en el celular y, al salir, reescribe el valor con punto de
 * miles. El v-model es el texto tal cual; el número lo saca parsearNumero().
 */
const props = withDefaults(
    defineProps<{
        id: string;
        etiqueta: string;
        prefijo?: string;
        sufijo?: string;
        placeholder?: string;
        ayuda?: string;
        error?: string | null;
        /** Reescribir con punto de miles al salir del campo. */
        formatear?: boolean;
        entero?: boolean;
    }>(),
    { formatear: true, entero: false },
);

const modelo = defineModel<string>({ required: true });

function alSalir() {
    if (!props.formatear) {
        return;
    }

    const n = parsearNumero(modelo.value);

    if (n) {
        modelo.value = formatearNumero(n, { maxDecimales: 10 });
    }
}
</script>

<template>
    <div class="grid gap-1.5">
        <label :for="id" class="text-sm font-medium">{{ etiqueta }}</label>
        <div
            :class="
                cn(
                    'flex h-11 items-center rounded-md border border-input bg-card shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30',
                    error && 'border-destructive',
                )
            "
        >
            <span
                v-if="prefijo"
                class="pl-3 text-muted-foreground select-none"
                aria-hidden="true"
                >{{ prefijo }}</span
            >
            <input
                :id="id"
                v-model="modelo"
                type="text"
                :inputmode="entero ? 'numeric' : 'decimal'"
                autocomplete="off"
                :placeholder="placeholder"
                :aria-invalid="error ? true : undefined"
                :aria-describedby="
                    error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined
                "
                class="numeros h-full w-full min-w-0 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground/70"
                @blur="alSalir"
            />
            <span
                v-if="sufijo"
                class="pr-3 text-muted-foreground select-none"
                aria-hidden="true"
                >{{ sufijo }}</span
            >
        </div>
        <p v-if="error" :id="`${id}-error`" class="text-sm text-destructive">
            {{ error }}
        </p>
        <p
            v-else-if="ayuda"
            :id="`${id}-ayuda`"
            class="text-sm text-muted-foreground"
        >
            {{ ayuda }}
        </p>
    </div>
</template>
