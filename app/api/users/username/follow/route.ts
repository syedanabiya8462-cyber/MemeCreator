import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  const supabase = createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user to follow
  const { data: targetUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', params.username)
    .single()

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: currentUser.id,
      following_id: targetUser.id
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  const supabase = createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user to unfollow
  const { data: targetUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', params.username)
    .single()

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', currentUser.id)
    .eq('following_id', targetUser.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}