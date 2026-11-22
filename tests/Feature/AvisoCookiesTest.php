<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * El aviso de cookies es informativo porque todo lo que CalculAR guarda en el
 * navegador es necesario. Eso es cierto solo mientras la página de cookies
 * liste todo: este test busca cada lugar donde el código escribe en el
 * navegador y exige que su clave figure en la página.
 */
class AvisoCookiesTest extends TestCase
{
    use RefreshDatabase;

    private function fuente(string $ruta): string
    {
        return (string) file_get_contents(base_path($ruta));
    }

    /**
     * Cada nombre que el código usa para guardar algo en el navegador.
     *
     * @return array<string, string> clave => archivo donde se escribe
     */
    private function clavesGuardadasEnElNavegador(): array
    {
        $claves = [];

        $archivos = collect(File::allFiles(resource_path('js')))
            ->filter(fn ($f) => in_array($f->getExtension(), ['ts', 'vue'], true))
            ->reject(fn ($f) => str_ends_with($f->getFilename(), '.test.ts'))
            // El envoltorio de localStorage: las claves se buscan en quien lo llama.
            ->reject(fn ($f) => $f->getRelativePathname() === 'lib'.DIRECTORY_SEPARATOR.'navegador.ts')
            // Las rutas generadas por Wayfinder no guardan nada.
            ->reject(fn ($f) => preg_match('#[\\\\/](routes|actions|wayfinder)[\\\\/]#', $f->getPathname()) === 1);

        foreach ($archivos as $f) {
            $codigo = $f->getContents();
            $nombre = $f->getRelativePathname();

            // Constantes del archivo, para resolver `guardar(CLAVE, …)`.
            preg_match_all('/const (\w+)\s*=\s*[\'"`]([^\'"`$]+)/', $codigo, $m, PREG_SET_ORDER);
            $constantes = collect($m)->mapWithKeys(fn ($c) => [$c[1] => $c[2]]);

            // localStorage directo y el envoltorio almacenLocal.guardar().
            preg_match_all(
                '/(?:(?:local|session)Storage\.setItem|almacenLocal\.guardar)\(\s*(?:[\'"`]([^\'"`$]+)|(\w+))/',
                $codigo,
                $m,
                PREG_SET_ORDER,
            );

            foreach ($m as $uso) {
                $variable = $uso[2] ?? '';
                $clave = $uso[1] !== '' ? $uso[1] : $constantes->get($variable);
                $this->assertNotNull($clave, "No se pudo resolver la clave {$variable} en {$nombre}");
                $claves[$clave] = $nombre;
            }

            // Cookies que escribe el front.
            preg_match_all('/setCookie\(\s*[\'"](\w+)[\'"]/', $codigo, $m);
            foreach ($m[1] as $clave) {
                $claves[$clave] = $nombre;
            }

            // IndexedDB (idb-keyval): base y almacén.
            preg_match_all('/createStore\(\s*[\'"]([^\'"]+)[\'"]\s*,\s*[\'"]([^\'"]+)[\'"]/', $codigo, $m, PREG_SET_ORDER);
            foreach ($m as $uso) {
                $claves[$uso[1]] = $nombre;
                $claves[$uso[2]] = $nombre;
            }
        }

        return $claves;
    }

    public function test_la_pagina_de_cookies_declara_todo_lo_que_el_codigo_guarda(): void
    {
        $claves = $this->clavesGuardadasEnElNavegador();

        // Ancla: si un cambio de estilo dejara a los regex sin encontrar nada,
        // el test pasaría sin probar nada.
        foreach ([
            'appearance',
            'calcular.memoria',
            'calcular.modoAngulo',
            'calcular.feriados.',
            'calcular.sync.pendientes',
            'calcular.sync.usuario',
            'calcular.aviso-cookies',
            'historial',
        ] as $esperada) {
            $this->assertArrayHasKey($esperada, $claves, "La búsqueda no encontró «{$esperada}»");
        }

        $pagina = $this->fuente('resources/js/pages/Cookies.vue');

        foreach ($claves as $clave => $archivo) {
            $this->assertTrue(
                str_contains($pagina, $clave),
                "«{$clave}» se guarda en {$archivo} y no figura en la página de cookies",
            );
        }
    }

    public function test_la_pagina_declara_las_cookies_del_servidor(): void
    {
        $pagina = $this->fuente('resources/js/pages/Cookies.vue');

        $this->assertStringContainsString((string) config('session.cookie'), $pagina);
        $this->assertStringContainsString('XSRF-TOKEN', $pagina);
        $this->assertStringContainsString('remember_web_', $pagina);
    }

    public function test_el_aviso_esta_en_todas_las_puertas_de_entrada(): void
    {
        $this->assertStringContainsString('<AvisoCookies', $this->fuente('resources/js/layouts/CalcLayout.vue'));
        $this->assertStringContainsString('<AvisoCookies', $this->fuente('resources/js/layouts/AuthLayout.vue'));
    }

    public function test_se_abre_con_y_sin_sesion(): void
    {
        $this->get(route('cookies'))
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('Cookies')->where('auth.user', null));

        $this->actingAs(User::factory()->create())
            ->get(route('cookies'))
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('Cookies'));
    }
}
