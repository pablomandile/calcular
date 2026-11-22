<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Feriado nacional o día no laborable ("puente") de Argentina.
 *
 * @property int $id
 * @property Carbon $fecha
 * @property string $nombre
 * @property string $tipo
 */
class Feriado extends Model
{
    protected $table = 'feriados';

    protected $fillable = ['fecha', 'nombre', 'tipo'];

    protected function casts(): array
    {
        return [
            'fecha' => 'date:Y-m-d',
        ];
    }

    /**
     * @param  Builder<Feriado>  $query
     * @return Builder<Feriado>
     */
    public function scopeDelAnio(Builder $query, int $anio): Builder
    {
        return $query->whereYear('fecha', $anio)->orderBy('fecha');
    }
}
