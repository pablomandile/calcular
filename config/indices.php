<?php

/*
 * Fuentes de los índices de inflación. Las dos APIs son públicas y no piden
 * autenticación. Mismo esquema que AlquilerFacil.
 */

return [

    'ipc' => [
        // API de Series de Tiempo de datos.gob.ar: número índice mensual del
        // IPC Nacional, nivel general (base diciembre 2016 = 100), del INDEC.
        'url' => env('IPC_API_URL', 'https://apis.datos.gob.ar/series/api/series/'),
        'serie' => env('IPC_SERIE_ID', '148.3_INIVELNAL_DICI_M_26'),
    ],

    'bcra' => [
        // Principales variables del BCRA, v4 (la v3 contesta 410).
        'url' => env('BCRA_API_URL', 'https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/'),
        'variables' => [
            'cer' => 30,
            'uva' => 31,
        ],
        // Primer valor de cada serie: no tiene sentido pedir antes.
        'desde' => [
            'cer' => '2002-02-02',
            'uva' => '2016-03-31',
        ],
    ],

    'http' => [
        'timeout' => 30,
        'reintentos' => 3,
        'espera_ms' => 500,

        /*
         * El BCRA sirve su certificado sin la raíz de la cadena, así que la
         * validación depende del bundle de CA del servidor. En hosting
         * compartido no se controla y puede estar viejo (cURL error 60): se usa
         * el de composer/ca-bundle, que viaja con el proyecto. Se puede apuntar
         * a otro archivo con INDICES_CA_BUNDLE.
         */
        'ca_bundle' => env('INDICES_CA_BUNDLE'),
    ],

];
