<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { Copy, RotateCcw, StickyNote, Trash2 } from '@lucide/vue';
import { computed, nextTick, ref } from 'vue';
import { toast } from 'vue-sonner';
import { Button } from '@/components/ui/button';
import type { Calculo } from '@/composables/useHistorial';
import { useHistorial } from '@/composables/useHistorial';
import { buscarCalculadora } from '@/lib/catalogo';
import { copiarTexto } from '@/lib/navegador';

const props = defineProps<{ calculo: Calculo }>();

const { actualizarNota, eliminar } = useHistorial();
const calc = computed(() => buscarCalculadora(props.calculo.tipo));
const hora = computed(() =>
    new Date(props.calculo.creado_en).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }),
);

const editando = ref(false);
const nota = ref('');
const campoNota = ref<HTMLTextAreaElement | null>(null);

async function abrirNota() {
    nota.value = props.calculo.nota ?? '';
    editando.value = true;
    await nextTick();
    campoNota.value?.focus();
}

function guardarNota() {
    actualizarNota(props.calculo.id, nota.value);
    editando.value = false;
}

async function copiar() {
    const ok = await copiarTexto(props.calculo.resultado);
    toast[ok ? 'success' : 'error'](
        ok ? 'Resultado copiado' : 'No se pudo copiar',
    );
}

function borrar() {
    eliminar(props.calculo.id);
    toast.success('Cálculo borrado');
}
</script>

<template>
    <li class="py-3">
        <div class="flex items-start gap-3">
            <span
                class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-celeste-suave text-primary"
                :title="calc?.titulo"
            >
                <component :is="calc?.icono" v-if="calc" class="size-4" />
            </span>
            <div class="min-w-0 flex-1">
                <p class="text-xs text-muted-foreground">
                    {{ calc?.titulo }} · {{ hora }}
                </p>
                <p
                    class="numeros mt-0.5 text-sm break-words text-muted-foreground"
                >
                    {{ calculo.titulo }}
                </p>
                <p class="numeros text-lg font-semibold break-words">
                    {{ calculo.resultado }}
                </p>
                <p
                    v-if="calculo.nota && !editando"
                    class="mt-1 rounded-md bg-sol-suave px-2 py-1 text-sm"
                >
                    {{ calculo.nota }}
                </p>
                <form
                    v-if="editando"
                    class="mt-2 space-y-2"
                    @submit.prevent="guardarNota"
                >
                    <label :for="`nota-${calculo.id}`" class="sr-only"
                        >Nota</label
                    >
                    <textarea
                        :id="`nota-${calculo.id}`"
                        ref="campoNota"
                        v-model="nota"
                        rows="2"
                        maxlength="200"
                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                        placeholder="Por ejemplo: cuota del auto"
                        @keydown.enter.exact.prevent="guardarNota"
                        @keydown.escape="editando = false"
                    />
                    <div class="flex gap-2">
                        <Button type="submit" size="sm">Guardar</Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            @click="editando = false"
                            >Cancelar</Button
                        >
                    </div>
                </form>
            </div>
        </div>
        <div class="mt-1 flex justify-end gap-1 pl-12">
            <Button
                variant="ghost"
                size="sm"
                class="h-10 min-w-10 text-muted-foreground"
                @click="copiar"
            >
                <Copy class="size-4" />
                <span class="sr-only sm:not-sr-only">Copiar</span>
            </Button>
            <Button
                v-if="calc"
                variant="ghost"
                size="sm"
                class="h-10 min-w-10 text-muted-foreground"
                as-child
            >
                <Link :href="`${calc.href}?reusar=${calculo.id}`">
                    <RotateCcw class="size-4" />
                    <span class="sr-only sm:not-sr-only">Reusar</span>
                </Link>
            </Button>
            <Button
                variant="ghost"
                size="sm"
                class="h-10 min-w-10 text-muted-foreground"
                @click="abrirNota"
            >
                <StickyNote class="size-4" />
                <span class="sr-only sm:not-sr-only">Nota</span>
            </Button>
            <Button
                variant="ghost"
                size="sm"
                class="h-10 text-muted-foreground hover:text-destructive"
                :aria-label="`Borrar ${calculo.titulo}`"
                @click="borrar"
            >
                <Trash2 class="size-4" />
            </Button>
        </div>
    </li>
</template>
