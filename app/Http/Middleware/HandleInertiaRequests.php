<?php

namespace App\Http\Middleware;

use App\Enums\TamanioTexto;
use App\Services\IngresoConGoogleService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Inertia\Middleware;
use Inertia\Support\Header;
use Symfony\Component\HttpFoundation\Response;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * La misma URL contesta HTML o JSON según X-Inertia, y el CDN de Hostinger
     * borra el Vary que las distingue (con brotli lo saca entero). Sin esto,
     * una pestaña restaurada muestra el JSON crudo en vez de la página.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = parent::handle($request, $next);

        // Se declara igual: sirve en cualquier intermediario que lo respete.
        $response->headers->set('Vary', Header::INERTIA.', Accept-Encoding');

        /*
         * `no-store` y no `no-cache`: `no-cache` deja guardar y una navegación
         * de historial saltea la revalidación. Y solo en la respuesta JSON,
         * nunca en el HTML: `no-store` en el documento apaga el bfcache.
         */
        if ($request->header(Header::INERTIA)) {
            $response->headers->set('Cache-Control', 'no-store, private');
        }

        return $response;
    }

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                // Las cuentas de Google no tienen contraseña: cambia lo que
                // piden "borrar cuenta" y "seguridad".
                'tieneContrasena' => $request->user()?->tieneContrasena() ?? false,
            ],
            'googleHabilitado' => IngresoConGoogleService::configurado(),
            'tamanioTexto' => fn () => View::shared('tamanioTexto', TamanioTexto::porDefecto())->value,
            'tamaniosTexto' => fn () => TamanioTexto::opciones(),
        ];
    }
}
