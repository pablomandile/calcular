<?php

namespace App\Console\Commands;

use App\Enums\SerieIndice;
use App\Services\Indices\FuenteDeIndiceException;
use App\Services\Indices\SincronizadorDeIndices;
use Illuminate\Console\Command;

class ActualizarIndices extends Command
{
    protected $signature = 'indices:actualizar
        {series?* : ipc, cer o uva (por defecto, las tres)}
        {--completo : Vuelve a traer toda la historia}';

    protected $description = 'Trae el IPC del INDEC y el CER y la UVA del BCRA y los guarda';

    public function handle(SincronizadorDeIndices $sincronizador): int
    {
        /** @var list<string> $pedidas */
        $pedidas = $this->argument('series');
        $series = $pedidas === []
            ? SerieIndice::cases()
            : array_map(fn (string $s) => SerieIndice::from(strtolower($s)), $pedidas);

        $todoBien = true;

        foreach ($series as $serie) {
            try {
                $r = $sincronizador->sincronizar($serie, (bool) $this->option('completo'));
                $this->info("{$serie->nombre()}: {$r['recibidos']} recibidos, {$r['nuevos']} nuevos, último {$r['ultima']}.");
            } catch (FuenteDeIndiceException $e) {
                $this->warn($e->getMessage());
                $todoBien = false;
            }
        }

        return $todoBien ? self::SUCCESS : self::FAILURE;
    }
}
