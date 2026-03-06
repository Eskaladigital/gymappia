import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ClientProfile, AISuggestion, SessionParams } from '@/types'
import { BASE_MODULES, SYSTEM_PACKS } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const profile: ClientProfile = await req.json()

    const packsDesc = SYSTEM_PACKS.map(p =>
      `• "${p.nombre}" (tags: ${p.tags.join(', ')}): ${p.descripcion}`
    ).join('\n')

    const modulesDesc = BASE_MODULES.map(m =>
      `• ${m.id} (${m.label}): ${m.description}`
    ).join('\n')

    const prompt = `
Eres un experto en programación del entrenamiento físico (NSCA, ACSM). 
Analiza el perfil del cliente y devuelve una configuración óptima para su plan.

PERFIL:
- Nombre: ${profile.nombre}
- Edad: ${profile.edad} | Peso: ${profile.peso}kg | Altura: ${profile.altura}cm | Sexo: ${profile.sexo}
- Nivel: ${profile.nivel}
- Objetivo: ${profile.objetivo} — ${profile.objetivo_detalle}
- Lesiones: ${profile.lesiones || 'Ninguna'}
- Enfermedades: ${profile.enfermedades || 'Ninguna'}
- Sesiones/semana disponibles: ${profile.sesiones_semana}
- Minutos/sesión: ${profile.minutos_sesion}
- Lugar: ${profile.lugar} | Equipamiento: ${profile.equipamiento || 'básico'}
- Deportes que le gustan: ${profile.deportes_gusta || 'no especificado'}
- Deportes que odia: ${profile.deportes_odia || 'ninguno'}
- Horas sueño: ${profile.horas_sueno} | Estrés: ${profile.nivel_estres}/10
- Tipo trabajo: ${profile.tipo_trabajo || 'no especificado'}

MÓDULOS DISPONIBLES (asigna valor 0-100 a cada uno):
${modulesDesc}

PACKS DISPONIBLES (sugiere el más adecuado si lo ves claro):
${packsDesc}

Responde SOLO con JSON válido con esta estructura exacta:
{
  "modules": [
    {"id": "fuerza", "value": 60},
    {"id": "hipertrofia", "value": 70},
    {"id": "cardio", "value": 40},
    {"id": "hiit", "value": 30},
    {"id": "movilidad", "value": 50},
    {"id": "funcional", "value": 60},
    {"id": "core", "value": 55},
    {"id": "potencia", "value": 20}
  ],
  "session": {
    "duracion_media_min": 45,
    "descanso_entre_series_seg": 75,
    "rpe_objetivo": 7,
    "semanas_duracion": 4,
    "dias_semana": 3,
    "progresion": "lineal",
    "enfoque_tecnico": 70,
    "variedad": 60
  },
  "pack_sugerido_nombre": "Nombre del pack si aplica o null",
  "razonamiento": "Explicación en 2-3 frases de por qué esta configuración para este cliente",
  "alertas": ["Alerta 1 si hay algo relevante por lesiones o condiciones", "Alerta 2..."]
}

REGLAS:
- Valores de módulos entre 0 y 100 (no tienen que sumar 100)
- Si hay lesiones, baja al 0 los módulos contraindicados
- Si es principiante, baja potencia e hiit, sube movilidad
- Si es adulto mayor (+60), pon hiit a 0 y potencia a 0, sube movilidad y funcional
- Si está embarazada, pon hiit y potencia a 0, enfoque_tecnico al 100
- progresion: "lineal" para principiantes, "ondulada" para intermedios, "bloque" para avanzados
- rpe_objetivo máximo 6 para mayores, 7 para intermedios, 9 para avanzados
- Si las alertas son vacías, pon array vacío []
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000,
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('Sin respuesta de OpenAI')

    const suggestion: AISuggestion = JSON.parse(content)
    return NextResponse.json(suggestion)
  } catch (error: any) {
    console.error('suggest-config error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
