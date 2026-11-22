<?php

namespace Tests\Feature;

use App\Models\Calculo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class HistorialTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function calculo(array $extra = []): array
    {
        return [
            'id' => (string) Str::uuid(),
            'tipo' => 'basica',
            'titulo' => '2 + 3 × 4',
            'resultado' => '14',
            'entrada' => ['valor' => '14'],
            'nota' => null,
            'creado_en' => '2026-11-21T15:00:00.000Z',
            ...$extra,
        ];
    }

    public function test_sin_sesion_no_hay_historial_de_cuenta(): void
    {
        $this->getJson(route('historial.index'))->assertUnauthorized();
        $this->postJson(route('historial.sincronizar'), [])->assertUnauthorized();
    }

    public function test_sube_los_calculos_y_devuelve_el_historial_completo(): void
    {
        $usuario = User::factory()->create();
        $a = $this->calculo(['creado_en' => '2026-11-21T10:00:00.000Z']);
        $b = $this->calculo(['tipo' => 'tna-tea', 'resultado' => 'TEA 79,59 %', 'entrada' => ['tasa' => '60', 'n' => 12]]);

        $this->actingAs($usuario)
            ->postJson(route('historial.sincronizar'), ['calculos' => [$a, $b]])
            ->assertOk()
            ->assertJsonCount(2, 'calculos')
            ->assertJsonPath('calculos.0.id', $b['id'])
            ->assertJsonPath('calculos.0.entrada', ['tasa' => '60', 'n' => 12])
            ->assertJsonPath('calculos.1.creado_en', '2026-11-21T10:00:00.000Z');
    }

    public function test_subir_dos_veces_lo_mismo_no_lo_duplica(): void
    {
        $usuario = User::factory()->create();
        $c = $this->calculo();

        $this->actingAs($usuario)->postJson(route('historial.sincronizar'), ['calculos' => [$c]]);
        $this->postJson(route('historial.sincronizar'), ['calculos' => [$c]])->assertJsonCount(1, 'calculos');

        $this->assertSame(1, Calculo::count());
    }

    public function test_cada_cuenta_ve_solo_lo_suyo_y_no_puede_pisar_un_uuid_ajeno(): void
    {
        $ana = User::factory()->create();
        $beto = User::factory()->create();
        $c = $this->calculo(['nota' => 'de Ana']);

        $this->actingAs($ana)->postJson(route('historial.sincronizar'), ['calculos' => [$c]]);

        $this->actingAs($beto)
            ->postJson(route('historial.sincronizar'), [
                'calculos' => [[...$c, 'nota' => 'pisado', 'actualizado_en' => '2030-01-01T00:00:00Z']],
                'borrados' => [$c['id']],
            ])
            ->assertOk()
            ->assertJsonCount(0, 'calculos');

        $this->assertSame('de Ana', Calculo::find($c['id'])?->nota);
        $this->actingAs($ana)->getJson(route('historial.index'))->assertJsonCount(1, 'calculos');
    }

    public function test_la_nota_mas_reciente_gana(): void
    {
        $usuario = User::factory()->create();
        $c = $this->calculo();
        $this->actingAs($usuario)->postJson(route('historial.sincronizar'), ['calculos' => [$c]]);

        $this->postJson(route('historial.sincronizar'), [
            'calculos' => [[...$c, 'nota' => 'nueva', 'actualizado_en' => now()->addMinute()->toIso8601String()]],
        ])->assertJsonPath('calculos.0.nota', 'nueva');

        $this->postJson(route('historial.sincronizar'), [
            'calculos' => [[...$c, 'nota' => 'vieja', 'actualizado_en' => now()->subDay()->toIso8601String()]],
        ])->assertJsonPath('calculos.0.nota', 'nueva');
    }

    public function test_borrar_y_vaciar(): void
    {
        $usuario = User::factory()->create();
        $a = $this->calculo();
        $b = $this->calculo();
        $this->actingAs($usuario)->postJson(route('historial.sincronizar'), ['calculos' => [$a, $b]]);

        $this->postJson(route('historial.sincronizar'), ['borrados' => [$a['id']]])
            ->assertJsonCount(1, 'calculos');

        // Vaciar borra lo anterior; lo que viene en el mismo lote queda.
        $nuevo = $this->calculo();
        $this->postJson(route('historial.sincronizar'), ['vaciar' => true, 'calculos' => [$nuevo]])
            ->assertJsonCount(1, 'calculos')
            ->assertJsonPath('calculos.0.id', $nuevo['id']);
    }

    public function test_valida_lo_que_llega(): void
    {
        $usuario = User::factory()->create();

        $this->actingAs($usuario)
            ->postJson(route('historial.sincronizar'), ['calculos' => [$this->calculo(['tipo' => 'inventado', 'id' => 'no-es-uuid'])]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['calculos.0.tipo', 'calculos.0.id']);
    }

    public function test_eliminar_la_cuenta_borra_el_historial_y_las_sesiones(): void
    {
        $usuario = User::factory()->create();
        $this->actingAs($usuario)->postJson(route('historial.sincronizar'), ['calculos' => [$this->calculo()]]);
        DB::table('sessions')->insert([
            'id' => 'otra-sesion', 'user_id' => $usuario->id, 'payload' => '', 'last_activity' => time(),
        ]);

        $this->delete(route('profile.destroy'), ['password' => 'password'])->assertRedirect('/');

        $this->assertSame(0, Calculo::count());
        $this->assertSame(0, DB::table('sessions')->where('user_id', $usuario->id)->count());
    }

    public function test_descargar_mis_datos_trae_la_cuenta_y_el_historial(): void
    {
        $usuario = User::factory()->create(['name' => 'Ana']);
        $c = $this->calculo();
        $this->actingAs($usuario)->postJson(route('historial.sincronizar'), ['calculos' => [$c]]);

        $respuesta = $this->get(route('exportacion.datos'))->assertOk();
        $this->assertStringContainsString('attachment', (string) $respuesta->headers->get('Content-Disposition'));

        $datos = json_decode($respuesta->streamedContent(), true);
        $this->assertSame('Ana', $datos['cuenta']['nombre']);
        $this->assertSame($c['id'], $datos['historial'][0]['id']);
    }
}
