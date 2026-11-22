<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use Tests\TestCase;

/**
 * El CDN de Hostinger borra el Vary: X-Inertia. Sin `no-store` en el JSON, una
 * pestaña restaurada muestra el JSON crudo en vez de la página.
 */
class CacheDeInertiaTest extends TestCase
{
    private function versionDeInertia(): string
    {
        return (string) app(HandleInertiaRequests::class)->version(request());
    }

    public function test_prohibe_guardar_la_respuesta_json_de_inertia(): void
    {
        $respuesta = $this->get('/calculadora', [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => $this->versionDeInertia(),
        ]);

        $respuesta->assertOk();
        $this->assertStringContainsString('application/json', (string) $respuesta->headers->get('Content-Type'));
        $this->assertStringContainsString('no-store', (string) $respuesta->headers->get('Cache-Control'));
        $this->assertStringContainsString('X-Inertia', (string) $respuesta->headers->get('Vary'));
    }

    public function test_deja_cacheable_el_html_para_no_perder_el_bfcache(): void
    {
        $respuesta = $this->get('/calculadora');

        $respuesta->assertOk();
        $this->assertStringContainsString('text/html', (string) $respuesta->headers->get('Content-Type'));
        $this->assertStringNotContainsString('no-store', (string) $respuesta->headers->get('Cache-Control'));
    }

    public function test_el_service_worker_rescata_una_navegacion_que_recibio_json(): void
    {
        $sw = (string) file_get_contents(public_path('sw.js'));

        $this->assertStringContainsString("headers.get('x-inertia')", $sw);
        $this->assertStringContainsString("cache: 'reload'", $sw);
        $this->assertStringContainsString('pedir: pedirDocumento', $sw);
    }
}
