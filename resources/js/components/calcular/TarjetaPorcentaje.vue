<script setup lang="ts">
import { Copy } from '@lucide/vue';
import { ref } from 'vue';
import { toast } from 'vue-sonner';
import CampoNumero from '@/components/calcular/CampoNumero.vue';
import SelectorOpciones from '@/components/calcular/SelectorOpciones.vue';
import { Button } from '@/components/ui/button';
import { useHistorial } from '@/composables/useHistorial';
import { copiarTexto } from '@/lib/navegador';

/**
 * Una mini calculadora de porcentajes: título, campos, opción y resultado en
 * una frase. La lógica viene en `modo.calcular`, que tira Error si falta algo.
 */
export type CampoPorcentaje = {
    clave: string;
    etiqueta: string;
    sufijo?: string;
    prefijo?: string;
    placeholder?: string;
};

export type ResultadoPorcentaje = {
    /** Lo que se copia y se guarda: "210", "25 %". */
    valor: string;
    /** Texto antes del valor: "El 21 % de 1.000 es". */
    antes: string;
    /** Qué se calculó, para el historial: "21 % de 1.000". */
    titulo: string;
};

export type ModoPorcentaje = {
    clave: string;
    titulo: string;
    campos: CampoPorcentaje[];
    opciones?: { valor: string; titulo: string }[];
    atajos?: { titulo: string; campo: string; valor: string }[];
    calcular: (
        valores: Record<string, string>,
        opcion: string,
    ) => ResultadoPorcentaje;
};

const props = defineProps<{ modo: ModoPorcentaje }>();

const valores = defineModel<Record<string, string>>('valores', {
    required: true,
});
const opcion = defineModel<string>('opcion', { default: '' });

const { agregar } = useHistorial();
const resultado = ref<ResultadoPorcentaje | null>(null);
const error = ref<string | null>(null);

function ejecutar() {
    try {
        const r = props.modo.calcular(valores.value, opcion.value);
        resultado.value = r;
        error.value = null;
        agregar({
            tipo: 'porcentajes',
            titulo: r.titulo,
            resultado: r.valor,
            entrada: {
                modo: props.modo.clave,
                valores: { ...valores.value },
                opcion: opcion.value,
            },
        });
    } catch (e) {
        resultado.value = null;
        error.value = (e as Error).message;
    }
}

async function copiar() {
    if (!resultado.value) {
        return;
    }

    const ok = await copiarTexto(resultado.value.valor);
    toast[ok ? 'success' : 'error'](
        ok ? 'Resultado copiado' : 'No se pudo copiar',
    );
}

defineExpose({ ejecutar });
</script>

<template>
    <form
        :id="`porcentaje-${modo.clave}`"
        class="flex scroll-mt-20 flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
        @submit.prevent="ejecutar"
    >
        <h2 class="font-semibold">{{ modo.titulo }}</h2>

        <SelectorOpciones
            v-if="modo.opciones"
            v-model="opcion"
            :nombre="`opcion-${modo.clave}`"
            etiqueta="Tipo"
            :opciones="modo.opciones"
        />

        <div class="grid gap-4 sm:grid-cols-2">
            <CampoNumero
                v-for="c in modo.campos"
                :id="`${modo.clave}-${c.clave}`"
                :key="c.clave"
                v-model="valores[c.clave]"
                :etiqueta="c.etiqueta"
                :sufijo="c.sufijo"
                :prefijo="c.prefijo"
                :placeholder="c.placeholder"
            />
        </div>

        <div v-if="modo.atajos" class="flex flex-wrap gap-2">
            <button
                v-for="a in modo.atajos"
                :key="a.titulo"
                type="button"
                class="h-9 rounded-full border border-border px-3 text-sm text-muted-foreground hover:text-foreground"
                @click="valores[a.campo] = a.valor"
            >
                {{ a.titulo }}
            </button>
        </div>

        <Button type="submit" class="h-11">Calcular</Button>

        <div aria-live="polite">
            <p
                v-if="error"
                class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
                {{ error }}
            </p>
            <div
                v-else-if="resultado"
                class="flex items-center justify-between gap-3 rounded-xl border-l-4 border-sol bg-sol-suave px-4 py-3"
            >
                <p class="numeros min-w-0 break-words">
                    {{ resultado.antes }}
                    <strong class="text-xl">{{ resultado.valor }}</strong>
                </p>
                <button
                    type="button"
                    class="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
                    aria-label="Copiar el resultado"
                    @click="copiar"
                >
                    <Copy class="size-4" />
                </button>
            </div>
        </div>
    </form>
</template>
