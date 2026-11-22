<?php

return [

    /*
     * Versión vigente de los términos y la política de privacidad, juntos.
     *
     * Subirla vuelve a pedir la aceptación a todos en su próxima visita: es lo
     * que hay que hacer cada vez que cambia algo importante de los textos de
     * `resources/legales/`. Un cambio de redacción que no cambia nada no la sube.
     */
    'version' => '2026-11-22',

    // A dónde escribir por privacidad o por los términos.
    'contacto' => env('LEGALES_CONTACTO', env('MAIL_FROM_ADDRESS')),

];
