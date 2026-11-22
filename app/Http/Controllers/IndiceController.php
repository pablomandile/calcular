<?php

namespace App\Http\Controllers;

use App\Enums\SerieIndice;
use App\Models\Indice;
use App\Services\Indices\FuenteDeIndiceException;
use App\Services\Indices\SincronizadorDeIndices;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class IndiceController extends Controller
{
    /**
     * La serie entera, compacta (`[fecha, valor]`): el CER diario desde 2002 son
     * unas 9.000 filas. El navegador la guarda para usarla sin conexión.
     */
    public function show(string $serie, SincronizadorDeIndices $sincronizador): JsonResponse
    {
        $serie = SerieIndice::tryFrom($serie) ?? abort(404);

        if (! Indice::query()->de($serie)->exists()) {
            $this->traerPorPrimeraVez($serie, $sincronizador);
        }

        $valores = Indice::query()->de($serie)->orderBy('fecha')->toBase()->get(['fecha', 'valor'])
            ->map(fn (object $f) => [
                substr((string) $f->fecha, 0, 10),
                self::sinCerosDeRelleno((string) $f->valor),
            ]);

        return response()
            ->json([
                'serie' => $serie->value,
                'nombre' => $serie->nombre(),
                'mensual' => $serie->esMensual(),
                'ultimo' => $valores->last()[0] ?? null,
                'valores' => $valores->values(),
            ])
            ->header('Cache-Control', $valores->isNotEmpty() ? 'public, max-age=3600' : 'no-store');
    }

    /**
     * La columna decimal vuelve con ceros de relleno ("101.58590000"), salvo en
     * SQLite, que guarda "100" tal cual: solo se recortan decimales.
     */
    private static function sinCerosDeRelleno(string $valor): string
    {
        return str_contains($valor, '.') ? rtrim(rtrim($valor, '0'), '.') : $valor;
    }

    /**
     * Si el cron todavía no corrió (recién desplegado), se trae acá. Una falla no
     * se reintenta en cada visita: se espera una hora.
     */
    private function traerPorPrimeraVez(SerieIndice $serie, SincronizadorDeIndices $sincronizador): void
    {
        $clave = "indices:sin-datos:{$serie->value}";

        if (Cache::has($clave)) {
            return;
        }

        try {
            $sincronizador->sincronizar($serie);
        } catch (FuenteDeIndiceException $e) {
            Log::warning('No se pudo traer el índice', ['serie' => $serie->value, 'error' => $e->getMessage()]);
            Cache::put($clave, true, now()->addHour());
        }
    }
}
