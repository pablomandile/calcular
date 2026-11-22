<?php

namespace App\Models;

use App\Enums\SerieIndice;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Un valor de una serie oficial (IPC, CER o UVA) en una fecha.
 *
 * @property int $id
 * @property SerieIndice $serie
 * @property Carbon $fecha
 * @property string $valor
 */
class Indice extends Model
{
    protected $table = 'indices';

    protected $fillable = ['serie', 'fecha', 'valor'];

    protected function casts(): array
    {
        return [
            'serie' => SerieIndice::class,
            'fecha' => 'date',
            'valor' => 'decimal:8',
        ];
    }

    /** @param  Builder<Indice>  $query */
    public function scopeDe(Builder $query, SerieIndice $serie): void
    {
        $query->where('serie', $serie->value);
    }

    public static function ultimaFecha(SerieIndice $serie): ?Carbon
    {
        $fecha = static::query()->de($serie)->max('fecha');

        return is_string($fecha) ? Carbon::parse($fecha) : null;
    }
}
