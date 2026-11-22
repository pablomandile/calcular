<script setup lang="ts">
import { Monitor, Moon, Sun, Type } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Appearance } from '@/composables/useAppearance';
import { useAppearance } from '@/composables/useAppearance';
import type { TamanioTexto } from '@/composables/useTamanioTexto';
import { useTamanioTexto } from '@/composables/useTamanioTexto';

/**
 * "Pantalla": tema y tamaño de letra, en un solo botón del encabezado. Está a
 * mano para todos, con o sin cuenta (CalculAR se usa casi siempre sin cuenta,
 * así que no puede vivir solo en Configuración).
 */
const { appearance, resolvedAppearance, updateAppearance } = useAppearance();
const { tamanio, opciones, cambiar } = useTamanioTexto();

const temas: { valor: Appearance; titulo: string; icono: typeof Sun }[] = [
    { valor: 'light', titulo: 'Claro', icono: Sun },
    { valor: 'dark', titulo: 'Oscuro', icono: Moon },
    { valor: 'system', titulo: 'Como el sistema', icono: Monitor },
];

/** Cada opción se escribe a su tamaño real, relativo al vigente. */
function muestra(escala: number): string {
    const actual =
        opciones.value.find((o) => o.valor === tamanio.value)?.escala ?? 100;

    return `${escala / actual}em`;
}
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button
                variant="ghost"
                size="icon"
                class="size-10"
                aria-label="Pantalla: tema y tamaño de letra"
                data-test="menu-pantalla"
            >
                <Moon v-if="resolvedAppearance === 'light'" />
                <Sun v-else />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-60">
            <DropdownMenuLabel class="flex items-center gap-2">
                <Type class="size-4" /> Tamaño de letra
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
                :model-value="tamanio"
                @update:model-value="(v) => cambiar(v as TamanioTexto)"
            >
                <DropdownMenuRadioItem
                    v-for="o in opciones"
                    :key="o.valor"
                    :value="o.valor"
                    class="min-h-10"
                    :data-test="`tamanio-${o.valor}`"
                >
                    <span :style="{ fontSize: muestra(o.escala) }">{{
                        o.etiqueta
                    }}</span>
                </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Tema</DropdownMenuLabel>
            <DropdownMenuRadioGroup
                :model-value="appearance"
                @update:model-value="(v) => updateAppearance(v as Appearance)"
            >
                <DropdownMenuRadioItem
                    v-for="t in temas"
                    :key="t.valor"
                    :value="t.valor"
                    class="min-h-10"
                >
                    <component :is="t.icono" class="size-4" />
                    {{ t.titulo }}
                </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
