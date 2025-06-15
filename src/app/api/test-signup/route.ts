import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    // First check if user exists
    const { data: existingAuth } = await supabase.auth.getUser()
    
    // Try to sign up
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password || 'defaultpass123',
      options: {
        data: {
          full_name: email.split('@')[0],
        }
      }
    })
    
    if (error) {
      // If user exists, try to sign in
      if (error.message?.includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password || 'defaultpass123'
        })
        
        return NextResponse.json({
          status: 'user_exists',
          message: 'User already registered. Try signing in.',
          signInError: signInError?.message,
          signInSuccess: !signInError
        })
      }
      
      return NextResponse.json({
        status: 'error',
        message: error.message,
        code: error.status
      })
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Signup successful! Check email.',
      userId: data.user?.id
    })
    
  } catch (err: any) {
    return NextResponse.json({
      status: 'exception',
      message: err.message
    })
  }
}