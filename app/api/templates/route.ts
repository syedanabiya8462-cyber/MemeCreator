import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const searchParams = req.nextUrl.searchParams
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabase
    .from('templates')
    .select('*')
    .order('usage_count', { ascending: false })
    .limit(limit)

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  const { data, error } = await supabase
    .from('templates')
    .insert({
      ...body,
      uploaded_by: currentUser.id,
      is_custom: true
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}