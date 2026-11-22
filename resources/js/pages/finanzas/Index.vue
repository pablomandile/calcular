<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import TarjetaCalculadora from '@/components/calcular/TarjetaCalculadora.vue';
import PreguntasFrecuentes from '@/components/calcular/PreguntasFrecuentes.vue';
import { buscarCalculadora, deSeccion } from '@/lib/catalogo';
import { preguntasFinanzas } from '@/lib/preguntasFrecuentes';

const porcentajes = buscarCalculadora('porcentajes');
</script>

<template>
    <Head title="Finanzas" />
    <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Finanzas</h1>
    <p class="mt-2 mb-6 text-muted-foreground">
        Tasas, plazo fijo, interés compuesto, compras en cuotas, descuentos con
        tope y porcentajes.
    </p>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TarjetaCalculadora
            v-for="c in deSeccion('finanzas')"
            :key="c.clave"
            :calculadora="c"
        />
        <TarjetaCalculadora v-if="porcentajes" :calculadora="porcentajes" />
    </div>

    <h2 class="mt-10 mb-1 text-lg font-semibold">Inflación</h2>
    <p class="mb-4 text-sm text-muted-foreground">
        IPC del INDEC, inflación acumulada, CER y UVA.
        <Link
            href="/inflacion"
            class="text-primary underline underline-offset-2"
            >Ver todo</Link
        >
    </p>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TarjetaCalculadora
            v-for="c in deSeccion('inflacion')"
            :key="c.clave"
            :calculadora="c"
        />
    </div>
    <PreguntasFrecuentes :preguntas="preguntasFinanzas" />
</template>
