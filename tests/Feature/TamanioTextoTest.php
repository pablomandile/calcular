<?php

namespace Tests\Feature;

use App\Enums\TamanioTexto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TamanioTextoTest extends TestCase
{
    use RefreshDatabase;

    public function test_viene_en_el_tamano_del_medio_no_en_el_chico(): void
    {
        $casos = TamanioTexto::cases();

        $this->assertSame(TamanioTexto::Normal, TamanioTexto::porDefecto());
        $this->assertSame($casos[1], TamanioTexto::porDefecto());
        $this->assertSame('normal', (new User)->tamanio_texto->value);
    }

    public function test_los_tamanos_van_en_porcentaje(): void
    {
        foreach (TamanioTexto::cases() as $caso) {
            $this->assertStringEndsWith('%', $caso->porcentaje());
        }

        // El CSS tiene un selector por caso, con el mismo porcentaje.
        $css = (string) file_get_contents(resource_path('css/app.css'));
        foreach (TamanioTexto::cases() as $caso) {
            $this->assertMatchesRegularExpression(
                "/html\\[data-texto='{$caso->value}'\\]\\s*\\{\\s*font-size:\\s*".preg_quote($caso->porcentaje(), '/').';/',
                $css,
            );
        }
    }

    public function test_el_atributo_sale_en_el_html_sin_javascript(): void
    {
        $this->get('/')->assertOk()->assertSee('data-texto="normal"', false);
    }

    public function test_un_invitado_cambia_la_letra_y_queda_en_la_cookie(): void
    {
        $this->putJson('/tamanio-texto', ['tamanio_texto' => 'grande'])
            ->assertNoContent()
            ->assertPlainCookie('tamanio_texto', 'grande');

        $this->withUnencryptedCookie('tamanio_texto', 'grande')
            ->get('/calculadora')
            ->assertSee('data-texto="grande"', false)
            ->assertInertia(fn (Assert $p) => $p->where('tamanioTexto', 'grande'));
    }

    public function test_con_sesion_se_guarda_en_la_cuenta_y_la_cuenta_manda(): void
    {
        $usuario = User::factory()->create();

        $this->actingAs($usuario)->putJson('/tamanio-texto', ['tamanio_texto' => 'pequeno'])->assertNoContent();
        $this->assertSame(TamanioTexto::Pequeno, $usuario->fresh()?->tamanio_texto);

        // Otro dispositivo, con una cookie distinta: gana la cuenta.
        $this->withUnencryptedCookie('tamanio_texto', 'grande')
            ->get('/')
            ->assertSee('data-texto="pequeno"', false);
    }

    public function test_rechaza_un_tamano_que_no_existe(): void
    {
        $this->putJson('/tamanio-texto', ['tamanio_texto' => 'gigante'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('tamanio_texto');
    }

    public function test_una_cookie_con_basura_cae_al_default(): void
    {
        $this->withUnencryptedCookie('tamanio_texto', '<script>')
            ->get('/')
            ->assertOk()
            ->assertSee('data-texto="normal"', false);
    }

    public function test_se_puede_cambiar_sin_aceptar_los_terminos(): void
    {
        $this->actingAs(User::factory()->sinAceptarTerminos()->create())
            ->putJson('/tamanio-texto', ['tamanio_texto' => 'grande'])
            ->assertNoContent();
    }

    public function test_las_opciones_llegan_con_su_escala(): void
    {
        $this->get('/')->assertInertia(fn (Assert $p) => $p
            ->has('tamaniosTexto', 3)
            ->where('tamaniosTexto.0.valor', 'pequeno')
            ->where('tamaniosTexto.2.escala', 112.5));
    }
}
