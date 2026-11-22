<?php

use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\FeriadoController;
use App\Http\Controllers\HistorialController;
use App\Http\Controllers\Legales\LegalesController;
use App\Http\Controllers\Settings\DescargaDeDatosController;
use Illuminate\Support\Facades\Route;

/*
| Las calculadoras son públicas: se usan sin cuenta. La cuenta solo sirve
| para sincronizar el historial entre dispositivos.
*/
Route::inertia('/', 'Inicio')->name('home');
Route::inertia('calculadora', 'Calculadora')->name('calculadora');
Route::inertia('cientifica', 'Cientifica')->name('cientifica');
Route::inertia('porcentajes', 'porcentajes/Index')->name('porcentajes');
Route::inertia('historial', 'Historial')->name('historial');

Route::prefix('finanzas')->name('finanzas.')->group(function () {
    Route::inertia('/', 'finanzas/Index')->name('index');
    Route::inertia('tna-tea', 'finanzas/TnaTea')->name('tna-tea');
    Route::inertia('plazo-fijo', 'finanzas/PlazoFijo')->name('plazo-fijo');
    Route::inertia('interes-compuesto', 'finanzas/InteresCompuesto')->name('interes-compuesto');
});

Route::prefix('fechas')->name('fechas.')->group(function () {
    Route::inertia('/', 'fechas/Index')->name('index');
    Route::inertia('dias-entre-fechas', 'fechas/DiasEntreFechas')->name('dias-entre-fechas');
    Route::inertia('dias-habiles', 'fechas/DiasHabiles')->name('dias-habiles');
    Route::inertia('sumar-restar', 'fechas/SumarRestar')->name('sumar-restar');
    Route::inertia('edad', 'fechas/Edad')->name('edad');
});

Route::get('api/feriados/{anio}', [FeriadoController::class, 'index'])
    ->whereNumber('anio')
    ->middleware('throttle:60,1')
    ->name('feriados');

// Textos legales: públicos.
Route::get('terminos', [LegalesController::class, 'terminos'])->name('terminos');
Route::get('privacidad', [LegalesController::class, 'privacidad'])->name('privacidad');

Route::middleware('auth')->group(function () {
    Route::get('terminos/aceptar', [LegalesController::class, 'aceptar'])->name('terminos.aceptar');
    Route::post('terminos/aceptar', [LegalesController::class, 'guardarAceptacion'])->name('terminos.aceptar.store');

    // Historial de la cuenta (el del dispositivo vive en IndexedDB).
    Route::get('api/historial', [HistorialController::class, 'index'])->name('historial.index');
    Route::post('api/historial/sincronizar', [HistorialController::class, 'sincronizar'])
        ->middleware('throttle:60,1')
        ->name('historial.sincronizar');

    // El derecho de acceso: todo en un JSON. Lo promete la política.
    Route::get('settings/mis-datos', DescargaDeDatosController::class)
        ->middleware('throttle:10,60')
        ->name('exportacion.datos');
});

/*
| Ingreso con Google, bajo /auth como las rutas de Fortify. `guest`: con la
| sesión abierta, rehacer el flujo solo puede cambiar la cuenta sin querer.
*/
Route::middleware('guest')->group(function () {
    Route::get('auth/google/redirect', [GoogleController::class, 'redirigir'])->name('google.redirect');
    Route::get('auth/google/callback', [GoogleController::class, 'volver'])->name('google.callback');
});

require __DIR__.'/settings.php';
