<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Settings\TamanioTextoUpdateRequest;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cookie;

class TamanioTextoController extends Controller
{
    /**
     * Guarda el tamaño de letra: en la cookie (para la próxima carga, con o sin
     * sesión) y, si hay sesión, en la cuenta (para que siga a la persona a
     * otro dispositivo).
     *
     * No pide sesión: CalculAR se usa casi siempre sin cuenta. Contesta 204 y
     * no una visita de Inertia: el cliente ya aplicó el cambio, y recargar la
     * página borraría la cuenta que hay en la calculadora.
     */
    public function update(TamanioTextoUpdateRequest $request): Response
    {
        $tamanio = $request->tamanio();

        $request->user()?->forceFill(['tamanio_texto' => $tamanio])->save();

        return response()->noContent()
            ->withCookie(Cookie::forever('tamanio_texto', $tamanio->value));
    }
}
