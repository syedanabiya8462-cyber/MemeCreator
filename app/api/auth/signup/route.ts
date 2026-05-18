import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { email, password, username, display_name } = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, display_name: display_name || username }
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Create user profile
  if (data.user) {
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email,
      username,
      display_name: display_name || username
    })

    if (profileError) {
      console.error('Profile creation error:', profileError)
    }
  }

  return NextResponse.json({ user: data.user })
}