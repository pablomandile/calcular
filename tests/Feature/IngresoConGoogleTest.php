<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as UsuarioDeSocialite;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class IngresoConGoogleTest extends TestCase
{
    use RefreshDatabase;

    private function conCredenciales(): void
    {
        config([
            'services.google.client_id' => 'id-de-prueba.apps.googleusercontent.com',
            'services.google.client_secret' => 'secreto-de-prueba',
            'services.google.redirect' => 'http://localhost/auth/google/callback',
        ]);
    }

    private function respuestaDeGoogle(string $id, string $email, ?string $nombre = 'Ana Pérez', bool $verificado = true): void
    {
        $cuenta = new UsuarioDeSocialite;
        $cuenta->map(['id' => $id, 'email' => $email, 'name' => $nombre, 'avatar' => 'https://lh3.googleusercontent.com/a/foto']);
        $cuenta->setRaw(['email_verified' => $verificado]);

        Socialite::shouldReceive('driver')->with('google')->andReturn(
            Mockery::mock()->shouldReceive('user')->andReturn($cuenta)->getMock(),
        );
    }

    public function test_sin_credenciales_la_opcion_no_existe(): void
    {
        config(['services.google.client_id' => null, 'services.google.client_secret' => null]);

        $this->get(route('google.redirect'))->assertNotFound();
        $this->get(route('google.callback'))->assertNotFound();
        $this->get(route('login'))->assertInertia(fn (Assert $p) => $p->where('googleHabilitado', false));
    }

    public function test_con_credenciales_ofrece_el_boton_y_manda_a_google(): void
    {
        $this->conCredenciales();

        $this->get(route('login'))->assertInertia(fn (Assert $p) => $p->where('googleHabilitado', true));
        $this->get(route('google.redirect'))->assertRedirectContains('accounts.google.com');
    }

    public function test_crea_la_cuenta_sin_contrasena_y_la_manda_a_aceptar_los_terminos(): void
    {
        $this->conCredenciales();
        $this->respuestaDeGoogle('sub-123', 'ana@example.com');

        $this->get(route('google.callback'))->assertRedirect(route('historial'));

        $usuario = User::firstWhere('email', 'ana@example.com');
        $this->assertNotNull($usuario);
        $this->assertSame('Ana Pérez', $usuario->name);
        $this->assertSame('sub-123', $usuario->google_id);
        $this->assertSame('https://lh3.googleusercontent.com/a/foto', $usuario->avatar);
        $this->assertNull($usuario->password);
        $this->assertTrue($usuario->hasVerifiedEmail());
        $this->assertAuthenticatedAs($usuario);

        // El alta con Google no pasa por la casilla: se le piden en el primer pedido.
        $this->get(route('historial'))->assertRedirect(route('terminos.aceptar'));
    }

    public function test_vincula_la_cuenta_existente_por_email_y_le_conserva_la_contrasena(): void
    {
        $this->conCredenciales();
        $existente = User::factory()->unverified()->create(['email' => 'ana@example.com', 'password' => 'clave-de-antes']);
        $this->respuestaDeGoogle('sub-123', 'ana@example.com');

        $this->get(route('google.callback'))->assertRedirect(route('historial'));

        $this->assertSame(1, User::count());
        $existente->refresh();
        $this->assertSame('sub-123', $existente->google_id);
        $this->assertTrue($existente->hasVerifiedEmail());
        $this->assertTrue(Hash::check('clave-de-antes', $existente->password));
    }

    public function test_reconoce_por_el_sub_aunque_cambie_el_email(): void
    {
        $this->conCredenciales();
        $existente = User::factory()->create(['email' => 'viejo@example.com']);
        $existente->forceFill(['google_id' => 'sub-123'])->save();
        $this->respuestaDeGoogle('sub-123', 'nuevo@example.com');

        $this->get(route('google.callback'));

        $this->assertSame(1, User::count());
        $this->assertSame('nuevo@example.com', $existente->fresh()?->email);
    }

    public function test_rechaza_un_email_que_google_no_verifico(): void
    {
        $this->conCredenciales();
        $this->respuestaDeGoogle('sub-123', 'ana@example.com', verificado: false);

        $this->get(route('google.callback'))
            ->assertRedirect(route('login'))
            ->assertSessionHas('error');

        $this->assertSame(0, User::count());
        $this->assertGuest();
    }

    public function test_cancelar_en_google_vuelve_al_login_sin_error(): void
    {
        $this->conCredenciales();

        $this->get(route('google.callback', ['error' => 'access_denied']))
            ->assertRedirect(route('login'))
            ->assertSessionMissing('error');
    }

    public function test_no_muestra_el_detalle_del_error_de_socialite(): void
    {
        $this->conCredenciales();
        Socialite::shouldReceive('driver')->with('google')->andReturn(
            Mockery::mock()->shouldReceive('user')
                ->andThrow(new RuntimeException('client_secret invalido: GOCSPX-secreto'))
                ->getMock(),
        );

        $respuesta = $this->get(route('google.callback'))->assertRedirect(route('login'));

        $this->assertStringNotContainsString('GOCSPX', (string) $respuesta->getSession()?->get('error'));
    }

    public function test_una_cuenta_sin_contrasena_no_entra_por_email(): void
    {
        $usuario = User::factory()->create(['email' => 'ana@example.com']);
        $usuario->forceFill(['password' => null])->save();

        foreach (['', 'la-que-sea'] as $intento) {
            $this->post(route('login.store'), ['email' => 'ana@example.com', 'password' => $intento]);
            $this->assertGuest();
        }
    }

    public function test_sin_contrasena_ve_seguridad_y_define_una_sin_pedir_la_anterior(): void
    {
        $usuario = User::factory()->create();
        $usuario->forceFill(['password' => null, 'google_id' => 'sub-123'])->save();

        $this->actingAs($usuario)
            ->get(route('security.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p->where('tieneContrasena', false));

        $this->put(route('user-password.update'), [
            'password' => 'Clave-Nueva-2026',
            'password_confirmation' => 'Clave-Nueva-2026',
        ])->assertSessionHasNoErrors();

        $this->assertTrue(Hash::check('Clave-Nueva-2026', (string) $usuario->fresh()?->password));
    }

    public function test_con_contrasena_se_sigue_pidiendo_la_actual_y_la_confirmacion(): void
    {
        $usuario = User::factory()->create(['password' => 'clave-de-antes']);

        $this->actingAs($usuario)->get(route('security.edit'))->assertRedirect(route('password.confirm'));

        $this->put(route('user-password.update'), [
            'password' => 'Clave-Nueva-2026',
            'password_confirmation' => 'Clave-Nueva-2026',
        ])->assertSessionHasErrors('current_password');
    }

    public function test_sin_contrasena_puede_eliminar_la_cuenta(): void
    {
        $usuario = User::factory()->create();
        $usuario->forceFill(['password' => null, 'google_id' => 'sub-123'])->save();

        $this->actingAs($usuario)->delete(route('profile.destroy'))->assertRedirect('/');

        $this->assertNull(User::find($usuario->id));
    }
}
