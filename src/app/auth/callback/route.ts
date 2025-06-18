import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { createOrUpdateProfile } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('❌ OAuth callback error:', error)
        return NextResponse.redirect(new URL('/login?error=oauth_failed', requestUrl.origin))
      }

      if (data.user) {
        // Create or update user profile
        const profileResult = await createOrUpdateProfile(data.user.id, {
          email: data.user.email || '',
          full_name: data.user.user_metadata?.['full_name'] || data.user.user_metadata?.['name'],
          avatar_url: data.user.user_metadata?.['avatar_url'] || data.user.user_metadata?.['picture'],
        })

        if (!profileResult.success) {
          console.error('❌ Profile creation failed:', profileResult.error)
          // Continue anyway - user is authenticated
        }

        console.log('✅ OAuth successful for:', data.user.email)

        // Redirect to meals page after successful authentication
        return NextResponse.redirect(new URL('/meals', requestUrl.origin))
      }
    } catch (authError) {
      console.error('❌ Auth exchange error:', authError)
      return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
    }
  }

  // If no code or authentication failed, redirect to login
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
}
