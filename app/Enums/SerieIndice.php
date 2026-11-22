<?php

namespace App\Enums;

/**
 * Series oficiales que se guardan en la tabla `indices`.
 *
 * Se guarda siempre el número índice, nunca el porcentaje: dividir dos índices
 * da el coeficiente exacto de todo el período, mientras que encadenar
 * porcentajes redondeados acumula error.
 */
enum SerieIndice: string
{
    /** IPC Nacional del INDEC, nivel general, base diciembre 2016 = 100. Mensual. */
    case Ipc = 'ipc';

    /** Coeficiente de Estabilización de Referencia del BCRA, base 2/2/2002 = 1. Diario. */
    case Cer = 'cer';

    /** Unidad de Valor Adquisitivo del BCRA, $14,05 el 31/3/2016. Diaria. */
    case Uva = 'uva';

    public function nombre(): string
    {
        return match ($this) {
            self::Ipc => 'IPC Nacional (INDEC)',
            self::Cer => 'CER (BCRA)',
            self::Uva => 'UVA (BCRA)',
        };
    }

    /** El IPC tiene un valor por mes (con fecha el día 1); CER y UVA, uno por día. */
    public function esMensual(): bool
    {
        return $this === self::Ipc;
    }
}
