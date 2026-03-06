import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q?.trim()) return Response.json({ error: 'Missing q' }, { status: 400 })

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return Response.json({
      fallback: `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' ejercicio tutorial')}`,
    })
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(q + ' ejercicio')}&key=${apiKey}`
    )
    const data = await res.json()
    const videoId = data.items?.[0]?.id?.videoId
    if (videoId) {
      return Response.json({ videoId })
    }
    return Response.json({
      fallback: `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' ejercicio')}`,
    })
  } catch {
    return Response.json({
      fallback: `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' ejercicio')}`,
    })
  }
}
