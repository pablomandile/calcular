<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
 * Schedule::call y no Schedule::command: command lanza otro PHP con proc_open, y
 * en el hosting compartido eso falla a las horas en punto (cuando arrancan los
 * cron de todas las apps de la cuenta). Por lo mismo, minutos que no son en
 * punto, en hora de Argentina (el server está en UTC).
 */

// Los feriados trasladables y los puentes se anuncian durante el año.
Schedule::call(fn () => Artisan::call('feriados:actualizar'))
    ->name('feriados:actualizar')
    ->weeklyOn(1, '06:13')
    ->timezone('America/Argentina/Buenos_Aires')
    ->withoutOverlapping();

// CER y UVA cambian todos los días; el IPC, a mediados de cada mes.
Schedule::call(fn () => Artisan::call('indices:actualizar'))
    ->name('indices:actualizar')
    ->dailyAt('07:17')
    ->timezone('America/Argentina/Buenos_Aires')
    ->withoutOverlapping();
