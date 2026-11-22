<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import PreguntasFrecuentes from '@/components/calcular/PreguntasFrecuentes.vue';
import TarjetaCalculadora from '@/components/calcular/TarjetaCalculadora.vue';
import { deSeccion } from '@/lib/catalogo';
import { preguntasFechas } from '@/lib/preguntasFrecuentes';
</script>

<template>
    <Head title="Fechas" />
    <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Fechas</h1>
    <p class="mt-2 mb-6 text-muted-foreground">
        Días entre fechas, días hábiles con feriados de Argentina, sumar o
        restar y edad exacta.
    </p>
    <div class="grid gap-3 sm:grid-cols-2">
        <TarjetaCalculadora
            v-for="c in deSeccion('fechas')"
            :key="c.clave"
            :calculadora="c"
        />
    </div>
    <PreguntasFrecuentes :preguntas="preguntasFechas" />
</template>
