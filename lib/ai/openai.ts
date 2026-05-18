import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateImage(prompt: string) {
  const enhancedPrompt = `Create a meme-style image that is: clear, simple composition, suitable for text overlay, high contrast, expressive subjects. Style: ${prompt}`
  
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: enhancedPrompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  })
  return response.data?.[0]?.url
}

export async function generateCaptions(prompt: string, tone: string, count: number = 5) {
  const systemPrompt = `You are a meme caption writer. Generate funny, relatable, and shareable meme captions. Match the tone requested (${tone}). Keep captions short (under 100 characters for top/bottom text). Understand internet culture and current trends. Output JSON array of 5 caption options with 'top' and 'bottom' fields.`

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    temperature: 0.9,
    response_format: { type: "json_object" }
  })

  return JSON.parse(response.choices[0].message.content || '{"captions": []}')
}

export async function moderateContent(text: string) {
  const response = await openai.moderations.create({
    input: text,
  })
  
  return response.results[0]
}