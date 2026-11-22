<?php

namespace Tests\Feature;

use App\Enums\SerieIndice;
use App\Models\Indice;
use App\Services\Indices\SincronizadorDeIndices;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class IndicesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Los reintentos esperan entre pedidos: en los tests, sin esperar.
        Sleep::fake();
    }

    private function fingirApis(): void
    {
        Http::fake([
            'apis.datos.gob.ar/*' => Http::response(['data' => [
                ['2016-12-01', 100],
                ['2017-01-01', 101.5859],
                ['2017-02-01', null], // sin publicar todavía
            ]]),
            // El BCRA contesta de la más nueva a la más vieja, de a 1000.
            'api.bcra.gob.ar/*' => Http::response([
                'metadata' => ['resultset' => ['count' => 2]],
                'results' => [['idVariable' => 30, 'detalle' => [
                    ['fecha' => '2026-11-22', 'valor' => 875.12573],
                    ['fecha' => '2026-11-21', 'valor' => 874.2226],
                ]]],
            ]),
        ]);
    }

    public function test_el_comando_trae_las_tres_series(): void
    {
        $this->fingirApis();

        $this->artisan('indices:actualizar')->assertSuccessful();

        $this->assertSame(2, Indice::query()->de(SerieIndice::Ipc)->count());
        $this->assertSame(2, Indice::query()->de(SerieIndice::Cer)->count());
        $this->assertEqualsWithDelta(101.5859, (float) Indice::query()->de(SerieIndice::Ipc)->orderByDesc('fecha')->value('valor'), 1e-9);
    }

    public function test_sincronizar_dos_veces_no_duplica_y_toma_las_correcciones(): void
    {
        // El INDEC revisa enero en la segunda consulta.
        Http::fake(['apis.datos.gob.ar/*' => Http::sequence()
            ->push(['data' => [['2016-12-01', 100], ['2017-01-01', 101.5859]]])
            ->push(['data' => [['2017-01-01', 101.6]]]),
        ]);
        $sincronizador = app(SincronizadorDeIndices::class);
        $sincronizador->sincronizar(SerieIndice::Ipc);
        $r = $sincronizador->sincronizar(SerieIndice::Ipc);

        $this->assertSame(0, $r['nuevos']);
        $this->assertSame(2, Indice::query()->de(SerieIndice::Ipc)->count());
        $this->assertEqualsWithDelta(101.6, (float) Indice::query()->de(SerieIndice::Ipc)->orderByDesc('fecha')->value('valor'), 1e-9);
    }

    public function test_la_segunda_vez_pide_desde_un_poco_antes_del_ultimo(): void
    {
        $this->fingirApis();
        app(SincronizadorDeIndices::class)->sincronizar(SerieIndice::Ipc);
        app(SincronizadorDeIndices::class)->sincronizar(SerieIndice::Ipc);

        // Último guardado: enero 2017 → pide desde octubre 2016 (3 meses antes).
        Http::assertSent(fn ($r) => str_contains($r->url(), 'start_date=2016-10-01'));
    }

    public function test_el_bcra_se_pagina_hasta_juntar_todo(): void
    {
        Http::fake(['api.bcra.gob.ar/*' => Http::sequence()
            ->push(['metadata' => ['resultset' => ['count' => 1001]], 'results' => [['detalle' => array_map(
                fn ($i) => ['fecha' => now()->subDays($i)->toDateString(), 'valor' => 1000 - $i],
                range(0, 999),
            )]]])
            ->push(['metadata' => ['resultset' => ['count' => 1001]], 'results' => [['detalle' => [
                ['fecha' => now()->subDays(1000)->toDateString(), 'valor' => 1],
            ]]]]),
        ]);

        app(SincronizadorDeIndices::class)->sincronizar(SerieIndice::Uva);

        $this->assertSame(1001, Indice::query()->de(SerieIndice::Uva)->count());
        Http::assertSent(fn ($r) => str_contains($r->url(), 'offset=1000'));
    }

    public function test_una_fuente_caida_no_rompe_las_otras(): void
    {
        Http::fake([
            'apis.datos.gob.ar/*' => Http::response('caído', 503),
            'api.bcra.gob.ar/*' => Http::response([
                'metadata' => ['resultset' => ['count' => 1]],
                'results' => [['detalle' => [['fecha' => '2026-11-22', 'valor' => 2206.78]]]],
            ]),
        ]);

        $this->artisan('indices:actualizar')->assertFailed();

        $this->assertSame(0, Indice::query()->de(SerieIndice::Ipc)->count());
        $this->assertSame(1, Indice::query()->de(SerieIndice::Uva)->count());
    }

    public function test_el_endpoint_devuelve_la_serie_compacta(): void
    {
        $this->fingirApis();
        $this->artisan('indices:actualizar');

        $respuesta = $this->getJson('/api/indices/ipc')
            ->assertOk()
            ->assertExactJson([
                'serie' => 'ipc',
                'nombre' => 'IPC Nacional (INDEC)',
                'mensual' => true,
                'ultimo' => '2017-01-01',
                'valores' => [['2016-12-01', '100'], ['2017-01-01', '101.5859']],
            ]);

        $this->assertStringContainsString('max-age=3600', (string) $respuesta->headers->get('Cache-Control'));
    }

    public function test_sin_datos_los_trae_en_el_momento_y_si_falla_no_insiste(): void
    {
        Http::fake(['*' => Http::response('caído', 503)]);

        $this->getJson('/api/indices/cer')->assertOk()->assertJson(['ultimo' => null, 'valores' => []]);
        $this->getJson('/api/indices/cer')->assertOk();

        // 3 intentos (los reintentos) la primera vez; la segunda no pide nada.
        Http::assertSentCount(3);
    }

    public function test_una_serie_que_no_existe_da_404(): void
    {
        $this->getJson('/api/indices/icl')->assertNotFound();
    }

    public function test_cer_y_uva_son_la_misma_pantalla_con_otra_serie(): void
    {
        $this->get('/inflacion/uva')->assertInertia(fn (Assert $p) => $p
            ->component('inflacion/SerieDiaria')
            ->where('serie', 'uva'));
    }

    public function test_se_actualizan_todos_los_dias_y_no_a_la_hora_en_punto(): void
    {
        $this->artisan('schedule:list')
            ->expectsOutputToContain('17 10 * * *')
            ->assertSuccessful();
    }
}
