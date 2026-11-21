<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { CloudOff, History, Search } from '@lucide/vue';
import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';
import ItemHistorial from '@/components/calcular/ItemHistorial.vue';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Calculo, TipoCalculo } from '@/composables/useHistorial';
import { useHistorial } from '@/composables/useHistorial';
import { cn } from '@/lib/utils';

const page = usePage();
const usuario = computed(() => page.props.auth?.user ?? null);
const { items, cargado, vaciar } = useHistorial();

type Filtro = 'todos' | 'basicas' | 'finanzas' | 'fechas';
const filtros: { valor: Filtro; titulo: string; tipos: TipoCalculo[] }[] = [
    { valor: 'todos', titulo: 'Todos', tipos: [] },
    {
        valor: 'basicas',
        titulo: 'Calculadoras',
        tipos: ['basica', 'cientifica'],
    },
    {
        valor: 'finanzas',
        titulo: 'Finanzas',
        tipos: ['tna-tea', 'plazo-fijo', 'interes-compuesto', 'porcentajes'],
    },
    {
        valor: 'fechas',
        titulo: 'Fechas',
        tipos: ['dias-entre-fechas', 'dias-habiles', 'sumar-restar', 'edad'],
    },
];

const filtro = ref<Filtro>('todos');
const busqueda = ref('');

const visibles = computed(() => {
    const tipos = filtros.find((f) => f.valor === filtro.value)?.tipos ?? [];
    const q = busqueda.value.trim().toLocaleLowerCase('es');

    return items.value.filter(
        (c) =>
            (tipos.length === 0 || tipos.includes(c.tipo)) &&
            (q === '' ||
                [c.titulo, c.resultado, c.nota ?? '']
                    .join(' ')
                    .toLocaleLowerCase('es')
                    .includes(q)),
    );
});

function claveDia(iso: string): string {
    const d = new Date(iso);

    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function tituloDia(iso: string): string {
    const d = new Date(iso);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    if (claveDia(iso) === claveDia(hoy.toISOString())) {
        return 'Hoy';
    }

    if (claveDia(iso) === claveDia(ayer.toISOString())) {
        return 'Ayer';
    }

    return d.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: d.getFullYear() === hoy.getFullYear() ? undefined : 'numeric',
    });
}

const grupos = computed(() => {
    const salida: { clave: string; titulo: string; items: Calculo[] }[] = [];

    for (const c of visibles.value) {
        const clave = claveDia(c.creado_en);
        let grupo = salida.at(-1);

        if (!grupo || grupo.clave !== clave) {
            grupo = { clave, titulo: tituloDia(c.creado_en), items: [] };
            salida.push(grupo);
        }

        grupo.items.push(c);
    }

    return salida;
});

const dialogoAbierto = ref(false);

async function borrarTodo() {
    await vaciar();
    dialogoAbierto.value = false;
    toast.success('Historial borrado');
}
</script>

<template>
    <Head title="Historial" />

    <div class="mx-auto max-w-3xl">
        <div class="mb-5 flex items-start justify-between gap-3">
            <div>
                <h1 class="text-2xl font-bold tracking-tight md:text-3xl">
                    Historial
                </h1>
                <p class="mt-1 text-muted-foreground">
                    Todos tus cálculos, de cualquier calculadora.
                </p>
            </div>

            <Dialog v-model:open="dialogoAbierto">
                <DialogTrigger as-child>
                    <Button
                        v-if="items.length > 0"
                        variant="outline"
                        size="sm"
                        class="h-10 shrink-0"
                        >Borrar todo</Button
                    >
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Borrar todo el historial?</DialogTitle>
                        <DialogDescription>
                            Se borran los {{ items.length }} cálculos
                            {{
                                usuario
                                    ? 'de este dispositivo y de tu cuenta'
                                    : 'de este dispositivo'
                            }}. No se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter class="gap-2">
                        <DialogClose as-child>
                            <Button variant="secondary">Cancelar</Button>
                        </DialogClose>
                        <Button variant="destructive" @click="borrarTodo"
                            >Borrar todo</Button
                        >
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        <div
            v-if="!usuario"
            class="mb-5 flex items-start gap-3 rounded-xl border border-celeste/50 bg-celeste-suave p-4 text-sm"
        >
            <CloudOff class="mt-0.5 size-5 shrink-0 text-primary" />
            <p>
                Tu historial se guarda solo en este dispositivo.
                <Link href="/login" class="font-medium text-primary underline"
                    >Entrá con tu cuenta</Link
                >
                para tenerlo en el celular y en la compu.
            </p>
        </div>

        <div class="mb-4 space-y-3">
            <div class="relative">
                <Search
                    class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                    v-model="busqueda"
                    type="search"
                    class="h-11 pl-9 text-base"
                    placeholder="Buscar por cuenta, resultado o nota"
                    aria-label="Buscar en el historial"
                />
            </div>
            <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar">
                <button
                    v-for="f in filtros"
                    :key="f.valor"
                    type="button"
                    :class="
                        cn(
                            'h-9 rounded-full border px-4 text-sm font-medium transition-colors',
                            filtro === f.valor
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card text-muted-foreground hover:text-foreground',
                        )
                    "
                    :aria-pressed="filtro === f.valor"
                    @click="filtro = f.valor"
                >
                    {{ f.titulo }}
                </button>
            </div>
        </div>

        <div
            v-if="cargado && items.length === 0"
            class="rounded-2xl border border-dashed border-border p-10 text-center"
        >
            <History class="mx-auto size-10 text-muted-foreground" />
            <p class="mt-3 font-medium">Todavía no hay cálculos</p>
            <p class="mt-1 text-sm text-muted-foreground">
                Lo que calcules en cualquier calculadora aparece acá.
            </p>
            <Button as-child class="mt-4">
                <Link href="/calculadora">Ir a la calculadora</Link>
            </Button>
        </div>

        <p
            v-else-if="cargado && visibles.length === 0"
            class="py-10 text-center text-muted-foreground"
        >
            No hay cálculos que coincidan.
        </p>

        <section
            v-for="g in grupos"
            :key="g.clave"
            class="mb-4 rounded-2xl border border-border bg-card px-4"
        >
            <h2
                class="border-b border-border py-2.5 text-sm font-semibold text-muted-foreground first-letter:uppercase"
            >
                {{ g.titulo }}
            </h2>
            <ul class="divide-y divide-border">
                <ItemHistorial v-for="c in g.items" :key="c.id" :calculo="c" />
            </ul>
        </section>
    </div>
</template>
