<?php

namespace App\Http\Requests\Settings;

use App\Concerns\PasswordValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileDeleteRequest extends FormRequest
{
    use PasswordValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Sin contraseña no se pide contraseña: con la regla fija, una cuenta
        // de Google no podría eliminarse nunca.
        if (blank($this->user()?->getAuthPassword())) {
            return [];
        }

        return [
            'password' => $this->currentPasswordRules(),
        ];
    }
}
