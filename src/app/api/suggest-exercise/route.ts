import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

export async function POST(req: NextRequest) {
  try {
    const { ejercicio_original, client, dia_tipo, otros_ejercicios } = await req.json()

    const prompt = `Eres un coach de fitness experto. El cliente NO puede hacer este ejercicio: "${ejercicio_original}".

Perfil del cliente:
- Lesiones: ${client.lesiones || 'ninguna'}
- Equipamiento: ${client.equipamiento || 'básico'}
- Lugar: ${client.lugar}
- Nivel: ${client.nivel}
- Objetivo: ${client.objetivo}

Tipo de día: ${dia_tipo || 'entrenamiento general'}
Otros ejercicios del día (para no repetir): ${(otros_ejercicios || []).join(', ') || 'ninguno'}

Sugiere UN ejercicio alternativo que:
1. Trabaje grupos musculares similares
2. Respete lesiones y equipamiento disponible
3. Sea adecuado para su nivel
4. Devuelve SOLO un JSON válido con esta estructura exacta (sin markdown, sin explicación):
{"nombre":"Nombre del ejercicio","series":3,"repeticiones":12,"descanso_seg":60,"notas":"Breve indicación técnica o por qué es buena alternativa"}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 150,
    })

    const text = response.choices[0].message.content || ''
    const match = text.match(/\{[\s\S]*\}/)
    const alternativa = match ? JSON.parse(match[0]) : null
    if (!alternativa?.nombre) {
      return NextResponse.json({ error: 'No se pudo generar alternativa' }, { status: 500 })
    }
    return NextResponse.json({ alternativa })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
