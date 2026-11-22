<?php

/*
 * Título y descripción de cada pantalla pública, por nombre de ruta.
 *
 * No hay SSR (Hostinger no tiene Node): el HTML inicial lo arma Blade, y estos
 * textos son lo que leen los buscadores y lo que se ve al compartir un enlace.
 * Después, al navegar, el <Head> de cada página de Vue toma el control.
 */

return [

    'home' => [
        'titulo' => 'CalculAR · Calculadoras para Argentina',
        'descripcion' => 'Calculadora, científica, TNA y TEA, plazo fijo, interés compuesto, porcentajes y días hábiles con feriados argentinos. Gratis y sin cuenta.',
    ],
    'calculadora' => [
        'titulo' => 'Calculadora online con historial',
        'descripcion' => 'Calculadora con memoria, porcentaje y el historial de cada cuenta. Funciona con el teclado y sin conexión.',
    ],
    'cientifica' => [
        'titulo' => 'Calculadora científica online',
        'descripcion' => 'Seno, coseno, tangente, logaritmos, potencias, raíces y factorial, en grados o radianes.',
    ],
    'porcentajes' => [
        'titulo' => 'Calculadora de porcentajes',
        'descripcion' => 'Cuánto es un porcentaje, qué porcentaje es un número de otro, aumentos, descuentos, variación y precio sin IVA.',
    ],
    'finanzas.index' => [
        'titulo' => 'Calculadoras financieras',
        'descripcion' => 'TNA y TEA, plazo fijo, interés compuesto y porcentajes, con las fórmulas explicadas.',
    ],
    'finanzas.tna-tea' => [
        'titulo' => 'Calculadora de TNA a TEA (y TEA a TNA)',
        'descripcion' => 'Convertí la tasa nominal anual en efectiva anual según la capitalización: diaria, mensual, trimestral, semestral o anual.',
    ],
    'finanzas.plazo-fijo' => [
        'titulo' => 'Calculadora de plazo fijo',
        'descripcion' => 'Cuánto te da un plazo fijo en pesos según el capital, la TNA y los días, con la fecha de vencimiento y la TEA si lo renovás.',
    ],
    'finanzas.interes-compuesto' => [
        'titulo' => 'Calculadora de interés compuesto',
        'descripcion' => 'Cómo crece un capital con reinversión y aportes periódicos, año por año y con gráfico.',
    ],
    'fechas.index' => [
        'titulo' => 'Calculadoras de fechas',
        'descripcion' => 'Días entre fechas, días hábiles con feriados de Argentina, sumar o restar días y meses, y edad exacta.',
    ],
    'fechas.dias-entre-fechas' => [
        'titulo' => 'Días entre dos fechas',
        'descripcion' => 'Cuántos días, semanas, meses y años hay entre dos fechas, con años bisiestos.',
    ],
    'fechas.dias-habiles' => [
        'titulo' => 'Calculadora de días hábiles en Argentina',
        'descripcion' => 'Sumá, restá o contá días hábiles con los feriados nacionales y los días no laborables de Argentina.',
    ],
    'fechas.sumar-restar' => [
        'titulo' => 'Sumar o restar días a una fecha',
        'descripcion' => 'Sumá o restá días, semanas, meses o años a una fecha, con el día de la semana.',
    ],
    'fechas.edad' => [
        'titulo' => 'Calculadora de edad exacta',
        'descripcion' => 'Edad exacta en años, meses y días, días vividos y cuánto falta para el próximo cumpleaños.',
    ],
    'historial' => [
        'titulo' => 'Historial de cálculos',
        'descripcion' => 'Todos tus cálculos, de cualquier calculadora, con notas y para reusar.',
    ],
    'terminos' => [
        'titulo' => 'Términos y condiciones',
        'descripcion' => 'Términos y condiciones de uso de CalculAR.',
    ],
    'privacidad' => [
        'titulo' => 'Política de privacidad',
        'descripcion' => 'Qué datos guarda CalculAR, para qué y cómo ejercer tus derechos.',
    ],
    'cookies' => [
        'titulo' => 'Cookies y datos guardados',
        'descripcion' => 'Qué guarda CalculAR en tu navegador y para qué.',
    ],

];
