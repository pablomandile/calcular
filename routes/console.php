<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Los feriados trasladables y los puentes se anuncian durante el año.
Schedule::command('feriados:actualizar')->weekly()->mondays()->at('06:00');
