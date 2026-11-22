<?php

use App\Http\Middleware\AceptoTerminos;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\HandleTamanioTexto;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'tamanio_texto']);

        $middleware->web(append: [
            HandleAppearance::class,
            // Antes de HandleInertiaRequests: comparte el tamaño con la vista.
            HandleTamanioTexto::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            // En todo el grupo web: una ruta nueva nace cubierta. Las exentas
            // están a la vista en AceptoTerminos::EXENTAS.
            AceptoTerminos::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
