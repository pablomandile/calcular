<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import TarjetaCalculadora from '@/components/calcular/TarjetaCalculadora.vue';
import { buscarCalculadora, deSeccion } from '@/lib/catalogo';

const porcentajes = buscarCalculadora('porcentajes');
</script>

<template>
    <Head title="Finanzas" />
    <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Finanzas</h1>
    <p class="mt-2 mb-6 text-muted-foreground">
        Tasas, plazo fijo, interés compuesto y porcentajes.
    </p>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TarjetaCalculadora
            v-for="c in deSeccion('finanzas')"
            :key="c.clave"
            :calculadora="c"
        />
        <TarjetaCalculadora v-if="porcentajes" :calculadora="porcentajes" />
    </div>
</template>
