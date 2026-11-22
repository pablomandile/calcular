<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { ref } from 'vue';
import CampoNumero from '@/components/calcular/CampoNumero.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import TarjetaResultado from '@/components/calcular/TarjetaResultado.vue';
import { Button } from '@/components/ui/button';
import { useCalculo } from '@/composables/useCalculo';
import { useReusar } from '@/composables/useReusar';
import { actualizarMonto } from '@/lib/calc/inflacion';
import {
    formatearNumero,
    formatearPesos,
    formatearPorcentaje,
} from '@/lib/calc/numero';
import { numeroRequerido } from '@/lib/calc/validar';

const datos = ref({ monto: '', inflacion: '' });

const { resultado, error, desactualizado, ejecutar } = useCalculo(
    datos,
    (d) => {
        const monto = numeroRequerido(d.monto, 'el monto');
        const inflacion = numeroRequerido(
            d.inflacion,
            'la inflación del período',
        ).div(100);

        return { ...actualizarMonto(monto, inflacion), monto, inflacion };
    },
    (d, r) => ({
        tipo: 'actualizar-monto',
        titulo: `${formatearPesos(r.monto)} con ${formatearPorcentaje(r.inflacion)} de inflación`,
        resultado: formatearPesos(r.montoFinal),
        entrada: { ...d },
    }),
);

useReusar('actualizar-monto', (entrada) => {
    datos.value = {
        monto: String(entrada.monto ?? ''),
        inflacion: String(entrada.inflacion ?? ''),
    };
    ejecutar();
});

const apartados = [
    { id: 'que', titulo: 'Qué calcula' },
    { id: 'formula', titulo: 'Fórmula' },
    { id: 'ejemplo', titulo: 'Ejemplo' },
    { id: 'supuestos', titulo: 'Supuestos y límites' },
];
</script>

<template>
    <EncabezadoCalculadora clave="actualizar-monto" />

    <div class="grid items-start gap-6 lg:grid-cols-2">
        <form
            class="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
            @submit.prevent="ejecutar"
        >
            <CampoNumero
                id="monto"
                v-model="datos.monto"
                etiqueta="Monto original"
                prefijo="$"
                placeholder="Por ejemplo: 100.000"
            />
            <CampoNumero
                id="inflacion"
                v-model="datos.inflacion"
                etiqueta="Inflación acumulada del período"
                sufijo="%"
                placeholder="Por ejemplo: 35"
                ayuda="Toda la inflación entre la fecha del monto y hoy, no la mensual."
            />
            <Button type="submit" size="lg" class="h-11 text-base"
                >Calcular</Button
            >
        </form>

        <TarjetaResultado
            etiqueta="Monto actualizado"
            :valor="resultado ? formatearPesos(resultado.montoFinal) : null"
            :error="error"
            :desactualizado="desactualizado"
        >
            <template v-if="resultado">
                <FilaDato
                    etiqueta="Aumento"
                    :valor="formatearPesos(resultado.diferencia)"
                />
                <FilaDato
                    etiqueta="Coeficiente"
                    :valor="
                        formatearNumero(resultado.factor, { maxDecimales: 6 })
                    "
                />
                <FilaDato
                    etiqueta="Poder de compra perdido"
                    ayuda="Cuánto menos compra el monto original"
                    :valor="formatearPorcentaje(resultado.poderDeCompraPerdido)"
                />
            </template>
            <template #extra>
                <p class="mt-3 text-sm text-muted-foreground">
                    ¿No sabés la inflación del período?
                    <Link
                        href="/inflacion/ipc"
                        class="text-primary underline underline-offset-2"
                        >Calculala con el IPC</Link
                    >
                </p>
            </template>
        </TarjetaResultado>
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #que>
            <p>
                Lleva un monto a valores de hoy cuando ya sabés la inflación de
                todo el período (por ejemplo, la que publicó el INDEC entre dos
                meses). También muestra cuánto poder de compra perdió el monto
                original.
            </p>
        </template>
        <template #formula>
            <ul class="numeros">
                <li>Coeficiente = 1 + inflación / 100</li>
                <li>Monto actualizado = monto × coeficiente</li>
                <li>Poder de compra perdido = 1 − 1 / coeficiente</li>
            </ul>
        </template>
        <template #ejemplo>
            <p>
                {{ formatearPesos(100000) }} con 150 % de inflación pasan a
                {{ formatearPesos(250000) }}. El monto original compra un 60 %
                menos: con 100 % de inflación se pierde la mitad, no todo.
            </p>
        </template>
        <template #supuestos>
            <ul>
                <li>
                    El porcentaje tiene que cubrir exactamente el período, con
                    el mismo índice de punta a punta.
                </li>
                <li>
                    Es una equivalencia general de precios, no la de un producto
                    en particular ni un ajuste de contrato.
                </li>
            </ul>
        </template>
    </SeccionExplicacion>
</template>
