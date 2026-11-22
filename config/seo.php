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
        'descripcion' => 'Calculadora, científica, TNA y TEA, plazo fijo, interés compuesto, porcentajes, inflación por IPC y días hábiles con feriados argentinos. Gratis y sin cuenta.',
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
        'descripcion' => 'TNA y TEA, plazo fijo, interés compuesto, interés en cuotas, contado o cuotas, descuentos con tope y porcentajes, con las fórmulas explicadas.',
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
    'finanzas.interes-en-cuotas' => [
        'titulo' => 'Calculadora de interés en cuotas',
        'descripcion' => 'Descubrí la tasa que pagás de verdad en una compra en cuotas fijas: tasa mensual, TNA, TEA y recargo, con la primera cuota en el momento o a 30 días.',
    ],
    'finanzas.contado-vs-cuotas' => [
        'titulo' => 'Contado o cuotas: qué conviene',
        'descripcion' => 'Compará el precio de contado con un plan en cuotas según lo que rinde tu plata y la inflación esperada: valor presente, tasa del plan y ahorro.',
    ],
    'finanzas.descuento-con-tope' => [
        'titulo' => 'Calculadora de descuento con tope',
        'descripcion' => 'Cuánto podés gastar para aprovechar entero un descuento o reintegro con tope, cuánto te devuelven y qué descuento real te queda si te pasás.',
    ],
    'inflacion.index' => [
        'titulo' => 'Calculadoras de inflación',
        'descripcion' => 'Inflación acumulada, actualizar un monto por IPC del INDEC, la serie de inflación mensual e interanual, y los índices CER y UVA del BCRA.',
    ],
    'inflacion.acumulada' => [
        'titulo' => 'Calculadora de inflación acumulada',
        'descripcion' => 'Cuánto suma una inflación mensual constante en varios meses, y cuánto vale un monto al final. Con la fórmula explicada.',
    ],
    'inflacion.actualizar-monto' => [
        'titulo' => 'Actualizar un monto por inflación',
        'descripcion' => 'Llevá un monto a valores de hoy con el porcentaje de inflación del período, y mirá cuánto poder de compra se perdió.',
    ],
    'inflacion.ipc' => [
        'titulo' => 'Calculadora de inflación por IPC (INDEC)',
        'descripcion' => 'Actualizá un monto entre dos meses con el IPC Nacional del INDEC: coeficiente, inflación del período y monto equivalente.',
    ],
    'inflacion.serie-mensual' => [
        'titulo' => 'Inflación mensual e interanual en Argentina',
        'descripcion' => 'La serie del IPC del INDEC mes a mes: inflación mensual, interanual y acumulada del período, con gráfico y descarga en CSV.',
    ],
    'inflacion.cer' => [
        'titulo' => 'Índice CER: valores diarios',
        'descripcion' => 'La serie diaria del CER del BCRA, con su variación en el período que elijas, gráfico y descarga en CSV.',
    ],
    'inflacion.uva' => [
        'titulo' => 'Valor de la UVA hoy y su historia',
        'descripcion' => 'La serie diaria de la UVA del BCRA, con su variación en el período que elijas, gráfico y descarga en CSV.',
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
