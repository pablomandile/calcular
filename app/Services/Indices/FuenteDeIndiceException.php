<?php

namespace App\Services\Indices;

use App\Enums\SerieIndice;
use RuntimeException;
use Throwable;

class FuenteDeIndiceException extends RuntimeException
{
    public static function noRespondio(SerieIndice $serie, string $detalle, ?Throwable $previa = null): self
    {
        return new self("La fuente de {$serie->nombre()} no respondió: {$detalle}", 0, $previa);
    }

    public static function respuestaInesperada(SerieIndice $serie): self
    {
        return new self("La fuente de {$serie->nombre()} respondió algo que no se entiende.");
    }
}
