<?php

namespace App\Services\Indices;

use App\Enums\SerieIndice;
use Carbon\CarbonInterface;
use Composer\CaBundle\CaBundle;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Http;

/**
 * Habla con las APIs oficiales y devuelve los valores normalizados:
 * `[['fecha' => 'AAAA-MM-DD', 'valor' => '123.45678'], ...]`, de la fecha más
 * vieja a la más nueva. No guarda nada (eso es SincronizadorDeIndices).
 */
class FuentesDeIndices
{
    /** Tope de filas por consulta de la API del BCRA. */
    private const LIMITE_BCRA = 1000;

    /**
     * @return list<array{fecha: string, valor: string}>
     *
     * @throws FuenteDeIndiceException
     */
    public function traer(SerieIndice $serie, ?CarbonInterface $desde = null): array
    {
        return $serie === SerieIndice::Ipc
            ? $this->ipc($desde)
            : $this->bcra($serie, $desde);
    }

    /**
     * Responde `{"data": [["2026-10-01", 12785.93], ...]}`. El valor puede
     * venir null en un mes todavía sin publicar.
     *
     * @return list<array{fecha: string, valor: string}>
     */
    private function ipc(?CarbonInterface $desde): array
    {
        $respuesta = $this->pedir(SerieIndice::Ipc, (string) config('indices.ipc.url'), [
            'ids' => config('indices.ipc.serie'),
            'format' => 'json',
            'sort' => 'asc',
            'limit' => 1000,
            'start_date' => $desde?->copy()->startOfMonth()->toDateString(),
        ]);

        $datos = $respuesta['data'] ?? null;

        if (! is_array($datos)) {
            throw FuenteDeIndiceException::respuestaInesperada(SerieIndice::Ipc);
        }

        $valores = [];

        foreach ($datos as $par) {
            if (is_array($par) && is_string($par[0] ?? null) && is_numeric($par[1] ?? null)) {
                $valores[] = [
                    'fecha' => Date::parse($par[0])->startOfMonth()->toDateString(),
                    'valor' => $this->comoDecimal($par[1]),
                ];
            }
        }

        return $valores;
    }

    /**
     * Responde `{"metadata": {"resultset": {"count": N}}, "results": [{"detalle":
     * [{"fecha", "valor"}]}]}`, de la fecha más nueva a la más vieja y de a 1000.
     *
     * @return list<array{fecha: string, valor: string}>
     */
    private function bcra(SerieIndice $serie, ?CarbonInterface $desde): array
    {
        $variable = config("indices.bcra.variables.{$serie->value}");
        $desde ??= Date::parse((string) config("indices.bcra.desde.{$serie->value}"));
        $url = rtrim((string) config('indices.bcra.url'), '/').'/'.$variable;

        $porFecha = [];
        $offset = 0;

        // La serie completa supera el tope por consulta: se pagina hasta juntar
        // lo que la API dice que hay.
        do {
            $respuesta = $this->pedir($serie, $url, [
                'desde' => $desde->toDateString(),
                'hasta' => today()->toDateString(),
                'limit' => self::LIMITE_BCRA,
                'offset' => $offset,
            ]);

            $detalle = data_get($respuesta, 'results.0.detalle');

            if (! is_array($detalle)) {
                throw FuenteDeIndiceException::respuestaInesperada($serie);
            }

            foreach ($detalle as $fila) {
                if (is_array($fila) && is_string($fila['fecha'] ?? null) && is_numeric($fila['valor'] ?? null)) {
                    $porFecha[$fila['fecha']] = $this->comoDecimal($fila['valor']);
                }
            }

            $total = (int) data_get($respuesta, 'metadata.resultset.count', 0);
            $offset += self::LIMITE_BCRA;
        } while ($detalle !== [] && $offset < $total);

        ksort($porFecha);

        $valores = [];

        foreach ($porFecha as $fecha => $valor) {
            $valores[] = ['fecha' => (string) $fecha, 'valor' => $valor];
        }

        return $valores;
    }

    private function cliente(): PendingRequest
    {
        return Http::timeout((int) config('indices.http.timeout'))
            ->retry((int) config('indices.http.reintentos'), (int) config('indices.http.espera_ms'), throw: false)
            ->acceptJson()
            // Verificación TLS siempre activa, contra un bundle propio.
            ->withOptions(['verify' => config('indices.http.ca_bundle') ?: CaBundle::getBundledCaBundlePath()]);
    }

    /**
     * @param  array<string, scalar|null>  $parametros
     * @return array<mixed>
     */
    private function pedir(SerieIndice $serie, string $url, array $parametros): array
    {
        try {
            $respuesta = $this->cliente()->get($url, array_filter($parametros, fn ($v) => $v !== null && $v !== ''));
        } catch (ConnectionException $e) {
            throw FuenteDeIndiceException::noRespondio($serie, $e->getMessage(), $e);
        }

        if ($respuesta->failed()) {
            throw FuenteDeIndiceException::noRespondio($serie, "HTTP {$respuesta->status()}");
        }

        $json = $respuesta->json();

        return is_array($json) ? $json : [];
    }

    /** Sin notación científica: va a una columna decimal. */
    private function comoDecimal(float|int|string $valor): string
    {
        return rtrim(rtrim(number_format((float) $valor, 8, '.', ''), '0'), '.') ?: '0';
    }
}
