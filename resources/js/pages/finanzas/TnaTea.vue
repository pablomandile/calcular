<script setup lang="ts">
import { computed, ref } from 'vue';
import CampoNumero from '@/components/calcular/CampoNumero.vue';
import EncabezadoCalculadora from '@/components/calcular/EncabezadoCalculadora.vue';
import FilaDato from '@/components/calcular/FilaDato.vue';
import SelectorOpciones from '@/components/calcular/SelectorOpciones.vue';
import SeccionExplicacion from '@/components/calcular/SeccionExplicacion.vue';
import TarjetaResultado from '@/components/calcular/TarjetaResultado.vue';
import { Button } from '@/components/ui/button';
import { useCalculo } from '@/composables/useCalculo';
import { useReusar } from '@/composables/useReusar';
import { formatearPorcentaje } from '@/lib/calc/numero';
import {
    CAPITALIZACIONES,
    convertirTasa,
    nombreCapitalizacion,
} from '@/lib/calc/tasas';
import { numeroRequerido } from '@/lib/calc/validar';

type Sentido = 'tna-a-tea' | 'tea-a-tna';

const datos = ref({
    sentido: 'tna-a-tea' as Sentido,
    tasa: '',
    n: 12,
});

const origen = computed(() =>
    datos.value.sentido === 'tna-a-tea' ? 'TNA' : 'TEA',
);
const destino = computed(() =>
    datos.value.sentido === 'tna-a-tea' ? 'TEA' : 'TNA',
);

const { resultado, error, desactualizado, ejecutar } = useCalculo(
    datos,
    (d) => {
        const tasa = numeroRequerido(
            d.tasa,
            d.sentido === 'tna-a-tea' ? 'la TNA' : 'la TEA',
        ).div(100);

        if (tasa.lte(-1)) {
            throw new Error('La tasa tiene que ser mayor a −100 %.');
        }

        return convertirTasa(d.sentido, tasa, d.n);
    },
    (d, r) => {
        const [de, a] =
            d.sentido === 'tna-a-tea' ? ['TNA', 'TEA'] : ['TEA', 'TNA'];
        const valorDe = d.sentido === 'tna-a-tea' ? r.tna : r.tea;
        const valorA = d.sentido === 'tna-a-tea' ? r.tea : r.tna;

        return {
            tipo: 'tna-tea',
            titulo: `${de} ${formatearPorcentaje(valorDe)} · capitalización ${nombreCapitalizacion(d.n).toLowerCase()}`,
            resultado: `${a} ${formatearPorcentaje(valorA)}`,
            entrada: { ...d },
        };
    },
);

useReusar('tna-tea', (entrada) => {
    datos.value = {
        sentido: entrada.sentido === 'tea-a-tna' ? 'tea-a-tna' : 'tna-a-tea',
        tasa: String(entrada.tasa ?? ''),
        n: Number(entrada.n) || 12,
    };
    ejecutar();
});

const valorPrincipal = computed(() => {
    const r = resultado.value;

    if (!r) {
        return null;
    }

    return formatearPorcentaje(
        datos.value.sentido === 'tna-a-tea' ? r.tea : r.tna,
    );
});

const periodo = computed(
    () =>
        CAPITALIZACIONES.find((c) => c.n === datos.value.n)?.periodo ??
        'del período',
);

const apartados = [
    { id: 'que', titulo: 'Qué calcula' },
    { id: 'formula', titulo: 'Fórmulas' },
    { id: 'ejemplo', titulo: 'Ejemplo' },
    { id: 'supuestos', titulo: 'Supuestos y límites' },
];
</script>

<template>
    <EncabezadoCalculadora clave="tna-tea" />

    <div class="grid items-start gap-6 lg:grid-cols-2">
        <form
            class="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
            @submit.prevent="ejecutar"
        >
            <SelectorOpciones
                v-model="datos.sentido"
                nombre="sentido"
                etiqueta="¿Qué querés convertir?"
                :opciones="[
                    { valor: 'tna-a-tea', titulo: 'TNA → TEA' },
                    { valor: 'tea-a-tna', titulo: 'TEA → TNA' },
                ]"
            />
            <CampoNumero
                id="tasa"
                v-model="datos.tasa"
                :etiqueta="
                    origen === 'TNA'
                        ? 'Tasa nominal anual (TNA)'
                        : 'Tasa efectiva anual (TEA)'
                "
                sufijo="%"
                placeholder="Por ejemplo: 60"
            />
            <SelectorOpciones
                v-model="datos.n"
                nombre="capitalizacion"
                etiqueta="Capitalización"
                :opciones="
                    CAPITALIZACIONES.map((c) => ({
                        valor: c.n,
                        titulo: c.nombre,
                    }))
                "
            />
            <Button type="submit" size="lg" class="h-11 text-base"
                >Calcular</Button
            >
        </form>

        <TarjetaResultado
            :etiqueta="destino"
            :valor="valorPrincipal"
            :error="error"
            :desactualizado="desactualizado"
        >
            <template v-if="resultado">
                <FilaDato
                    :etiqueta="origen"
                    :valor="
                        formatearPorcentaje(
                            origen === 'TNA' ? resultado.tna : resultado.tea,
                        )
                    "
                />
                <FilaDato
                    :etiqueta="`Tasa ${periodo}`"
                    ayuda="TNA dividida por la cantidad de períodos"
                    :valor="formatearPorcentaje(resultado.tasaPeriodica, 4)"
                />
                <FilaDato
                    etiqueta="Tasa efectiva mensual (TEM)"
                    :valor="formatearPorcentaje(resultado.tem, 4)"
                />
            </template>
        </TarjetaResultado>
    </div>

    <SeccionExplicacion :apartados="apartados">
        <template #que>
            <p>
                La <strong>TNA</strong> (tasa nominal anual) es la tasa que
                anuncian bancos y billeteras, pero no dice cuánto crece tu plata
                en un año: para eso hay que saber cada cuánto se acreditan los
                intereses. La <strong>TEA</strong> (tasa efectiva anual) incluye
                ese efecto de reinvertir los intereses, así que es la que sirve
                para comparar.
            </p>
        </template>
        <template #formula>
            <p>
                Con n = cantidad de capitalizaciones por año (365, 12, 4, 2 o
                1):
            </p>
            <ul class="numeros">
                <li>TEA = (1 + TNA / n)ⁿ − 1</li>
                <li>TNA = n × ((1 + TEA)^(1/n) − 1)</li>
                <li>TEM = (1 + TEA)^(1/12) − 1</li>
            </ul>
        </template>
        <template #ejemplo>
            <p>
                Una TNA del 60 % con capitalización mensual paga 5 % por mes.
                Reinvertido durante 12 meses: 1,05¹² − 1 = 79,59 % de TEA.
            </p>
        </template>
        <template #supuestos>
            <ul>
                <li>La tasa y la frecuencia no cambian durante el año.</li>
                <li>
                    No incluye impuestos, comisiones ni seguros: para un
                    préstamo, lo que importa es el CFT.
                </li>
                <li>
                    Un error común: dividir la TEA por 12 para sacar la tasa
                    mensual. Lo correcto es la TEM de arriba.
                </li>
            </ul>
        </template>
    </SeccionExplicacion>
</template>
