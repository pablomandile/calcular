<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // El `sub` de la cuenta de Google. Único y nullable: las cuentas
            // sin Google no chocan entre sí.
            $table->string('google_id')->nullable()->unique()->after('email');
            // Foto de perfil de Google (URL), para el avatar del encabezado.
            $table->string('avatar', 500)->nullable()->after('google_id');

            // Quien entra con Google nunca eligió una contraseña: queda null,
            // no un hash al azar que haría creer que puede entrar por email.
            $table->string('password')->nullable()->change();

            // Constancia de aceptación de términos y privacidad. Null: no
            // aceptó ninguna versión (el middleware AceptoTerminos se la pide).
            $table->string('terminos_version', 20)->nullable();
            $table->timestamp('terminos_aceptados_en')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['google_id']);
            $table->dropColumn(['google_id', 'avatar', 'terminos_version', 'terminos_aceptados_en']);
            $table->string('password')->nullable(false)->change();
        });
    }
};
