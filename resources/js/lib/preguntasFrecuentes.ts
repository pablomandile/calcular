/**
 * Preguntas frecuentes. Cada bloque de la respuesta es un párrafo (texto) o
 * una lista (arreglo de textos).
 *
 * Los ejemplos con fechas están atados al código en preguntasFrecuentes.test.ts:
 * si cambia una regla de cálculo, el test obliga a corregir el texto.
 */
export type PreguntaFrecuente = {
    pregunta: string;
    respuesta: (string | string[])[];
};

export const preguntasFechas: PreguntaFrecuente[] = [
    {
        pregunta: '¿Las fechas tienen hora o zona horaria?',
        respuesta: [
            'No. Se trabaja con días de calendario completos, sin hora. Por eso ni un cambio de horario ni la zona horaria de tu dispositivo corren el resultado un día para adelante o para atrás.',
        ],
    },
    {
        pregunta: '¿Tiene en cuenta los años bisiestos?',
        respuesta: [
            'Sí: usa el calendario real, con el 29 de febrero de los años bisiestos. Del 1/2/2028 al 1/3/2028 hay 29 días; del 1/2/2027 al 1/3/2027, 28.',
        ],
    },
    {
        pregunta: '¿Un mes son 30 días?',
        respuesta: [
            'No. Los meses y los años son de calendario: del 15/1 al 15/2 hay un mes, aunque enero tenga 31 días, y del 15/2 al 15/3 también, aunque febrero tenga 28. Lo que no llega a completar un mes se muestra como días.',
        ],
    },
    {
        pregunta: '¿Se cuentan el primer y el último día?',
        respuesta: [
            'Depende de la calculadora:',
            [
                'Días entre fechas: no cuenta el último día (del lunes al martes hay 1 día). Si lo querés contar, marcá la casilla.',
                'Días hábiles entre dos fechas: cuenta las dos puntas.',
                'Sumar o restar días hábiles: el día de partida no cuenta. Un viernes más 1 hábil es el lunes, si no es feriado.',
            ],
        ],
    },
    {
        pregunta: '¿Qué pasa si le sumo un mes a un 31?',
        respuesta: [
            'Si el mes de destino no tiene ese día, se usa el último día del mes y la calculadora te lo avisa. El 31/1/2026 más un mes da 28/2/2026; en 2028, que es bisiesto, da 29/2/2028.',
            'Con los años pasa lo mismo: el 29/2/2024 más un año da 28/2/2025.',
        ],
    },
    {
        pregunta: '¿Puedo cargar las fechas en cualquier orden?',
        respuesta: [
            'En días entre fechas y al contar días hábiles, sí: si la fecha final es anterior a la inicial, se dan vuelta (en días entre fechas, con un aviso). En la calculadora de edad, la fecha de referencia no puede ser anterior al nacimiento.',
        ],
    },
    {
        pregunta: '¿Qué feriados usa la calculadora de días hábiles?',
        respuesta: [
            'Los feriados nacionales (inamovibles y trasladables), los días no laborables y los puentes turísticos del calendario oficial. Se toman de ArgentinaDatos y se actualizan todas las semanas, así que un feriado recién anunciado puede tardar unos días en aparecer.',
            'No incluye feriados provinciales ni municipales, ni asuetos. Si para algún año todavía no hay calendario publicado, la calculadora te avisa.',
        ],
    },
    {
        pregunta: '¿Qué diferencia hay entre un feriado y un día no laborable?',
        respuesta: [
            'El feriado es de descanso obligatorio. En los días no laborables y en los puentes turísticos, en el sector privado decide cada empleador, y muchos comercios y empresas trabajan.',
            'Por eso, por defecto no cuentan como hábiles, pero hay una casilla para contarlos.',
        ],
    },
    {
        pregunta: '¿Cuándo cumple años quien nació un 29 de febrero?',
        respuesta: [
            'En los años que no son bisiestos, la calculadora de edad toma el 28 de febrero como día del cumpleaños.',
        ],
    },
    {
        pregunta: '¿Funciona sin conexión?',
        respuesta: [
            'Sí. Si ya abriste CalculAR alguna vez en ese navegador (o la instalaste como app), las cuatro calculadoras de fechas andan sin internet.',
            'Para los días hábiles hacen falta los feriados de cada año: los de los años que ya consultaste quedan guardados en tu dispositivo.',
        ],
    },
];

export const preguntasInflacion: PreguntaFrecuente[] = [
    {
        pregunta: '¿Por qué no se suma la inflación de cada mes?',
        respuesta: [
            'Porque cada mes los precios suben sobre lo que ya habían subido: los porcentajes se multiplican. Un 2 % y un 3 % dan 5,06 %, no 5 %, y 5 % por mes durante un año da 79,59 %, no 60 %.',
        ],
    },
    {
        pregunta: '¿De dónde salen los datos?',
        respuesta: [
            'El IPC es el Índice de Precios al Consumidor Nacional, nivel general, que publica el INDEC (lo tomamos de la API de Series de Tiempo del Estado). El CER y la UVA son del Banco Central. Se actualizan solos todos los días.',
        ],
    },
    {
        pregunta: '¿Desde cuándo hay datos?',
        respuesta: [
            [
                'IPC: desde diciembre de 2016, cuando empieza la serie oficial actual (base diciembre 2016 = 100).',
                'CER: desde el 2 de febrero de 2002.',
                'UVA: desde el 31 de marzo de 2016.',
            ],
        ],
    },
    {
        pregunta: '¿Cuándo aparece la inflación del último mes?',
        respuesta: [
            'El INDEC publica la inflación de cada mes a mediados del mes siguiente. CalculAR la incorpora dentro de las 24 horas. Si el INDEC corrige un mes anterior, también se actualiza.',
        ],
    },
    {
        pregunta: '¿Qué diferencia hay entre el IPC, el CER y la UVA?',
        respuesta: [
            'El IPC mide cuánto suben los precios cada mes. El CER se arma con el IPC (con unos dos meses de rezago) y lo reparte día a día, para ajustar bonos y préstamos. La UVA es una unidad en pesos que sigue al CER y se usa en créditos hipotecarios y plazos fijos UVA.',
        ],
    },
    {
        pregunta: '¿Sirve para actualizar un alquiler, una deuda o un reclamo?',
        respuesta: [
            'Como referencia, sí. Pero cada contrato o sentencia dice qué índice usar y entre qué fechas (puede ser el ICL, el CER, una tasa o el IPC con otro criterio), así que el resultado oficial puede ser distinto.',
        ],
    },
    {
        pregunta: '¿Funciona sin conexión?',
        respuesta: [
            'Inflación acumulada y actualizar un monto, sí, siempre. Las que usan datos oficiales funcionan con lo último que bajaste en ese dispositivo, y te avisan cuando están usando esa copia.',
        ],
    },
];
