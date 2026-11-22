<?php

namespace App\Http\Controllers;

use App\Models\Feriado;
use App\Services\CalendarioFeriados;
use Illuminate\Http\JsonResponse;

class FeriadoController extends Controller
{
    public function index(int $anio, CalendarioFeriados $calendario): JsonResponse
    {
        abort_if($anio < 1900 || $anio > 2200, 404);

        $feriados = $calendario->delAnio($anio)->map(fn (Feriado $f) => [
            'fecha' => $f->fecha->format('Y-m-d'),
            'nombre' => $f->nombre,
            'tipo' => $f->tipo,
        ]);

        return response()
            ->json([
                'anio' => $anio,
                'disponible' => $feriados->isNotEmpty(),
                'feriados' => $feriados->values(),
            ])
            // Cambian poco: un día de caché en el navegador alcanza.
            ->header('Cache-Control', $feriados->isNotEmpty() ? 'public, max-age=86400' : 'no-store');
    }
}
