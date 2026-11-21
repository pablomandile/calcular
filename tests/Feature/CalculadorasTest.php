<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class CalculadorasTest extends TestCase
{
    /**
     * Cada calculadora se usa sin cuenta: tiene que abrir para un invitado.
     *
     * @return array<string, array{string, string}>
     */
    public static function paginasPublicas(): array
    {
        return [
            'inicio' => ['/', 'Inicio'],
            'calculadora' => ['/calculadora', 'Calculadora'],
            'cientifica' => ['/cientifica', 'Cientifica'],
            'porcentajes' => ['/porcentajes', 'porcentajes/Index'],
            'historial' => ['/historial', 'Historial'],
            'finanzas' => ['/finanzas', 'finanzas/Index'],
            'tna-tea' => ['/finanzas/tna-tea', 'finanzas/TnaTea'],
            'plazo-fijo' => ['/finanzas/plazo-fijo', 'finanzas/PlazoFijo'],
            'interes-compuesto' => ['/finanzas/interes-compuesto', 'finanzas/InteresCompuesto'],
            'fechas' => ['/fechas', 'fechas/Index'],
            'dias-entre-fechas' => ['/fechas/dias-entre-fechas', 'fechas/DiasEntreFechas'],
            'dias-habiles' => ['/fechas/dias-habiles', 'fechas/DiasHabiles'],
            'sumar-restar' => ['/fechas/sumar-restar', 'fechas/SumarRestar'],
            'edad' => ['/fechas/edad', 'fechas/Edad'],
        ];
    }

    #[DataProvider('paginasPublicas')]
    public function test_la_pagina_abre_sin_cuenta(string $url, string $componente): void
    {
        $this->get($url)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component($componente));
    }
}
