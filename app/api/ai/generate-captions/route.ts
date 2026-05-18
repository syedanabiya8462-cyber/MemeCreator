import { NextRequest, NextResponse } from 'next/server'
import { generateCaptions } from '@/lib/ai/openai'
import { rateLimiter } from '@/lib/utils/rateLimiter'

export async function POST(req: NextRequest) {
  try {
    const { templateId, context, tone, count } = await req.json()
    
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const isRateLimited = await rateLimiter(ip)
    if (isRateLimited) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      )
    }
    
    const prompt = `Generate meme captions for a ${context || 'meme'} template. Make them funny and engaging.`
    const captions = await generateCaptions(prompt, tone, count)
    
    return NextResponse.json(captions)
  } catch (error) {
    console.error('Caption generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate captions' },
      { status: 500 }
    )
  }
}