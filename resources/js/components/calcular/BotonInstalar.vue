<script setup lang="ts">
import { Download } from '@lucide/vue';
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { usePwaInstall } from '@/composables/usePwaInstall';

/**
 * "Instalar app". Solo aparece si se puede instalar y todavía no está
 * instalada. En iOS (o si el aviso del navegador ya se usó) muestra los pasos.
 *
 * - `icono`: botón redondo para el encabezado.
 * - `tarjeta`: bloque con texto para el Inicio.
 */
withDefaults(defineProps<{ variante?: 'icono' | 'tarjeta' }>(), {
    variante: 'tarjeta',
});

const { puedeInstalar, ios, instalar } = usePwaInstall();
const ayuda = ref(false);
const ocupado = ref(false);

async function alTocar() {
    if (ocupado.value) {
        return;
    }

    ocupado.value = true;

    try {
        if ((await instalar()) === 'manual') {
            ayuda.value = true;
        }
    } finally {
        ocupado.value = false;
    }
}
</script>

<template>
    <template v-if="puedeInstalar">
        <Button
            v-if="variante === 'icono'"
            variant="ghost"
            size="icon"
            class="size-10"
            aria-label="Instalar CalculAR como app"
            title="Instalar app"
            :disabled="ocupado"
            data-test="instalar-app"
            @click="alTocar"
        >
            <Download />
        </Button>

        <section
            v-else
            class="flex items-center gap-4 rounded-2xl border border-celeste/60 bg-celeste-suave p-4"
        >
            <img
                src="/iconos/icon-192.png?v=1"
                alt=""
                class="size-12 shrink-0 rounded-xl"
                width="48"
                height="48"
            />
            <div class="min-w-0 flex-1">
                <p class="font-semibold">Instalá CalculAR</p>
                <p class="text-sm text-muted-foreground">
                    Abrila desde la pantalla de inicio, como una app. Funciona
                    sin conexión.
                </p>
            </div>
            <Button
                class="h-11 shrink-0"
                :disabled="ocupado"
                data-test="instalar-app"
                @click="alTocar"
            >
                <Download />
                Instalar
            </Button>
        </section>
    </template>

    <Dialog v-model:open="ayuda">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Instalar CalculAR</DialogTitle>
                <DialogDescription>
                    Seguí estos pasos en tu navegador.
                </DialogDescription>
            </DialogHeader>
            <ol v-if="ios" class="list-decimal space-y-2 pl-5 text-sm">
                <li>
                    Tocá <strong>Compartir</strong> en la barra de Safari (el
                    cuadrado con la flecha hacia arriba).
                </li>
                <li>Elegí <strong>Agregar a inicio</strong>.</li>
                <li>Confirmá con <strong>Agregar</strong>.</li>
            </ol>
            <ol v-else class="list-decimal space-y-2 pl-5 text-sm">
                <li>Abrí el menú del navegador (los tres puntos).</li>
                <li>
                    Elegí <strong>Instalar app</strong> o
                    <strong>Agregar a la pantalla de inicio</strong>.
                </li>
            </ol>
        </DialogContent>
    </Dialog>
</template>
