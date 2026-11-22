<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indices', function (Blueprint $table) {
            $table->id();
            $table->string('serie', 10); // App\Enums\SerieIndice

            // IPC: el día 1 del mes. CER y UVA: el día real.
            $table->date('fecha');

            // Número índice, no porcentaje (ver SerieIndice).
            $table->decimal('valor', 20, 8);

            $table->timestamps();

            $table->unique(['serie', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('indices');
    }
};
