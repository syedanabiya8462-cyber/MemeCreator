import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('comments')
    .select('*, user:users(*)')
    .eq('meme_id', params.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { content } = await req.json()

  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: currentUser.id,
      meme_id: params.id,
      content
    })
    .select('*, user:users(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update comment count
  await supabase.rpc('increment_comment_count', { meme_id: params.id })

  return NextResponse.json(data)
}