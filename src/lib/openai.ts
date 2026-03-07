import OpenAI from 'openai'
import type { ClientProfile, TrainingPlan, PlanConfig, TrainingModule, SessionParams } from '@/types'
import { BASE_MODULES } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateTrainingPlan(
  profile: ClientProfile,
  config?: PlanConfig
): Promise<TrainingPlan> {

  const modules = config?.modules || BASE_MODULES.map(m => ({ ...m, value: 50 }))
  const session = config?.session || {
    duracion_media_min: profile.minutos_sesion,
    descanso_entre_series_seg: 75,
    rpe_objetivo: profile.nivel === 'principiante' ? 5 : profile.nivel === 'intermedio' ? 7 : 8,
    semanas_duracion: 4,
    dias_semana: profile.sesiones_semana,
    progresion: profile.nivel === 'principiante' ? 'lineal' : profile.nivel === 'intermedio' ? 'ondulada' : 'bloque',
    enfoque_tecnico: profile.nivel === 'principiante' ? 85 : 65,
    variedad: 50,
  } as SessionParams

  const activeModules = modules
    .filter(m => m.value > 0)
    .sort((a, b) => b.value - a.value)
    .map(m => {
      const base = BASE_MODULES.find(bm => bm.id === m.id)
      return `  - ${base?.label || m.id}: ${m.value}% (${base?.description})`
    })
    .join('\n')

  const progressionDesc = {
    lineal: 'Progresión lineal: aumentar carga/volumen cada semana de forma constante',
    ondulada: 'Progresión ondulada: alternar días de alta y baja intensidad dentro de cada semana',
    bloque: 'Periodización por bloques: semanas dedicadas a objetivos específicos (acumulación, intensificación, realización)',
  }[session.progresion]

  // Ejemplos de rotación según número de días
  const rotacionEjemplos: Record<number, string> = {
    2: 'Tren superior / Tren inferior (o Full Body A / Full Body B)',
    3: 'Empuje / Tirón / Piernas  —  o  Full Body A / Full Body B / Full Body C',
    4: 'Tren superior A / Tren inferior A / Tren superior B / Tren inferior B',
    5: 'Pecho-tríceps / Espalda-bíceps / Piernas / Hombros-core / Full body funcional',
    6: 'Push / Pull / Legs repetido 2 veces con variaciones',
  }
  const rotacionSugerida = rotacionEjemplos[session.dias_semana] || 'Distribuir grupos musculares de forma equilibrada'

  const prompt = `
Eres un programador de entrenamiento físico de élite (NSCA-CSCS).
Genera un plan de entrenamiento en JSON siguiendo ESTRICTAMENTE las reglas de calidad profesional.

━━━ PERFIL ━━━
- Nombre: ${profile.nombre} | Sexo: ${profile.sexo} | Edad: ${profile.edad} años
- Peso: ${profile.peso}kg | Altura: ${profile.altura}cm | Nivel: ${profile.nivel}
- Objetivo: ${profile.objetivo} — ${profile.objetivo_detalle}
- Lesiones/limitaciones: ${profile.lesiones || 'Ninguna'}
- Enfermedades: ${profile.enfermedades || 'Ninguna'}
- Lugar: ${profile.lugar} | Equipamiento: ${profile.equipamiento || 'peso corporal y mancuernas'}
- Le gusta: ${profile.deportes_gusta || 'sin preferencia'} | Evitar: ${profile.deportes_odia || 'nada'}
- Sueño: ${profile.horas_sueno}h | Estrés: ${profile.nivel_estres}/10

━━━ MÓDULOS ACTIVOS (peso relativo) ━━━
${activeModules}

━━━ PARÁMETROS DE SESIÓN ━━━
- Duración media: ${session.duracion_media_min} min
- Descanso entre series: ${session.descanso_entre_series_seg}s
- RPE objetivo: ${session.rpe_objetivo}/10
- Días/semana: ${session.dias_semana}
- Semanas totales: ${session.semanas_duracion}
- Progresión: ${progressionDesc}
- Enfoque técnico: ${session.enfoque_tecnico}/100
- Variedad: ${session.variedad}/100
${config?.notas_coach ? `\n━━━ INSTRUCCIONES DEL ENTRENADOR ━━━\n${config.notas_coach}` : ''}

━━━ REGLAS OBLIGATORIAS DE CALIDAD ━━━

**VARIEDAD DE EJERCICIOS — MUY IMPORTANTE:**
- NUNCA repitas el mismo ejercicio en dos sesiones de la misma semana
- Entre semanas, rota al menos el 50% de los ejercicios. Si en semana 1 haces sentadilla, en semana 2 haz prensa o split squat
- Usa variantes progresivas: semana 1 = sentadilla goblet, semana 2 = sentadilla con barra, semana 3 = sentadilla búlgara
- Alterna patrones de movimiento dentro de cada grupo muscular: empuje horizontal ↔ empuje vertical, tirón horizontal ↔ tirón vertical, bisagra ↔ dominante rodilla

**ROTACIÓN DE GRUPOS MUSCULARES — ESTRUCTURA SUGERIDA para ${session.dias_semana} días:**
${rotacionSugerida}
- Cada sesión debe tener un enfoque muscular CLARO y DIFERENTE al resto de sesiones de esa semana
- No acumules el mismo grupo muscular en días consecutivos (si entrenas espalda el lunes, no la trabajes el martes)
- Incluye siempre ejercicios multiarticulares como base (sentadilla, peso muerto, press, remo, dominada)

**PROGRESIÓN ENTRE SEMANAS:**
- Semana 1: introducción, aprender patrones, RPE ${Math.max(session.rpe_objetivo - 2, 4)}-${Math.max(session.rpe_objetivo - 1, 5)}
- Semana 2: incrementar volumen o carga, RPE ${session.rpe_objetivo - 1}-${session.rpe_objetivo}
- Semana 3: máxima intensidad del ciclo, RPE ${session.rpe_objetivo}-${Math.min(session.rpe_objetivo + 1, 10)}
- Semana 4: deload o consolidación si hay 4 semanas, reducir volumen 30-40% pero mantener intensidad
- Cambiar el orden de ejercicios entre semanas para estimular de forma diferente

**COHERENCIA:**
- Adaptar absolutamente todo si hay lesiones: ${profile.lesiones || 'ninguna limitación'}
- Respetar el equipamiento disponible: ${profile.equipamiento || 'básico'}
- Los días deben tener nombres descriptivos y DISTINTOS: "Fuerza tren superior A", "HIIT metabólico", "Piernas y glúteos", etc.
- IMPORTANTE: El campo "dia" debe ser exactamente uno de: lunes, martes, miercoles, jueves, viernes, sabado, domingo (sin tildes).
- Cada sesión: mínimo 4 ejercicios, máximo 7. Ajustar al tiempo de ${session.duracion_media_min} min

━━━ FORMATO JSON REQUERIDO ━━━
CRÍTICO: Genera EXACTAMENTE ${session.semanas_duracion} semanas (ni más ni menos) en el array "semanas".
Responde SOLO con JSON válido, sin texto adicional:
{
  "titulo": "string descriptivo del plan completo",
  "descripcion": "2 frases que describan la filosofía del plan",
  "duracion_semanas": ${session.semanas_duracion},
  "recomendaciones_nutricionales": "recomendaciones prácticas adaptadas al objetivo",
  "notas_entrenador": "mensaje motivador y orientativo para el cliente",
  "semanas": [
    {
      "semana": 1,
      "objetivo_semana": "foco específico de esta semana",
      "dias": [
        {
          "dia": "lunes",
          "tipo": "nombre descriptivo del tipo de sesión",
          "duracion_min": ${session.duracion_media_min},
          "notas": "indicaciones específicas para esta sesión",
          "ejercicios": [
            {
              "nombre": "nombre del ejercicio",
              "series": 3,
              "repeticiones": "10-12",
              "descanso_seg": ${session.descanso_entre_series_seg},
              "notas": "clave técnica o indicación"
            }
          ]
        }
      ]
    }
  ]
}
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.85,  // Más alto para más creatividad y variedad
    max_tokens: 16000,  // Suficiente para 4+ semanas con todos los ejercicios
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('OpenAI no devolvió contenido')

  const planData = JSON.parse(content)

  // Validar y ajustar semanas: exactamente las configuradas (nunca más)
  const semanasPedidas = Math.max(1, Math.min(12, session.semanas_duracion ?? 4))
  const semanasGeneradas = planData.semanas?.length ?? 0
  if (semanasGeneradas < semanasPedidas) {
    throw new Error(
      `La IA solo generó ${semanasGeneradas} semana(s) de ${semanasPedidas} requeridas. ` +
      'Por favor, intenta generar de nuevo.'
    )
  }
  // Si la IA generó más de lo pedido, usar SOLO las primeras N semanas (slice(0,undefined)=todo el array!)
  const semanasFinales = (planData.semanas || []).slice(0, semanasPedidas)
  planData.semanas = semanasFinales
  planData.duracion_semanas = semanasPedidas

  // Normalizar días (quitar tildes: miércoles → miercoles) para consistencia
  const DIAS_CANONICOS: Record<string, string> = {
    lunes: 'lunes', martes: 'martes', miercoles: 'miercoles', jueves: 'jueves',
    viernes: 'viernes', sabado: 'sabado', domingo: 'domingo',
  }
  const norm = (d: string) => (d || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const s of planData.semanas || []) {
    for (const d of s.dias || []) {
      if (d.dia) {
        const n = norm(d.dia)
        d.dia = DIAS_CANONICOS[n] ?? n
      }
    }
  }

  return {
    client_id: profile.id || '',
    titulo: planData.titulo,
    descripcion: planData.descripcion,
    duracion_semanas: planData.duracion_semanas,
    semanas: planData.semanas,
    recomendaciones_nutricionales: planData.recomendaciones_nutricionales,
    notas_entrenador: planData.notas_entrenador,
  }
}
