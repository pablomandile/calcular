<?php

namespace App\Models;

use App\Enums\TamanioTexto;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string|null $google_id
 * @property string|null $avatar Foto de la cuenta de Google
 * @property string|null $password Null en las cuentas que entran con Google
 * @property TamanioTexto $tamanio_texto
 * @property string|null $terminos_version
 * @property Carbon|null $terminos_aceptados_en
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Un usuario recién construido ya trae el tamaño por defecto (sin esto la
     * propiedad queda en null hasta recargarlo de la base).
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'tamanio_texto' => TamanioTexto::PORDEFECTO,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'terminos_aceptados_en' => 'datetime',
            'tamanio_texto' => TamanioTexto::class,
        ];
    }

    /**
     * @return HasMany<Calculo, $this>
     */
    public function calculos(): HasMany
    {
        return $this->hasMany(Calculo::class, 'usuario_id');
    }

    public function tieneContrasena(): bool
    {
        return filled($this->getAuthPassword());
    }

    /**
     * Constancia de que aceptó la versión vigente de los términos y la
     * privacidad. Las columnas no son fillable a propósito: solo las escribe
     * esto (al registrarse o en "aceptar y continuar"), nunca un formulario.
     */
    public function aceptarTerminos(): void
    {
        $this->forceFill([
            'terminos_version' => config('legales.version'),
            'terminos_aceptados_en' => now(),
        ])->save();
    }

    public function aceptoTerminosVigentes(): bool
    {
        return $this->terminos_version !== null
            && $this->terminos_version === config('legales.version');
    }
}
