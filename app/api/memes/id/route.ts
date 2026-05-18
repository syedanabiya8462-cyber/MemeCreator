import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const searchParams = req.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')
  const sort = searchParams.get('sort') || 'newest'
  const category = searchParams.get('category')
  
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('memes')
    .select('*, user:users(*), template:templates(*)')
    .eq('is_public', true)

  // Apply sorting
  switch (sort) {
    case 'trending':
      query = query.order('likes_count', { ascending: false })
      break
    case 'top':
      query = query.order('likes_count', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  if (category && category !== 'All') {
    query = query.eq('templates.category', category)
  }

  const { data, error, count } = await query
    .range(from, to)
    .overrideTypes<any>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    memes: data,
    pagination: {
      page,
      limit,
      total: count,
      hasMore: (data?.length || 0) === limit
    }
  })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  const { data, error } = await supabase
    .from('memes')
    .insert({
      user_id: currentUser.id,
      ...body
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}