import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  // Use service role key to bypass RLS for public read
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const searchParams = req.nextUrl.searchParams
  const searchQuery = searchParams.get('search')
  const sortBy = searchParams.get('sortBy') || 'trending'
  const timeFrame = searchParams.get('timeFrame') || 'week'
  const page = parseInt(searchParams.get('page') || '1')
  
  let query = supabase
    .from('memes')
    .select('*, user:users(*), template:templates(*)')
    .eq('is_public', true)

  // Apply search filter
  if (searchQuery) {
    query = query.textSearch('generation_prompt', searchQuery)
  }

  // Apply sorting
  switch (sortBy) {
    case 'trending':
      query = query.order('likes_count', { ascending: false })
      break
    case 'new':
      query = query.order('created_at', { ascending: false })
      break
    case 'top':
      query = query.order('likes_count', { ascending: false })
      break
  }

  // Apply time filter
  if (timeFrame !== 'all') {
    const date = new Date()
    switch (timeFrame) {
      case 'today':
        date.setDate(date.getDate() - 1)
        break
      case 'week':
        date.setDate(date.getDate() - 7)
        break
      case 'month':
        date.setMonth(date.getMonth() - 1)
        break
    }
    query = query.gte('created_at', date.toISOString())
  }

  const { data, error } = await query
    .range((page - 1) * 20, page * 20 - 1)

  if (error) {
    console.error('Explore API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
