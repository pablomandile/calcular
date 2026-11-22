<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class SeoTest extends TestCase
{
    public function test_cada_pantalla_publica_tiene_titulo_y_descripcion(): void
    {
        $publicas = collect(Route::getRoutes())
            ->filter(fn ($r) => in_array('GET', $r->methods(), true)
                && ! collect($r->gatherMiddleware())->contains(fn ($m) => $m === 'auth' || $m === 'guest' || str_starts_with($m, 'auth:')))
            ->map(fn ($r) => $r->getName())
            ->filter(fn ($n) => $n !== null && ! preg_match('/^(feriados|sitemap|robots|storage\.|well-known|login|register|password\.|two-factor|passkey|verification|google|historial\.|terminos\.aceptar)/', $n))
            ->values();

        $this->assertNotEmpty($publicas);

        foreach ($publicas as $nombre) {
            $this->assertArrayHasKey($nombre, config('seo'), "La ruta {$nombre} no tiene entrada en config/seo.php");
        }
    }

    public function test_el_html_inicial_trae_el_titulo_de_la_pantalla(): void
    {
        $this->get('/finanzas/plazo-fijo')
            ->assertOk()
            ->assertSee('<title>Calculadora de plazo fijo - CalculAR</title>', false)
            ->assertSee('<meta name="description" content="Cuánto te da un plazo fijo', false);
    }

    public function test_sitemap_y_robots(): void
    {
        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/xml; charset=utf-8')
            ->assertSee(route('fechas.dias-habiles'), false)
            ->assertDontSee('/historial', false);

        $this->get('/robots.txt')
            ->assertOk()
            ->assertSee('Sitemap: '.route('sitemap'), false)
            ->assertSee('Disallow: /api/', false);
    }
}
