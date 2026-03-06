import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { pregunta, client, plan_titulo, historial } = await req.json()

    const historialTexto = (historial || [])
      .map((m: { rol: string; texto: string }) => `${m.rol === 'client' ? 'Cliente' : 'Coach'}: ${m.texto}`)
      .join('\n')

    const prompt = `Eres un coach personal de fitness experto, amigable y motivador de PACGYM.
Conoces perfectamente a este cliente:
- Nombre: ${client.nombre}, ${client.edad} años, ${client.peso}kg, ${client.altura}cm
- Nivel: ${client.nivel} | Objetivo: ${client.objetivo}
- Lesiones: ${client.lesiones || 'ninguna'} | Lugar: ${client.lugar}
- Plan activo: ${plan_titulo || 'en preparación'}

Tu estilo: cercano, directo, motivador. Respuestas cortas (2-4 frases máximo). 
Usa emojis ocasionalmente. Siempre en español.
Si mencionan dolor o lesión, sé conservador y recomienda descanso o médico.
Si preguntan sobre nutrición, da consejos prácticos básicos.

${historialTexto ? `Conversación previa:\n${historialTexto}\n` : ''}
Cliente pregunta: ${pregunta}

Responde como coach:`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75,
      max_tokens: 200,
    })

    const respuesta = response.choices[0].message.content || 'No puedo responder ahora, prueba más tarde.'
    return NextResponse.json({ respuesta })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
