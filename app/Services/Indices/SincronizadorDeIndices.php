<?php

namespace App\Services\Indices;

use App\Enums\SerieIndice;
use App\Models\Indice;
use Carbon\CarbonInterface;

/**
 * Baja los valores de una serie y los guarda en `indices`.
 */
class SincronizadorDeIndices
{
    /**
     * No se pide solo lo nuevo: el INDEC revisa la serie de vez en cuando, así
     * que se vuelven a traer los últimos períodos para que entren las
     * correcciones.
     */
    private const SOLAPAMIENTO_MESES = 3;

    private const SOLAPAMIENTO_DIAS = 10;

    /** SQLite admite un número limitado de parámetros por consulta. */
    private const LOTE = 500;

    public function __construct(private readonly FuentesDeIndices $fuentes) {}

    /**
     * @return array{recibidos: int, nuevos: int, ultima: ?string}
     *
     * @throws FuenteDeIndiceException
     */
    public function sincronizar(SerieIndice $serie, bool $completo = false): array
    {
        $valores = $this->fuentes->traer($serie, $completo ? null : $this->desdeCuando($serie));

        // Se cuenta antes y después: el retorno de upsert no sirve para esto
        // (MySQL cuenta 2 por cada fila actualizada).
        $antes = Indice::query()->de($serie)->count();
        $ahora = now();

        foreach (array_chunk($valores, self::LOTE) as $lote) {
            Indice::query()->upsert(
                array_map(fn (array $v) => [
                    'serie' => $serie->value,
                    'fecha' => $v['fecha'],
                    'valor' => $v['valor'],
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ], $lote),
                ['serie', 'fecha'],
                ['valor', 'updated_at'],
            );
        }

        return [
            'recibidos' => count($valores),
            'nuevos' => Indice::query()->de($serie)->count() - $antes,
            'ultima' => Indice::ultimaFecha($serie)?->toDateString(),
        ];
    }

    /** Desde qué fecha pedir. Null (toda la historia) si todavía no hay nada. */
    private function desdeCuando(SerieIndice $serie): ?CarbonInterface
    {
        $ultima = Indice::ultimaFecha($serie);

        if ($ultima === null) {
            return null;
        }

        return $serie->esMensual()
            ? $ultima->copy()->subMonths(self::SOLAPAMIENTO_MESES)
            : $ultima->copy()->subDays(self::SOLAPAMIENTO_DIAS);
    }
}
