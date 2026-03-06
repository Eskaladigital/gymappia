import OpenAI from 'openai'
import type { ClientProfile, TrainingPlan, PlanConfig, TrainingModule, SessionParams } from '@/types'
import { BASE_MODULES } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── Generar plan usando configuración del configurador ──────────────────────
export async function generateTrainingPlan(
  profile: ClientProfile,
  config?: PlanConfig
): Promise<TrainingPlan> {

  // Si no hay config, generamos valores por defecto
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

  // Construir descripción de módulos activos (valor > 0)
  const activeModules = modules
    .filter(m => m.value > 0)
    .sort((a, b) => b.value - a.value)
    .map(m => {
      const base = BASE_MODULES.find(bm => bm.id === m.id)
      return `  - ${base?.label || m.id}: ${m.value}% de peso (${base?.description})`
    })
    .join('\n')

  const progressionDesc = {
    lineal: 'Progresión lineal: aumentar carga/volumen cada semana de forma constante',
    ondulada: 'Progresión ondulada: alternar días de alta y baja intensidad dentro de cada semana',
    bloque: 'Periodización por bloques: semanas dedicadas a objetivos específicos (acumulación, intensificación, realización)',
  }[session.progresion]

  const prompt = `
Eres un programador de entrenamiento físico de élite (certificación NSCA-CSCS).
Genera un plan de entrenamiento personalizado en JSON siguiendo ESTRICTAMENTE la configuración dada.

━━━ PERFIL DEL CLIENTE ━━━
- Nombre: ${profile.nombre} | Sexo: ${profile.sexo} | Edad: ${profile.edad} años
- Peso: ${profile.peso}kg | Altura: ${profile.altura}cm | Nivel: ${profile.nivel}
- Objetivo: ${profile.objetivo} — ${profile.objetivo_detalle}
- Lesiones/limitaciones: ${profile.lesiones || 'Ninguna'}
- Enfermedades: ${profile.enfermedades || 'Ninguna'}
- Lugar de entrenamiento: ${profile.lugar}
- Equipamiento: ${profile.equipamiento || 'básico (peso corporal y mancuernas)'}
- Le gusta: ${profile.deportes_gusta || 'sin preferencia'} | Evitar: ${profile.deportes_odia || 'nada'}
- Horas sueño: ${profile.horas_sueno}h | Estrés: ${profile.nivel_estres}/10

━━━ CONFIGURACIÓN DE MÓDULOS (pesos relativos 0-100) ━━━
${activeModules}

━━━ PARÁMETROS DE SESIÓN ━━━
- Duración media por sesión: ${session.duracion_media_min} minutos
- Descanso entre series: ${session.descanso_entre_series_seg} segundos
- RPE objetivo: ${session.rpe_objetivo}/10 (${session.rpe_objetivo <= 5 ? 'baja intensidad' : session.rpe_objetivo <= 7 ? 'intensidad moderada' : 'alta intensidad'})
- Días de entrenamiento: ${session.dias_semana} días/semana
- Semanas de plan: ${session.semanas_duracion} semanas
- Tipo de progresión: ${progressionDesc}
- Enfoque técnico: ${session.enfoque_tecnico}/100 (${session.enfoque_tecnico >= 80 ? 'priorizar técnica perfecta sobre carga' : session.enfoque_tecnico >= 50 ? 'equilibrio técnica/carga' : 'priorizar rendimiento y carga'})
- Variedad de ejercicios: ${session.variedad}/100 (${session.variedad >= 70 ? 'mucha variedad, pocos ejercicios repetidos' : session.variedad >= 40 ? 'variedad moderada' : 'ejercicios fijos para dominar el patrón'})
${config?.notas_coach ? `\n━━━ INSTRUCCIONES ADICIONALES DEL ENTRENADOR ━━━\n${config.notas_coach}` : ''}

━━━ INSTRUCCIONES ━━━
1. Crea exactamente ${session.semanas_duracion} semanas con ${session.dias_semana} días de entrenamiento cada una
2. Cada sesión debe durar aproximadamente ${session.duracion_media_min} minutos
3. Los módulos con más peso deben aparecer proporcionalmente más en el plan
4. Aplica ${progressionDesc.split(':')[0]} entre semanas
5. Si hay lesiones, omite o adapta ejercicios que las afecten
6. Nombra los días por su tipo: "Fuerza tren superior", "HIIT metabólico", etc.

Responde SOLO con JSON válido:
{
  "titulo": "string descriptivo",
  "descripcion": "string 1-2 frases",
  "duracion_semanas": ${session.semanas_duracion},
  "recomendaciones_nutricionales": "string",
  "notas_entrenador": "string",
  "semanas": [
    {
      "semana": 1,
      "objetivo_semana": "string",
      "dias": [
        {
          "dia": "lunes",
          "tipo": "string tipo de sesión",
          "duracion_min": ${session.duracion_media_min},
          "notas": "string opcional",
          "ejercicios": [
            {
              "nombre": "string",
              "series": 3,
              "repeticiones": "10-12",
              "descanso_seg": ${session.descanso_entre_series_seg},
              "notas": "string opcional"
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
    temperature: 0.6,
    max_tokens: 6000,
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('OpenAI no devolvió contenido')

  const planData = JSON.parse(content)

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
