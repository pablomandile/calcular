<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Un cálculo del historial de una cuenta.
 *
 * @property string $id uuid generado en el navegador
 * @property int $usuario_id
 * @property string $tipo
 * @property string $titulo
 * @property string $resultado
 * @property array<string, mixed> $entrada
 * @property string|null $nota
 * @property Carbon $creado_en
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Calculo extends Model
{
    use HasUuids;

    protected $table = 'calculos';

    /** Lo que guarda el historial como máximo por cuenta. */
    public const MAXIMO_POR_CUENTA = 5000;

    public const TIPOS = [
        'basica',
        'cientifica',
        'porcentajes',
        'tna-tea',
        'plazo-fijo',
        'interes-compuesto',
        'inflacion-ipc',
        'inflacion-acumulada',
        'actualizar-monto',
        'dias-entre-fechas',
        'dias-habiles',
        'sumar-restar',
        'edad',
    ];

    protected $fillable = ['id', 'tipo', 'titulo', 'resultado', 'entrada', 'nota', 'creado_en'];

    protected function casts(): array
    {
        return [
            'entrada' => 'array',
            'creado_en' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    /**
     * Forma en que lo recibe el navegador (la misma que guarda en IndexedDB).
     *
     * @return array<string, mixed>
     */
    public function paraCliente(): array
    {
        return [
            'id' => $this->id,
            'tipo' => $this->tipo,
            'titulo' => $this->titulo,
            'resultado' => $this->resultado,
            'entrada' => $this->entrada,
            'nota' => $this->nota,
            'creado_en' => $this->creado_en->toIso8601ZuluString('millisecond'),
            'actualizado_en' => $this->updated_at?->toIso8601ZuluString('millisecond'),
        ];
    }
}
