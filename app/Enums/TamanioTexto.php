<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Tamaño de letra de la app: tres opciones y la del medio por defecto (nadie
 * hereda el tamaño más chico, se elige).
 *
 * Los valores son porcentajes y no píxeles, y eso no es cosmético. Un
 * `font-size: 20px` en la raíz **pisa** el tamaño que la persona ya configuró en
 * su navegador — que es justo lo que alguien con poca vista probablemente ya
 * tocó. Con un porcentaje, las dos preferencias se multiplican en vez de
 * pelearse: quien puso el navegador en 120% y acá elige "Muy grande" termina en
 * 150%, que es lo que pidió dos veces.
 *
 * Tailwind mide en `rem`, así que mover la raíz escala la tipografía **y** el
 * espaciado. Lo que **no** escala son los breakpoints (`md:`), porque las media
 * queries se miden en px contra el viewport. Por eso la revisión de desborde es
 * una matriz de anchos por tamaños, y no un chequeo suelto.
 */
enum TamanioTexto: string
{
    /**
     * El valor por defecto, como constante.
     *
     * Duplica a `porDefecto()` porque un inicializador de propiedad —el
     * `$attributes` de User— solo admite expresiones constantes.
     */
    public const string PORDEFECTO = 'normal';

    case Pequeno = 'pequeno';
    case Normal = 'normal';
    case Grande = 'grande';

    /**
     * El que se usa cuando nadie eligió nada.
     */
    public static function porDefecto(): self
    {
        return self::from(self::PORDEFECTO);
    }

    /**
     * Devuelve el caso, o el de por defecto si el valor no es ninguno.
     *
     * Una cookie la escribe el cliente y puede traer cualquier cosa; un valor
     * desconocido tiene que caer en el default y no romper la página.
     */
    public static function desde(?string $valor): self
    {
        return self::tryFrom((string) $valor) ?? self::porDefecto();
    }

    /**
     * Porcentaje que se aplica al `font-size` de `:root`.
     */
    public function porcentaje(): string
    {
        return match ($this) {
            self::Pequeno => '87.5%',
            self::Normal => '100%',
            self::Grande => '112.5%',
        };
    }

    public function etiqueta(): string
    {
        return match ($this) {
            self::Pequeno => 'Pequeña',
            self::Normal => 'Normal',
            self::Grande => 'Grande',
        };
    }

    public function descripcion(): string
    {
        return match ($this) {
            self::Pequeno => 'Entra más en pantalla.',
            self::Normal => 'El tamaño habitual. Es el que viene puesto.',
            self::Grande => 'Más fácil de leer. Entra menos en pantalla.',
        };
    }

    /**
     * El porcentaje como número, para que el cliente pueda calcular escalas.
     *
     * El selector muestra cada opción **a su tamaño real**, y
     * para eso necesita la proporción entre la opción y la que está vigente.
     */
    public function escala(): float
    {
        return (float) rtrim($this->porcentaje(), '%');
    }

    /**
     * Para el selector, en orden de menor a mayor.
     *
     * @return list<array{valor: string, etiqueta: string, descripcion: string, escala: float}>
     */
    public static function opciones(): array
    {
        return array_map(static fn (self $caso): array => [
            'valor' => $caso->value,
            'etiqueta' => $caso->etiqueta(),
            'descripcion' => $caso->descripcion(),
            'escala' => $caso->escala(),
        ], self::cases());
    }
}
