import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://api.imgflip.com/get_memes')
    const data = await res.json()
    
    if (data.success) {
      // Map Imgflip format to our internal format
      const templates = data.data.memes.map((meme: any) => ({
        id: `imgflip-${meme.id}`,
        name: meme.name,
        image_url: meme.url,
        width: meme.width,
        height: meme.height,
        box_count: meme.box_count,
        category: 'Trending (Online)',
        isExternal: true
      }))
      
      return NextResponse.json(templates)
    } else {
      throw new Error(data.error_message || 'Failed to fetch memes')
    }
  } catch (error: any) {
    console.error('Error fetching external memes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
