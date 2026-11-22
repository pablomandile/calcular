<?php

namespace Tests\Feature;

use App\Http\Middleware\AceptoTerminos;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Términos y privacidad: versión vigente en config('legales.version'), la
 * constancia en `users`, y el middleware AceptoTerminos.
 */
class TerminosYPrivacidadTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, string>
     */
    private function datosDeRegistro(array $extra = []): array
    {
        return [
            'name' => 'Ana',
            'email' => 'ana@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            ...$extra,
        ];
    }

    public function test_no_deja_registrarse_sin_aceptar(): void
    {
        $this->post(route('register.store'), $this->datosDeRegistro())->assertSessionHasErrors('terminos');
        $this->assertGuest();
    }

    public function test_registrarse_con_la_casilla_deja_la_constancia(): void
    {
        $this->post(route('register.store'), $this->datosDeRegistro(['terminos' => '1']));

        $usuario = User::where('email', 'ana@example.com')->firstOrFail();
        $this->assertSame(config('legales.version'), $usuario->terminos_version);
        $this->assertNotNull($usuario->terminos_aceptados_en);
    }

    public function test_una_cuenta_sin_aceptar_va_a_aceptar_y_despues_vuelve_a_donde_iba(): void
    {
        $usuario = User::factory()->sinAceptarTerminos()->create();

        $this->actingAs($usuario)->get(route('profile.edit'))->assertRedirect(route('terminos.aceptar'));

        $this->get(route('terminos.aceptar'))
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('terminos/Aceptar')->where('primeraVez', true));

        $this->post(route('terminos.aceptar.store'), ['terminos' => '1'])->assertRedirect(route('profile.edit'));
        $this->assertTrue($usuario->fresh()?->aceptoTerminosVigentes());
    }

    public function test_aceptar_exige_la_casilla(): void
    {
        $usuario = User::factory()->sinAceptarTerminos()->create();

        $this->actingAs($usuario)->post(route('terminos.aceptar.store'))->assertSessionHasErrors('terminos');
        $this->assertNull($usuario->fresh()?->terminos_version);
    }

    public function test_subir_la_version_vuelve_a_pedir_la_aceptacion(): void
    {
        $usuario = User::factory()->create();
        $this->actingAs($usuario)->get(route('profile.edit'))->assertOk();

        config()->set('legales.version', '2099-01-01');

        $this->get(route('profile.edit'))->assertRedirect(route('terminos.aceptar'));
        $this->get(route('terminos.aceptar'))->assertInertia(fn (Assert $p) => $p->where('primeraVez', false));
    }

    public function test_sin_aceptar_igual_usa_las_calculadoras_lee_descarga_y_borra(): void
    {
        $usuario = User::factory()->sinAceptarTerminos()->create();
        $this->actingAs($usuario);

        foreach (['home', 'calculadora', 'cientifica', 'porcentajes', 'finanzas.tna-tea', 'fechas.edad', 'terminos', 'privacidad'] as $ruta) {
            $this->get(route($ruta))->assertOk();
        }

        $this->get(route('exportacion.datos'))->assertOk();

        $this->delete(route('profile.destroy'), ['password' => 'password'])->assertRedirect('/');
        $this->assertNull(User::find($usuario->id));
    }

    public function test_la_sincronizacion_sin_aceptar_recibe_409(): void
    {
        $usuario = User::factory()->sinAceptarTerminos()->create();

        $this->actingAs($usuario)
            ->postJson(route('historial.sincronizar'), ['calculos' => []])
            ->assertStatus(409);
    }

    public function test_las_exentas_con_sesion_son_exactamente_las_listadas(): void
    {
        $exentas = collect(Route::getRoutes())
            ->filter(fn ($r) => collect($r->gatherMiddleware())->contains(fn ($m) => $m === 'auth' || str_starts_with($m, 'auth:')))
            ->map(fn ($r) => $r->getName())
            ->filter(fn ($nombre) => $nombre !== null && Str::is(AceptoTerminos::EXENTAS, $nombre))
            ->sort()
            ->values()
            ->all();

        $this->assertSame([
            'exportacion.datos',
            'logout',
            'profile.destroy',
            'terminos.aceptar',
            'terminos.aceptar.store',
            'verification.notice',
            'verification.send',
            'verification.verify',
        ], $exentas);
    }

    public function test_los_textos_se_abren_con_sesion_y_sin_ella(): void
    {
        foreach (['terminos', 'privacidad'] as $ruta) {
            $this->get(route($ruta))
                ->assertOk()
                ->assertInertia(fn (Assert $p) => $p->component('Legal')->has('html')->has('version'));
        }

        $this->actingAs(User::factory()->create())->get(route('privacidad'))->assertOk();
    }

    public function test_el_contacto_de_la_config_reemplaza_el_marcador(): void
    {
        config()->set('legales.contacto', 'hola@ejemplo.com');

        $this->get(route('privacidad'))->assertInertia(fn (Assert $p) => $p
            ->where('html', fn (string $html) => str_contains($html, 'hola@ejemplo.com') && ! str_contains($html, ':contacto')));
    }

    public function test_perfil_ofrece_descargar_los_datos_como_promete_la_politica(): void
    {
        $perfil = (string) file_get_contents(resource_path('js/pages/settings/Profile.vue'));
        $politica = (string) file_get_contents(resource_path('legales/privacidad.md'));

        $this->assertStringContainsString('misDatos().url', $perfil);
        $this->assertStringContainsString('Descargar mis datos', $politica);
    }
}
