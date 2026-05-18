import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { moderateContent } from '@/lib/ai/openai'
import { rateLimiter } from '@/lib/utils/rateLimiter'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  let promptText = ''
  let styleText = 'funny'
  
  try {
    const body = await req.json()
    promptText = body.prompt || ''
    styleText = body.style || 'funny'
    
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const isRateLimited = await rateLimiter(ip)
    if (isRateLimited) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      )
    }

    // Content moderation (graceful if OpenAI is rate limited/depleted)
    let moderationFlagged = false
    try {
      const moderation = await moderateContent(promptText)
      if (moderation.flagged) {
        moderationFlagged = true
      }
    } catch (modError) {
      console.warn('Moderation API failed (possibly rate limited), skipping OpenAI moderation...', modError)
    }

    if (moderationFlagged) {
      return NextResponse.json(
        { error: 'Inappropriate content detected' },
        { status: 400 }
      )
    }

    const enhancedPrompt = `Create a fresh, completely original meme-style image. It must be a new creation, not an existing meme. Clear composition, suitable for text overlay, vibrant, highly detailed, masterpiece. Style: ${styleText}. Theme: ${promptText}`

    const [imageResponse, textResponse] = await Promise.all([
      openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
      }),
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a highly creative meme generator. Create a hilarious, completely original, fresh top and bottom caption for a meme based on the user's prompt. Do NOT use classic or overused memes. Respond ONLY with JSON containing 'topText' and 'bottomText'." },
          { role: "user", content: `Prompt: ${promptText} | Style: ${styleText}` }
        ],
        temperature: 0.9,
        response_format: { type: "json_object" }
      }).catch(err => {
        console.error("Text generation failed", err)
        return null
      })
    ])

    if (!imageResponse.data?.[0]?.url) {
      throw new Error("No image generated from OpenAI")
    }
    
    let topText = "FRESH AI MEME"
    let bottomText = "SO CREATIVE"
    if (textResponse?.choices?.[0]?.message?.content) {
      try {
        const parsed = JSON.parse(textResponse.choices[0].message.content)
        if (parsed.topText) topText = parsed.topText.toUpperCase()
        if (parsed.bottomText) bottomText = parsed.bottomText.toUpperCase()
      } catch (e) {
        console.error("Failed to parse text response")
      }
    }

    return NextResponse.json({ 
      imageUrl: imageResponse.data[0].url,
      topText,
      bottomText
    })
  } catch (error: any) {
    console.error('Image generation error:', error)
    
    // Smart local fallback for any error (missing model, billing, quota, 429, API key issues)
    console.warn('OpenAI error encountered. Triggering Smart Local Fallback...');
    
    const randomSeed = Math.floor(Math.random() * 10000000);
    const pollinationsPrompt = `A fresh completely original brand new masterpiece meme background about ${promptText}, high quality, expressive, ${styleText} style, vibrant`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(pollinationsPrompt)}?width=1024&height=1024&nologo=true&seed=${randomSeed}`;

    // Fallback captions
    const words = promptText.split(' ')
    let topText = "NEW CREATIVE MEME"
    let bottomText = "ABOUT " + promptText.toUpperCase()
    if (words.length > 2) {
      topText = words.slice(0, Math.floor(words.length / 2)).join(' ').toUpperCase()
      bottomText = words.slice(Math.floor(words.length / 2)).join(' ').toUpperCase()
    }

    return NextResponse.json({ imageUrl, topText, bottomText, isFallback: true })
  }
}