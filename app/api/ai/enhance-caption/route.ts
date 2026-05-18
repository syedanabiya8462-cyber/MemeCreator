import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { caption, instruction } = await req.json()

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a meme caption expert. Enhance the given caption to make it funnier, more engaging, and more shareable. Keep it short (under 100 characters)."
        },
        {
          role: "user",
          content: `Original caption: "${caption}"\nInstruction: ${instruction || 'Make it funnier'}`
        }
      ],
      temperature: 0.9,
    })

    const enhanced = response.choices[0].message.content

    return NextResponse.json({ enhanced })
  } catch (error) {
    console.error('Enhance caption error:', error)
    return NextResponse.json(
      { error: 'Failed to enhance caption' },
      { status: 500 }
    )
  }
}