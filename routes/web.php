<?php

use App\Http\Controllers\FeriadoController;
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

require __DIR__.'/settings.php';
