<?php

namespace App\Console\Commands;

use App\Services\CalendarioFeriados;
use Illuminate\Console\Command;

class ActualizarFeriados extends Command
{
    protected $signature = 'feriados:actualizar {anios?* : Años a actualizar (por defecto, el actual y el siguiente)}';

    protected $description = 'Trae los feriados de Argentina desde ArgentinaDatos y los guarda';

    public function handle(CalendarioFeriados $calendario): int
    {
        /** @var list<string> $pedidos */
        $pedidos = $this->argument('anios');
        $anios = $pedidos !== []
            ? array_map('intval', $pedidos)
            : [(int) now()->year, (int) now()->year + 1];

        $todoBien = true;

        foreach ($anios as $anio) {
            $r = $calendario->actualizar($anio);

            if ($r['fuente'] === 'ninguna') {
                $this->warn("{$anio}: sin datos (la API no respondió y no hay respaldo).");
                $todoBien = false;

                continue;
            }

            $this->info("{$anio}: {$r['cantidad']} feriados (fuente: {$r['fuente']}).");
        }

        return $todoBien ? self::SUCCESS : self::FAILURE;
    }
}
