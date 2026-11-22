<script setup lang="ts">
import { cn } from '@/lib/utils';

/**
 * Tecla de calculadora. Variantes:
 * - numero: dígitos y teclas de edición (C, ⌫, %), ámbar sobre marrón.
 * - operador / funcion: celeste con texto blanco.
 * - igual: azul profundo.
 * Forma: círculo (calculadora normal) o píldora (científica).
 */
withDefaults(
    defineProps<{
        variante?: 'numero' | 'operador' | 'funcion' | 'igual';
        forma?: 'circulo' | 'pildora';
        activa?: boolean;
    }>(),
    { variante: 'numero', forma: 'pildora', activa: false },
);

const estilos = {
    numero: 'bg-calc-num text-calc-num-texto hover:brightness-110 dark:hover:brightness-150',
    operador: 'bg-calc-op text-calc-op-texto hover:brightness-110',
    funcion: 'bg-calc-op text-calc-op-texto font-medium hover:brightness-110',
    igual: 'bg-calc-igual text-white hover:brightness-110',
};
</script>

<template>
    <button
        type="button"
        :class="
            cn(
                'numeros flex items-center justify-center rounded-full transition-[filter,transform] outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring active:scale-95',
                estilos[variante],
                // La altura la fija el contenedor con --alto-tecla, según el
                // alto de la pantalla: en celulares bajos el círculo se
                // vuelve píldora y entra el teclado entero.
                forma === 'circulo'
                    ? 'h-(--alto-tecla) w-full max-w-20 justify-self-center text-[1.75rem] font-light sm:text-3xl'
                    : 'h-(--alto-tecla) w-full text-2xl font-light',
                variante === 'funcion' && 'text-lg',
                activa && 'ring-[3px] ring-sol',
            )
        "
    >
        <slot />
    </button>
</template>
