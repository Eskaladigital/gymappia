import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export const GOAL_LABELS: Record<string, string> = {
  perder_grasa: '🔥 Perder grasa',
  ganar_musculo: '💪 Ganar músculo',
  tonificar: '✨ Tonificar',
  mejorar_resistencia: '🏃 Mejorar resistencia',
  rendimiento_deportivo: '🏆 Rendimiento deportivo',
  bienestar_general: '🧘 Bienestar general',
}

export const LEVEL_LABELS: Record<string, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}

export const LOCATION_LABELS: Record<string, string> = {
  casa: '🏠 Casa',
  gimnasio: '🏋️ Gimnasio',
  exterior: '🌿 Exterior',
  mixto: '🔄 Mixto',
}
