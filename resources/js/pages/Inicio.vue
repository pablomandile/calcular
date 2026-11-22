<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import TarjetaCalculadora from '@/components/calcular/TarjetaCalculadora.vue';
import type { Seccion } from '@/lib/catalogo';
import { deSeccion, titulosSeccion } from '@/lib/catalogo';

const secciones: Seccion[] = ['basicas', 'finanzas', 'fechas'];
</script>

<template>
    <Head title="Calculadoras para Argentina" />

    <section class="mb-8 md:mb-12">
        <h1 class="text-3xl font-bold tracking-tight md:text-5xl">
            Calcul<span class="text-celeste">AR</span>
        </h1>
        <p class="mt-3 max-w-2xl text-lg text-muted-foreground">
            Calculadora, científica, tasas, plazo fijo, porcentajes y fechas con
            feriados argentinos. Todo en un lugar, con historial de cada cuenta.
        </p>
    </section>

    <section v-for="s in secciones" :key="s" class="mb-8">
        <h2
            class="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase"
        >
            {{ titulosSeccion[s] }}
        </h2>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <TarjetaCalculadora
                v-for="c in deSeccion(s)"
                :key="c.clave"
                :calculadora="c"
            />
        </div>
    </section>

    <p class="mt-10 text-center text-sm text-muted-foreground md:hidden">
        <Link href="/terminos" class="underline underline-offset-4"
            >Términos</Link
        >
        ·
        <Link href="/privacidad" class="underline underline-offset-4"
            >Privacidad</Link
        >
    </p>
</template>
