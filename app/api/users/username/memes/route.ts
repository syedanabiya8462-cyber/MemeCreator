import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  const supabase = createClient()
  
  // First get user
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('username', params.username)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('memes')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}