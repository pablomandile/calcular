<script setup lang="ts">
import { Link, usePage } from '@inertiajs/vue3';
import AvisoCookies from '@/components/AvisoCookies.vue';
import { LogIn } from '@lucide/vue';
import { computed } from 'vue';
import BotonInstalar from '@/components/calcular/BotonInstalar.vue';
import LogoCalculAR from '@/components/calcular/LogoCalculAR.vue';
import MenuPantalla from '@/components/calcular/MenuPantalla.vue';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import UserMenuContent from '@/components/UserMenuContent.vue';
import { useCurrentUrl } from '@/composables/useCurrentUrl';
import { getInitials } from '@/composables/useInitials';
import type { ItemNav } from '@/lib/catalogo';
import { navegacion } from '@/lib/catalogo';
import { cn } from '@/lib/utils';

const page = usePage();
const usuario = computed(() => page.props.auth?.user ?? null);
const { currentUrl } = useCurrentUrl();

/** En escritorio hay lugar para Porcentajes como ítem propio. */
const navEscritorio: ItemNav[] = [
    ...navegacion
        .slice(0, 3)
        .map((i) =>
            i.href === '/finanzas' ? { ...i, activoEn: ['/finanzas'] } : i,
        ),
    {
        titulo: 'Porcentajes',
        href: '/porcentajes',
        icono: navegacion[2].icono,
        activoEn: ['/porcentajes'],
    },
    ...navegacion.slice(3),
];

function estaActivo(item: ItemNav): boolean {
    return item.activoEn.some(
        (ruta) =>
            currentUrl.value === ruta ||
            currentUrl.value.startsWith(ruta + '/'),
    );
}
</script>

<template>
    <div class="flex min-h-dvh flex-col">
        <header
            class="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75"
        >
            <div
                class="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4"
            >
                <Link href="/" class="shrink-0" aria-label="CalculAR, inicio">
                    <LogoCalculAR />
                </Link>

                <nav
                    class="ml-4 hidden flex-1 items-center gap-1 lg:flex"
                    aria-label="Principal"
                >
                    <Link
                        v-for="item in navEscritorio"
                        :key="item.href"
                        :href="item.href"
                        :class="
                            cn(
                                'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                                estaActivo(item) && 'bg-accent text-foreground',
                            )
                        "
                        :aria-current="estaActivo(item) ? 'page' : undefined"
                    >
                        {{ item.titulo }}
                    </Link>
                </nav>

                <div class="ml-auto flex items-center gap-1">
                    <div class="hidden sm:block">
                        <BotonInstalar variante="icono" />
                    </div>
                    <MenuPantalla />

                    <DropdownMenu v-if="usuario">
                        <DropdownMenuTrigger :as-child="true">
                            <Button
                                variant="ghost"
                                size="icon"
                                class="size-10 rounded-full"
                                aria-label="Mi cuenta"
                            >
                                <Avatar class="size-8">
                                    <AvatarImage
                                        v-if="usuario.avatar"
                                        :src="usuario.avatar"
                                        :alt="usuario.name"
                                    />
                                    <AvatarFallback
                                        class="bg-celeste-suave text-sm font-semibold text-primary"
                                    >
                                        {{ getInitials(usuario.name) }}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" class="w-56">
                            <UserMenuContent :user="usuario" />
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        v-else
                        as-child
                        variant="outline"
                        size="sm"
                        class="h-10"
                    >
                        <Link href="/login">
                            <LogIn />
                            Entrar
                        </Link>
                    </Button>
                </div>
            </div>
        </header>

        <main
            class="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-28 md:pt-8 lg:pb-12"
        >
            <slot />
        </main>

        <footer
            class="hidden border-t border-border/80 py-6 text-center text-sm text-muted-foreground lg:block"
        >
            Calcul<span class="font-semibold text-celeste">AR</span> · Hecho en
            Argentina · Los resultados son orientativos ·
            <Link href="/terminos" class="underline-offset-4 hover:underline"
                >Términos</Link
            >
            ·
            <Link href="/privacidad" class="underline-offset-4 hover:underline"
                >Privacidad</Link
            >
            ·
            <Link href="/cookies" class="underline-offset-4 hover:underline"
                >Cookies</Link
            >
        </footer>

        <!--
            Zona fija inferior del celular: el aviso de cookies va acá adentro,
            apilado arriba de la barra, para no taparla.
        -->
        <div class="fixed inset-x-0 bottom-0 z-30 lg:hidden">
            <AvisoCookies variante="apilado" />
            <nav
                class="zona-segura-abajo border-t border-border bg-card/95 backdrop-blur"
                aria-label="Principal"
            >
                <ul class="mx-auto grid max-w-md grid-cols-5">
                    <li v-for="item in navegacion" :key="item.href">
                        <Link
                            :href="item.href"
                            :class="
                                cn(
                                    'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors',
                                    estaActivo(item) && 'text-primary',
                                )
                            "
                            :aria-current="
                                estaActivo(item) ? 'page' : undefined
                            "
                        >
                            <span
                                :class="
                                    cn(
                                        'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                                        estaActivo(item) && 'bg-celeste-suave',
                                    )
                                "
                            >
                                <component :is="item.icono" class="size-5" />
                            </span>
                            {{ item.titulo }}
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>

        <!-- Escritorio: tarjeta abajo a la izquierda (los avisos van arriba). -->
        <AvisoCookies class="hidden lg:block" />

        <Toaster position="top-center" />
    </div>
</template>
