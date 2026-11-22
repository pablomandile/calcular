<?php

namespace App\Http\Controllers;

use App\Http\Requests\SincronizarHistorialRequest;
use App\Models\Calculo;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sincronización del historial entre el dispositivo y la cuenta.
 *
 * El navegador manda en un solo lote lo que tiene pendiente (cálculos nuevos
 * o con nota cambiada, los que borró y si vació todo) y recibe el historial
 * completo de la cuenta, que reemplaza su copia local. Así una cola armada
 * sin conexión se resuelve de una vez y el orden no importa:
 *
 *   1. vaciar (si lo pidió): borra lo que había ANTES de este lote;
 *   2. subir: crea los cálculos nuevos y, si el del dispositivo es más
 *      reciente, actualiza la nota (gana la última edición);
 *   3. borrar los que borró en el dispositivo.
 */
class HistorialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return $this->lista($this->usuario($request));
    }

    public function sincronizar(SincronizarHistorialRequest $request): JsonResponse
    {
        $usuario = $this->usuario($request);
        /** @var list<array<string, mixed>> $calculos */
        $calculos = $request->validated('calculos', []);
        /** @var list<string> $borrados */
        $borrados = $request->validated('borrados', []);

        DB::transaction(function () use ($request, $usuario, $calculos, $borrados) {
            if ($request->boolean('vaciar')) {
                $usuario->calculos()->delete();
            }

            $this->subir($usuario, $calculos);

            if ($borrados !== []) {
                $usuario->calculos()->whereIn('id', $borrados)->delete();
            }

            $this->recortar($usuario);
        });

        return $this->lista($usuario);
    }

    /**
     * @param  list<array<string, mixed>>  $calculos
     */
    private function subir(User $usuario, array $calculos): void
    {
        if ($calculos === []) {
            return;
        }

        $existentes = Calculo::query()
            ->whereIn('id', array_column($calculos, 'id'))
            ->get()
            ->keyBy('id');

        foreach ($calculos as $c) {
            $existente = $existentes->get($c['id']);

            if ($existente === null) {
                $nuevo = new Calculo([
                    'id' => $c['id'],
                    'tipo' => $c['tipo'],
                    'titulo' => $c['titulo'],
                    'resultado' => $c['resultado'],
                    'entrada' => $c['entrada'],
                    'nota' => $c['nota'] ?? null,
                    'creado_en' => Carbon::parse($c['creado_en']),
                ]);
                $nuevo->usuario_id = $usuario->id;
                $nuevo->save();

                continue;
            }

            // Un uuid de otra cuenta no se toca (ni se revela que existe).
            if ($existente->usuario_id !== $usuario->id) {
                continue;
            }

            $editadoEn = isset($c['actualizado_en']) ? Carbon::parse($c['actualizado_en']) : null;

            if ($editadoEn !== null && ($existente->updated_at === null || $editadoEn->gt($existente->updated_at))) {
                $existente->nota = $c['nota'] ?? null;
                $existente->updated_at = $editadoEn;
                $existente->save();
            }
        }
    }

    /** Se queda con los más recientes si se pasa del máximo. */
    private function recortar(User $usuario): void
    {
        $limite = $usuario->calculos()
            ->orderByDesc('creado_en')
            ->skip(Calculo::MAXIMO_POR_CUENTA)
            ->value('creado_en');

        if ($limite !== null) {
            $usuario->calculos()->where('creado_en', '<=', $limite)->delete();
        }
    }

    private function lista(User $usuario): JsonResponse
    {
        $calculos = $usuario->calculos()
            ->orderByDesc('creado_en')
            ->limit(Calculo::MAXIMO_POR_CUENTA)
            ->get()
            ->map(fn (Calculo $c) => $c->paraCliente());

        return response()
            ->json(['calculos' => $calculos->values()])
            ->header('Cache-Control', 'no-store');
    }

    private function usuario(Request $request): User
    {
        $usuario = $request->user();
        abort_unless($usuario instanceof User, Response::HTTP_UNAUTHORIZED);

        return $usuario;
    }
}
