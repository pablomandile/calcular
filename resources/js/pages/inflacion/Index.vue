<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import PreguntasFrecuentes from '@/components/calcular/PreguntasFrecuentes.vue';
import TarjetaCalculadora from '@/components/calcular/TarjetaCalculadora.vue';
import { deSeccion } from '@/lib/catalogo';
import { preguntasInflacion } from '@/lib/preguntasFrecuentes';
</script>

<template>
    <Head title="Inflación" />
    <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Inflación</h1>
    <p class="mt-2 mb-6 text-muted-foreground">
        Actualizá montos con el IPC oficial del INDEC, calculá la inflación
        acumulada y seguí el CER y la UVA del Banco Central.
    </p>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TarjetaCalculadora
            v-for="c in deSeccion('inflacion')"
            :key="c.clave"
            :calculadora="c"
        />
    </div>
    <PreguntasFrecuentes :preguntas="preguntasInflacion" />
</template>
