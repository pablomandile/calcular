/**
 * CSV para abrir con Excel o Google Sheets en castellano: separador punto y
 * coma (la coma es el separador decimal) y BOM para que Excel lea UTF-8.
 */
export function armarCsv(encabezados: string[], filas: string[][]): string {
    const linea = (celdas: string[]) =>
        celdas
            .map((c) => (/[;"\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c))
            .join(';');

    return '﻿' + [encabezados, ...filas].map(linea).join('\r\n') + '\r\n';
}

/** Número con coma decimal y sin separador de miles: "1234,5678". */
export function numeroCsv(valor: { toFixed(): string } | null): string {
    return valor === null ? '' : valor.toFixed().replace('.', ',');
}
