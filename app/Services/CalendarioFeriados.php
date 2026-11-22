<?php

namespace App\Services;

use App\Models\Feriado;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Feriados de Argentina por año.
 *
 * Fuente: API pública de ArgentinaDatos. Si no responde, se usa la copia en
 * database/data/feriados-{año}.json (se actualiza a mano una vez por año).
 * Lo que se obtiene queda guardado en la tabla `feriados`.
 */
class CalendarioFeriados
{
    public const URL = 'https://api.argentinadatos.com/v1/feriados/';

    public const TIPOS = ['inamovible', 'trasladable', 'puente'];

    /**
     * Feriados del año: de la base, y si no hay, de la API o del respaldo.
     *
     * @return Collection<int, Feriado>
     */
    public function delAnio(int $anio): Collection
    {
        $guardados = Feriado::query()->delAnio($anio)->get();

        if ($guardados->isNotEmpty()) {
            return $guardados;
        }

        // Un año que no tiene calendario (todavía) no se vuelve a pedir a la
        // API en cada visita: se reintenta cada 12 horas.
        $claveSinDatos = "feriados:sin-datos:{$anio}";

        if (Cache::has($claveSinDatos)) {
            return $guardados;
        }

        if ($this->actualizar($anio)['cantidad'] === 0) {
            Cache::put($claveSinDatos, true, now()->addHours(12));
        }

        return Feriado::query()->delAnio($anio)->get();
    }

    /**
     * Vuelve a traer el año y reemplaza lo guardado. Devuelve cuántos
     * feriados quedaron y de dónde salieron.
     *
     * @return array{cantidad: int, fuente: 'api'|'respaldo'|'ninguna'}
     */
    public function actualizar(int $anio): array
    {
        $fuente = 'api';
        $datos = $this->desdeApi($anio);

        if ($datos === null) {
            $fuente = 'respaldo';
            $datos = $this->desdeRespaldo($anio);
        }

        if ($datos === null || $datos === []) {
            return ['cantidad' => 0, 'fuente' => 'ninguna'];
        }

        DB::transaction(function () use ($anio, $datos) {
            Feriado::query()->whereYear('fecha', $anio)->delete();

            foreach ($datos as $f) {
                Feriado::query()->create($f);
            }
        });

        return ['cantidad' => count($datos), 'fuente' => $fuente];
    }

    /**
     * @return list<array{fecha: string, nombre: string, tipo: string}>|null
     */
    private function desdeApi(int $anio): ?array
    {
        try {
            $respuesta = Http::timeout(10)->acceptJson()->get(self::URL.$anio);

            if (! $respuesta->successful()) {
                return null;
            }

            return $this->normalizar($respuesta->json(), $anio);
        } catch (Throwable $e) {
            Log::warning('No se pudieron traer los feriados', [
                'anio' => $anio,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * @return list<array{fecha: string, nombre: string, tipo: string}>|null
     */
    private function desdeRespaldo(int $anio): ?array
    {
        $archivo = database_path("data/feriados-{$anio}.json");

        if (! is_file($archivo)) {
            return null;
        }

        return $this->normalizar(json_decode((string) file_get_contents($archivo), true), $anio);
    }

    /**
     * Se queda solo con entradas bien formadas del año pedido.
     *
     * @return list<array{fecha: string, nombre: string, tipo: string}>|null
     */
    private function normalizar(mixed $datos, int $anio): ?array
    {
        if (! is_array($datos)) {
            return null;
        }

        $salida = [];

        foreach ($datos as $f) {
            if (! is_array($f)
                || ! is_string($f['fecha'] ?? null)
                || ! preg_match('/^'.$anio.'-\d{2}-\d{2}$/', $f['fecha'])
                || ! is_string($f['nombre'] ?? null)) {
                continue;
            }

            $tipo = is_string($f['tipo'] ?? null) && in_array($f['tipo'], self::TIPOS, true)
                ? $f['tipo']
                : 'inamovible';

            // Un mismo día puede venir dos veces (dos conmemoraciones): se
            // guarda uno, con los dos nombres.
            if (isset($salida[$f['fecha']])) {
                $salida[$f['fecha']]['nombre'] .= ' / '.$f['nombre'];

                continue;
            }

            $salida[$f['fecha']] = [
                'fecha' => $f['fecha'],
                'nombre' => mb_substr($f['nombre'], 0, 255),
                'tipo' => $tipo,
            ];
        }

        return array_values($salida);
    }
}
