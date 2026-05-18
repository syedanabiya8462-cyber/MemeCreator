import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()

  // Create user profile
  if (data.user) {
    await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email,
      username: data.user.user_metadata?.username,
      display_name: data.user.user_metadata?.display_name
    })
  }

  return NextResponse.json({ user: data.user })
}