<?php

namespace Tests\Feature;

use App\Models\Feriado;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FeriadosTest extends TestCase
{
    use RefreshDatabase;

    private function fakeApi(): void
    {
        Http::fake([
            'api.argentinadatos.com/v1/feriados/2030' => Http::response([
                ['fecha' => '2030-01-01', 'tipo' => 'inamovible', 'nombre' => 'Año nuevo'],
                ['fecha' => '2030-03-25', 'tipo' => 'puente', 'nombre' => 'Puente turístico'],
                ['fecha' => '2030-03-25', 'tipo' => 'puente', 'nombre' => 'Duplicado'],
                ['fecha' => '2029-12-31', 'tipo' => 'inamovible', 'nombre' => 'De otro año'],
                ['fecha' => 'basura', 'nombre' => 'Mal formado'],
            ]),
            '*' => Http::response(null, 500),
        ]);
    }

    public function test_el_endpoint_trae_y_guarda_los_feriados_del_anio(): void
    {
        $this->fakeApi();

        $this->getJson('/api/feriados/2030')
            ->assertOk()
            ->assertJsonPath('disponible', true)
            ->assertJsonCount(2, 'feriados')
            ->assertJsonPath('feriados.0', ['fecha' => '2030-01-01', 'nombre' => 'Año nuevo', 'tipo' => 'inamovible'])
            ->assertJsonPath('feriados.1.nombre', 'Puente turístico / Duplicado')
            ->assertHeader('Cache-Control', 'max-age=86400, public');

        $this->assertSame(2, Feriado::query()->count());

        // La segunda vez sale de la base, sin volver a la API.
        $this->getJson('/api/feriados/2030')->assertOk();
        Http::assertSentCount(1);
    }

    public function test_si_la_api_falla_usa_el_respaldo(): void
    {
        Http::fake(['*' => Http::response(null, 503)]);

        $this->getJson('/api/feriados/2026')
            ->assertOk()
            ->assertJsonPath('disponible', true)
            ->assertJsonFragment(['fecha' => '2026-12-25', 'nombre' => 'Navidad']);
    }

    public function test_un_anio_sin_datos_avisa_que_no_esta_disponible(): void
    {
        Http::fake(['*' => Http::response(null, 500)]);

        $this->getJson('/api/feriados/2099')
            ->assertOk()
            ->assertJsonPath('disponible', false)
            ->assertJsonCount(0, 'feriados');

        // No vuelve a pedirlo enseguida.
        $this->getJson('/api/feriados/2099')->assertOk();
        Http::assertSentCount(1);
    }

    public function test_rechaza_anios_fuera_de_rango(): void
    {
        $this->getJson('/api/feriados/1800')->assertNotFound();
        $this->get('/api/feriados/dos-mil')->assertNotFound();
    }

    public function test_el_comando_reemplaza_los_feriados_del_anio(): void
    {
        $this->fakeApi();
        Feriado::query()->create(['fecha' => '2030-07-09', 'nombre' => 'Viejo', 'tipo' => 'inamovible']);

        $this->artisan('feriados:actualizar', ['anios' => ['2030']])
            ->expectsOutputToContain('2030: 2 feriados (fuente: api)')
            ->assertSuccessful();

        $this->assertDatabaseMissing('feriados', ['nombre' => 'Viejo']);
        $this->assertSame(2, Feriado::query()->count());
    }

    public function test_el_comando_falla_si_no_consigue_datos(): void
    {
        Http::fake(['*' => Http::response(null, 500)]);

        $this->artisan('feriados:actualizar', ['anios' => ['2099']])->assertFailed();
    }
}
