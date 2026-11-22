<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Calculo;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * El derecho de acceso: todo lo que la cuenta tiene guardado, en un JSON.
 * Lo promete la política de privacidad; el botón está en Perfil.
 */
class DescargaDeDatosController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $usuario = $request->user();
        abort_unless($usuario instanceof User, 401);

        $datos = [
            'generado_en' => now()->toIso8601String(),
            'cuenta' => [
                'nombre' => $usuario->name,
                'email' => $usuario->email,
                'email_verificado_en' => $usuario->email_verified_at?->toIso8601String(),
                'ingresa_con_google' => $usuario->google_id !== null,
                'creada_en' => $usuario->created_at?->toIso8601String(),
                'terminos_version' => $usuario->terminos_version,
                'terminos_aceptados_en' => $usuario->terminos_aceptados_en?->toIso8601String(),
            ],
            'historial' => $usuario->calculos()
                ->orderByDesc('creado_en')
                ->get()
                ->map(fn (Calculo $c) => $c->paraCliente())
                ->values(),
        ];

        $nombre = 'calcular-mis-datos-'.now()->format('Y-m-d').'.json';

        return response()->streamDownload(
            function () use ($datos) {
                echo json_encode($datos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            },
            $nombre,
            ['Content-Type' => 'application/json; charset=utf-8'],
        );
    }
}
