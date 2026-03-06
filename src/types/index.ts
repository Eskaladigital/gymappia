export type UserRole = 'admin' | 'client'

export type ClientStatus = 'pending' | 'active' | 'inactive'

export type ClientGoal =
  | 'perder_grasa'
  | 'ganar_musculo'
  | 'tonificar'
  | 'mejorar_resistencia'
  | 'rendimiento_deportivo'
  | 'bienestar_general'

export type TrainingLocation = 'casa' | 'gimnasio' | 'exterior' | 'mixto'
export type FitnessLevel = 'principiante' | 'intermedio' | 'avanzado'
export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'

export interface ClientProfile {
  id?: string
  created_at?: string
  user_id?: string          // null hasta que se registra
  status: ClientStatus      // pending | active | inactive

  // Datos personales
  nombre: string
  email: string
  telefono?: string
  edad: number
  peso: number
  altura: number
  sexo: 'hombre' | 'mujer' | 'otro'

  // Salud
  lesiones: string
  enfermedades: string
  medicacion: string

  // Objetivo
  objetivo: ClientGoal
  objetivo_detalle: string
  fecha_objetivo?: string

  // Disponibilidad
  sesiones_semana: number
  minutos_sesion: number
  dias_preferidos: DayOfWeek[]
  horario_preferido: 'mañana' | 'tarde' | 'noche'

  // Entrenamiento
  lugar: TrainingLocation
  equipamiento: string
  nivel: FitnessLevel
  deportes_gusta: string
  deportes_odia: string

  // Estilo de vida
  tipo_trabajo: string
  horas_sueno: number
  nivel_estres: number

  // Motivación
  obstaculos_pasados: string
  seguimiento_preferido: string
}

export interface Exercise {
  nombre: string
  series: number
  repeticiones: string
  descanso_seg: number
  notas?: string
}

export interface WorkoutDay {
  dia: DayOfWeek
  tipo: string
  duracion_min: number
  ejercicios: Exercise[]
  notas?: string
}

export interface WeeklyPlan {
  semana: number
  objetivo_semana: string
  dias: WorkoutDay[]
}

export interface TrainingPlan {
  id?: string
  client_id: string
  created_at?: string
  titulo: string
  descripcion: string
  duracion_semanas: number
  semanas: WeeklyPlan[]
  recomendaciones_nutricionales?: string
  notas_entrenador?: string
  activo?: boolean
}

// Gamificación
export interface UserStats {
  id?: string
  user_id: string
  puntos_totales: number
  racha_actual: number       // días consecutivos entrenados
  racha_maxima: number
  sesiones_completadas: number
  ultimo_entreno?: string
  logros: string[]           // IDs de logros desbloqueados
}

export interface SessionLog {
  id?: string
  client_id: string
  plan_id: string
  fecha: string
  semana: number
  dia_nombre: DayOfWeek
  completado: boolean
  sensacion?: number         // 1-5
  notas_cliente?: string
  puntos_ganados?: number
}

// ─── CONFIGURADOR DE ENTRENAMIENTO ──────────────────────────────────────────

/**
 * Cada «módulo» es una dimensión del entrenamiento que el admin puede
 * subir/bajar con un slider de 0-100.  La suma no tiene por qué ser 100;
 * la IA la interpreta como pesos relativos.
 */
export interface TrainingModule {
  id: string
  label: string          // «Fuerza», «Cardio», etc.
  icon: string
  description: string    // tooltip explicativo
  color: string          // color del slider / badge
  value: number          // 0-100
  locked?: boolean       // el admin puede bloquear un módulo para que la IA no lo toque
}

/** Sub-variables de intensidad y estructura de cada sesión */
export interface SessionParams {
  duracion_media_min: number        // 20-120
  descanso_entre_series_seg: number // 30-180
  rpe_objetivo: number              // 1-10  (Rate of Perceived Exertion)
  semanas_duracion: number          // 1-12
  dias_semana: number               // 1-7
  progresion: 'lineal' | 'ondulada' | 'bloque'  // tipo de periodización
  enfoque_tecnico: number           // 0-100  (0=velocidad, 100=técnica perfecta)
  variedad: number                  // 0-100  (0=ejercicios fijos, 100=mucha variedad)
}

/** Configuración completa que el admin manda a OpenAI para generar el plan */
export interface PlanConfig {
  modules: TrainingModule[]
  session: SessionParams
  pack_id?: string          // si se aplica un pack preconfigurado
  notas_coach?: string      // instrucciones libres del entrenador
}

/**
 * Pack preconfigurado — plantillas que el admin puede guardar y reutilizar.
 * La IA también puede sugerir el pack más adecuado automáticamente.
 */
export interface TrainingPack {
  id?: string
  nombre: string
  descripcion: string
  icono: string
  color: string             // clase tailwind o hex
  tags: string[]            // ["principiante", "mujer", "cardio"...]
  modules: Pick<TrainingModule, 'id' | 'value'>[]
  session: SessionParams
  es_publico?: boolean      // visible para todos los admins
  creado_por?: string       // user_id del admin
  created_at?: string
}

/** Lo que devuelve la IA cuando analiza el perfil y sugiere configuración */
export interface AISuggestion {
  modules: Pick<TrainingModule, 'id' | 'value'>[]
  session: SessionParams
  pack_sugerido_id?: string
  pack_sugerido_nombre?: string
  razonamiento: string      // texto explicativo de por qué esa config
  alertas: string[]         // warnings (ej: «lesión de rodilla → evitar sentadillas profundas»)
}

// Orden canónico de módulos (alfabético por id) — siempre igual para comparar packs/planes
export const MODULE_ORDER = ['cardio', 'core', 'fuerza', 'funcional', 'hiit', 'hipertrofia', 'movilidad', 'potencia'] as const

export function sortModulesByCanonicalOrder<T extends { id: string }>(modules: T[]): T[] {
  return [...modules].sort((a, b) => {
    const ia = MODULE_ORDER.indexOf(a.id as typeof MODULE_ORDER[number])
    const ib = MODULE_ORDER.indexOf(b.id as typeof MODULE_ORDER[number])
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })
}

/** Devuelve los 8 módulos en orden canónico para comparar packs/planes. Los que falten tendrán value: 0. */
export function getCanonicalModulesForDisplay(modules: Pick<TrainingModule, 'id' | 'value'>[]): { id: string; value: number }[] {
  return MODULE_ORDER.map(id => {
    const m = modules.find(x => x.id === id)
    return { id, value: m?.value ?? 0 }
  })
}

// Módulos base del sistema (orden alfabético por id para comparar packs/planes)
export const BASE_MODULES: Omit<TrainingModule, 'value'>[] = [
  { id: 'cardio',       label: 'Cardio',       icon: '🏃', description: 'Trabajo aeróbico continuo o en intervalos para mejorar resistencia cardiovascular', color: '#3b82f6' },
  { id: 'core',         label: 'Core',         icon: '🎯', description: 'Trabajo específico de abdomen, lumbar y estabilizadores profundos', color: '#22c55e' },
  { id: 'fuerza',       label: 'Fuerza',       icon: '🏋️', description: 'Trabajo con peso libre, máquinas o calistenia orientado a ganar fuerza máxima', color: '#ef4444' },
  { id: 'funcional',    label: 'Funcional',    icon: '🔄', description: 'Movimientos multiarticulares que replican patrones de la vida diaria', color: '#06b6d4' },
  { id: 'hiit',         label: 'HIIT',         icon: '⚡', description: 'Alta intensidad a intervalos — máximo rendimiento en poco tiempo', color: '#eab308' },
  { id: 'hipertrofia',  label: 'Hipertrofia',  icon: '💪', description: 'Volumen e intensidad optimizados para ganar masa muscular', color: '#f97316' },
  { id: 'movilidad',    label: 'Movilidad',    icon: '🧘', description: 'Stretching, yoga y ejercicios de rango de movimiento articular', color: '#8b5cf6' },
  { id: 'potencia',     label: 'Potencia',     icon: '💥', description: 'Trabajo explosivo: saltos, lanzamientos, sprints, levantamientos olímpicos', color: '#ec4899' },
]

// Packs predefinidos del sistema
export const SYSTEM_PACKS: Omit<TrainingPack, 'id' | 'created_at' | 'creado_por'>[] = [
  {
    nombre: 'Principiante Total',
    descripcion: 'Para alguien que nunca ha entrenado. Énfasis en técnica y movilidad.',
    icono: '🌱',
    color: '#22c55e',
    tags: ['principiante', 'todos'],
    es_publico: true,
    modules: [
      { id: 'fuerza', value: 30 }, { id: 'hipertrofia', value: 20 },
      { id: 'cardio', value: 50 }, { id: 'hiit', value: 5 },
      { id: 'movilidad', value: 70 }, { id: 'funcional', value: 60 },
      { id: 'core', value: 50 }, { id: 'potencia', value: 0 },
    ],
    session: { duracion_media_min: 40, descanso_entre_series_seg: 90, rpe_objetivo: 5, semanas_duracion: 4, dias_semana: 3, progresion: 'lineal', enfoque_tecnico: 90, variedad: 40 },
  },
  {
    nombre: 'Pérdida de Grasa',
    descripcion: 'Maximizar el gasto calórico manteniendo músculo.',
    icono: '🔥',
    color: '#ef4444',
    tags: ['perder_grasa', 'intermedio'],
    es_publico: true,
    modules: [
      { id: 'fuerza', value: 50 }, { id: 'hipertrofia', value: 40 },
      { id: 'cardio', value: 70 }, { id: 'hiit', value: 80 },
      { id: 'movilidad', value: 30 }, { id: 'funcional', value: 60 },
      { id: 'core', value: 60 }, { id: 'potencia', value: 30 },
    ],
    session: { duracion_media_min: 50, descanso_entre_series_seg: 45, rpe_objetivo: 7, semanas_duracion: 6, dias_semana: 4, progresion: 'ondulada', enfoque_tecnico: 60, variedad: 70 },
  },
  {
    nombre: 'Ganancia Muscular',
    descripcion: 'Volumen alto, progresión de cargas y nutrición orientada a hipertrofia.',
    icono: '💪',
    color: '#f97316',
    tags: ['ganar_musculo', 'intermedio', 'avanzado'],
    es_publico: true,
    modules: [
      { id: 'fuerza', value: 70 }, { id: 'hipertrofia', value: 90 },
      { id: 'cardio', value: 20 }, { id: 'hiit', value: 10 },
      { id: 'movilidad', value: 40 }, { id: 'funcional', value: 30 },
      { id: 'core', value: 50 }, { id: 'potencia', value: 20 },
    ],
    session: { duracion_media_min: 65, descanso_entre_series_seg: 90, rpe_objetivo: 8, semanas_duracion: 8, dias_semana: 4, progresion: 'lineal', enfoque_tecnico: 70, variedad: 50 },
  },
  {
    nombre: 'Adulto Mayor',
    descripcion: 'Movimiento seguro, equilibrio y fuerza funcional para mayores de 60.',
    icono: '🧓',
    color: '#8b5cf6',
    tags: ['mayor_60', 'todos', 'principiante'],
    es_publico: true,
    modules: [
      { id: 'fuerza', value: 40 }, { id: 'hipertrofia', value: 15 },
      { id: 'cardio', value: 50 }, { id: 'hiit', value: 0 },
      { id: 'movilidad', value: 90 }, { id: 'funcional', value: 80 },
      { id: 'core', value: 60 }, { id: 'potencia', value: 0 },
    ],
    session: { duracion_media_min: 35, descanso_entre_series_seg: 120, rpe_objetivo: 4, semanas_duracion: 4, dias_semana: 3, progresion: 'lineal', enfoque_tecnico: 95, variedad: 30 },
  },
  {
    nombre: 'Embarazada',
    descripcion: 'Entrenamiento prenatal seguro. Sin impacto, sin decúbito supino tardío.',
    icono: '🤰',
    color: '#ec4899',
    tags: ['embarazada', 'todos'],
    es_publico: true,
    modules: [
      { id: 'fuerza', value: 25 }, { id: 'hipertrofia', value: 0 },
      { id: 'cardio', value: 60 }, { id: 'hiit', value: 0 },
      { id: 'movilidad', value: 85 }, { id: 'funcional', value: 50 },
      { id: 'core', value: 45 }, { id: 'potencia', value: 0 },
    ],
    session: { duracion_media_min: 30, descanso_entre_series_seg: 120, rpe_objetivo: 4, semanas_duracion: 4, dias_semana: 3, progresion: 'lineal', enfoque_tecnico: 100, variedad: 30 },
  },
  {
    nombre: 'Atleta de Rendimiento',
    descripcion: 'Fuerza explosiva, potencia y resistencia de alto nivel.',
    icono: '🏆',
    color: '#eab308',
    tags: ['rendimiento', 'avanzado'],
    es_publico: true,
    modules: [
      { id: 'fuerza', value: 85 }, { id: 'hipertrofia', value: 60 },
      { id: 'cardio', value: 60 }, { id: 'hiit', value: 70 },
      { id: 'movilidad', value: 50 }, { id: 'funcional', value: 70 },
      { id: 'core', value: 70 }, { id: 'potencia', value: 90 },
    ],
    session: { duracion_media_min: 75, descanso_entre_series_seg: 60, rpe_objetivo: 9, semanas_duracion: 8, dias_semana: 5, progresion: 'bloque', enfoque_tecnico: 75, variedad: 60 },
  },
  {
    nombre: 'Cardio & Bienestar',
    descripcion: 'Para quien busca moverse, reducir estrés y sentirse bien.',
    icono: '🌈',
    color: '#06b6d4',
    tags: ['bienestar', 'principiante', 'intermedio'],
    es_publico: true,
    modules: [
      { id: 'fuerza', value: 20 }, { id: 'hipertrofia', value: 10 },
      { id: 'cardio', value: 80 }, { id: 'hiit', value: 30 },
      { id: 'movilidad', value: 70 }, { id: 'funcional', value: 50 },
      { id: 'core', value: 40 }, { id: 'potencia', value: 0 },
    ],
    session: { duracion_media_min: 40, descanso_entre_series_seg: 60, rpe_objetivo: 5, semanas_duracion: 4, dias_semana: 3, progresion: 'lineal', enfoque_tecnico: 60, variedad: 80 },
  },
]

export interface Achievement {
  id: string
  nombre: string
  descripcion: string
  icono: string
  puntos: number
  condicion: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'primera_sesion', nombre: 'Primera sesión', descripcion: 'Completaste tu primer entreno', icono: '🎯', puntos: 50, condicion: 'sesiones >= 1' },
  { id: 'racha_7', nombre: 'Semana perfecta', descripcion: '7 días de racha', icono: '🔥', puntos: 100, condicion: 'racha >= 7' },
  { id: 'racha_30', nombre: 'Mes de hierro', descripcion: '30 días de racha', icono: '💎', puntos: 500, condicion: 'racha >= 30' },
  { id: 'sesiones_10', nombre: 'En marcha', descripcion: '10 sesiones completadas', icono: '⚡', puntos: 150, condicion: 'sesiones >= 10' },
  { id: 'sesiones_50', nombre: 'Veterano', descripcion: '50 sesiones completadas', icono: '🏆', puntos: 500, condicion: 'sesiones >= 50' },
  { id: 'semana_completa', nombre: 'Semana completada', descripcion: 'Completa todos los días de una semana', icono: '✅', puntos: 200, condicion: 'semana_100' },
]
