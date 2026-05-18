import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', currentUser.id)
    .eq('meme_id', params.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Already liked' }, { status: 400 })
  }

  const { error } = await supabase
    .from('likes')
    .insert({ user_id: currentUser.id, meme_id: params.id })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update like count
  await supabase.rpc('increment_like_count', { meme_id: params.id })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', currentUser.id)
    .eq('meme_id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update like count
  await supabase.rpc('decrement_like_count', { meme_id: params.id })

  return NextResponse.json({ success: true })
}