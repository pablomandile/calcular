<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

defineOptions({
    layout: {
        title: 'Verificá tu email',
        description:
            'Te mandamos un enlace por email: abrilo para verificar tu dirección.',
    },
});

defineProps<{
    status?: string;
}>();
</script>

<template>
    <Head title="Verificá tu email" />

    <div
        v-if="status === 'verification-link-sent'"
        class="mb-4 text-center text-sm font-medium text-green-600"
    >
        Te mandamos un nuevo enlace de verificación al email con el que te
        registraste.
    </div>

    <Form
        v-bind="send.form()"
        class="space-y-6 text-center"
        v-slot="{ processing }"
    >
        <Button :disabled="processing" variant="secondary">
            <Spinner v-if="processing" />
            Reenviar el email de verificación
        </Button>

        <TextLink :href="logout()" as="button" class="mx-auto block text-sm">
            Cerrar sesión
        </TextLink>
    </Form>
</template>
