import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { moderateContent } from '@/lib/ai/openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  let templates: any[] = []
  let promptText = ''
  
  try {
    const { prompt } = await req.json()
    promptText = prompt
    
    // Content moderation (graceful if OpenAI is rate limited/depleted)
    let moderationFlagged = false
    try {
      const moderation = await moderateContent(prompt)
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Fetch top templates to give the AI context
    const { data, error: queryError } = await supabase
      .from('templates')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(50)

    if (queryError) {
      console.error('Supabase query error:', queryError)
      return NextResponse.json({ 
        error: 'Supabase query failed', 
        details: queryError 
      }, { status: 500 })
    }

    templates = data || []

    if (templates.length === 0) {
      return NextResponse.json({ error: 'No templates available.' }, { status: 500 })
    }

    const templateOptions = templates.map(t => `- ID: ${t.id} | Name: "${t.name}" | Tags: ${t.tags?.join(', ') || ''}`).join('\n')

    const systemPrompt = `You are a meme generation agent. The user will provide a scenario or topic for a meme. 
Your job is to select the most appropriate template from the provided list, and write a funny, clever top and bottom caption for it.

Available Templates:
${templateOptions}

Respond ONLY with a valid JSON object in this format:
{
  "templateId": "the-uuid-of-the-selected-template",
  "topText": "Top caption text",
  "bottomText": "Bottom caption text"
}`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    })

    const resultText = response.choices[0].message.content
    if (!resultText) throw new Error("No response from AI")

    const result = JSON.parse(resultText)
    
    // Find the full template object to return
    const selectedTemplate = templates.find(t => t.id === result.templateId) || templates[0]

    return NextResponse.json({
      template: selectedTemplate,
      topText: result.topText,
      bottomText: result.bottomText
    })

  } catch (error: any) {
    console.error('Agent generation error:', error)
    
    // Quota rate-limit fallback
    if (
      templates.length > 0 && 
      (error.status === 429 || error.message?.includes('Too Many Requests') || error.message?.includes('429') || error.message?.includes('quota'))
    ) {
      console.warn('OpenAI Quota/Rate Limit hit. Triggering Smart Local Fallback...');
      
      const promptLower = promptText.toLowerCase()
      
      // Let's search templates for matches
      let matchedTemplate = templates[0]
      
      if (promptLower.includes('boyfriend') || promptLower.includes('girl') || promptLower.includes('distracted')) {
        matchedTemplate = templates.find(t => t.name.toLowerCase().includes('boyfriend')) || templates[0]
      } else if (promptLower.includes('drake') || promptLower.includes('no') || promptLower.includes('yes')) {
        matchedTemplate = templates.find(t => t.name.toLowerCase().includes('drake')) || templates[0]
      } else if (promptLower.includes('brain') || promptLower.includes('expanding')) {
        matchedTemplate = templates.find(t => t.name.toLowerCase().includes('brain')) || templates[0]
      } else if (promptLower.includes('change my mind') || promptLower.includes('opinion')) {
        matchedTemplate = templates.find(t => t.name.toLowerCase().includes('change')) || templates[0]
      } else if (promptLower.includes('disaster') || promptLower.includes('burn') || promptLower.includes('fire')) {
        matchedTemplate = templates.find(t => t.name.toLowerCase().includes('disaster')) || templates[0]
      } else {
        // Pick a random template from the seeded templates
        matchedTemplate = templates[Math.floor(Math.random() * templates.length)]
      }

      // Generate funny captions based on keywords
      let topText = "WHEN YOU ASK THE AI AGENT TO GENERATE A MEME"
      let bottomText = "AND IT ACTUALLY WORKS PERFECTLY ON THE FIRST TRY"

      if (promptLower.includes('code') || promptLower.includes('bug') || promptLower.includes('program') || promptLower.includes('developer') || promptLower.includes('css')) {
        topText = "ME FIXING A PRODUCTION BUG WITH ONE LINE OF CSS"
        bottomText = "ENTIRE SITE'S LAYOUT: *CHUCKLES, I'M IN DANGER*"
      } else if (promptLower.includes('compile') || promptLower.includes('run')) {
        topText = "MY CODE COMPILES ON THE FIRST TRY"
        bottomText = "ME: WHAT DID I DO WRONG?"
      } else if (promptLower.includes('exam') || promptLower.includes('study') || promptLower.includes('school')) {
        topText = "STUDYING FOR 5 HOURS"
        bottomText = "GETTING A C ON THE EXAM ANYWAY"
      } else if (promptLower.includes('money') || promptLower.includes('buy') || promptLower.includes('spend')) {
        topText = "MY WALLET LOOKING AT ME"
        bottomText = "AFTER I SPEND MONEY ON THINGS I DON'T NEED"
      } else {
        // Semi-customized using prompt words
        const words = promptText.split(' ')
        if (words.length > 4) {
          topText = words.slice(0, Math.floor(words.length / 2)).join(' ').toUpperCase()
          bottomText = words.slice(Math.floor(words.length / 2)).join(' ').toUpperCase()
        }
      }

      return NextResponse.json({
        template: matchedTemplate,
        topText,
        bottomText,
        isFallback: true
      })
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate meme with AI Agent' },
      { status: 500 }
    )
  }
}
