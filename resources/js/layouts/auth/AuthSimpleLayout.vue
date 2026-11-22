<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { home } from '@/routes';

defineProps<{
    title?: string;
    description?: string;
}>();
</script>

<template>
    <div
        class="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10"
    >
        <div class="w-full max-w-sm">
            <div class="flex flex-col gap-8">
                <div class="flex flex-col items-center gap-4">
                    <Link
                        :href="home()"
                        class="flex flex-col items-center gap-2 font-medium"
                    >
                        <!--
                            El logo con el nombre (resources/marca, generado con
                            npm run generar:iconos). En oscuro, la variante con
                            "Calcul" en blanco: el azul marino no se lee.
                        -->
                        <img
                            src="/img/logo-calcular.webp?v=1"
                            alt="CalculAR"
                            width="480"
                            height="461"
                            class="h-auto w-40 dark:hidden"
                        />
                        <img
                            src="/img/logo-calcular-oscuro.webp?v=1"
                            alt="CalculAR"
                            width="480"
                            height="461"
                            class="hidden h-auto w-40 dark:block"
                        />
                        <span class="sr-only">{{ title }}</span>
                    </Link>
                    <div class="space-y-2 text-center">
                        <h1 class="text-xl font-medium">{{ title }}</h1>
                        <p class="text-center text-sm text-muted-foreground">
                            {{ description }}
                        </p>
                    </div>
                </div>
                <slot />
            </div>
        </div>
    </div>
</template>
