<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * El historial de cálculos de las cuentas. El id es el uuid que genera el
 * navegador: subir dos veces el mismo cálculo (al sincronizar) no lo duplica.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calculos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // Eliminar la cuenta borra su historial en el momento.
            $table->foreignId('usuario_id')->constrained('users')->cascadeOnDelete();
            $table->string('tipo', 30);
            $table->string('titulo', 500);
            $table->string('resultado', 200);
            $table->json('entrada');
            $table->string('nota', 200)->nullable();
            // Cuándo se calculó (en el dispositivo), no cuándo llegó acá.
            // Con milisegundos: dos cuentas en el mismo segundo mantienen su orden.
            $table->timestamp('creado_en', 3);
            $table->timestamps();

            $table->index(['usuario_id', 'creado_en']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calculos');
    }
};
