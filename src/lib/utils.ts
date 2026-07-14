import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases condicionales (clsx) y resuelve conflictos de utilidades
 * de Tailwind (tailwind-merge). Convención estándar usada por shadcn/ui;
 * la incluimos ya en la base para que los componentes de UI que se
 * construyan en la Fase 2 no tengan que reinventarla.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
