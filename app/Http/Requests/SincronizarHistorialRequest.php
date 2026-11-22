<?php

namespace App\Http\Requests;

use App\Models\Calculo;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SincronizarHistorialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'vaciar' => ['sometimes', 'boolean'],
            'borrados' => ['sometimes', 'array', 'max:5000'],
            'borrados.*' => ['uuid'],
            'calculos' => ['sometimes', 'array', 'max:500'],
            'calculos.*.id' => ['required', 'uuid'],
            'calculos.*.tipo' => ['required', Rule::in(Calculo::TIPOS)],
            'calculos.*.titulo' => ['required', 'string', 'max:500'],
            'calculos.*.resultado' => ['required', 'string', 'max:200'],
            'calculos.*.entrada' => ['present', 'array', 'max:20'],
            'calculos.*.nota' => ['nullable', 'string', 'max:200'],
            'calculos.*.creado_en' => ['required', 'date'],
            'calculos.*.actualizado_en' => ['nullable', 'date'],
        ];
    }
}
