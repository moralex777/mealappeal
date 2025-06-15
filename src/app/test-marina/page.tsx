'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestMarinaPage() {
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSignup = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      // First, check if user exists
      const { data: existingUser } = await supabase.auth.admin?.listUsers?.({
        email: 'marina.morari03@gmail.com'
      })
      
      if (existingUser?.users?.length > 0) {
        setResult({
          error: 'User already exists',
          user: existingUser.users[0],
          suggestion: 'Try signing in instead of signing up'
        })
        return
      }

      // Try to sign up
      const { data, error } = await supabase.auth.signUp({
        email: 'marina.morari03@gmail.com',
        password: password || 'testpassword123',
        options: {
          data: {
            full_name: 'Marina Morari',
          }
        }
      })

      if (error) {
        // Try to get more specific error info
        if (error.message.includes('already registered')) {
          // Try to sign in instead
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'marina.morari03@gmail.com',
            password: password || 'testpassword123'
          })
          
          setResult({
            error: 'User already exists',
            signInAttempt: signInError ? signInError.message : 'Sign in successful',
            data: signInData
          })
        } else {
          setResult({
            error: error.message,
            code: error.status,
            details: error
          })
        }
      } else {
        setResult({
          success: true,
          data: data,
          message: 'Signup successful! Check email for confirmation.'
        })
      }
    } catch (err: any) {
      setResult({
        exception: err.message,
        stack: err.stack
      })
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        'marina.morari03@gmail.com',
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      )
      
      setResult({
        resetPassword: true,
        error: error?.message,
        success: !error ? 'Password reset email sent' : null
      })
    } catch (err: any) {
      setResult({
        exception: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Test Marina Email Signup</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Testing: marina.morari03@gmail.com</p>
        
        <input
          type="password"
          placeholder="Enter password (or use default)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}
        />
        
        <button
          onClick={testSignup}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#ccc' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            marginBottom: '10px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Signup'}
        </button>
        
        <button
          onClick={resetPassword}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#ccc' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Sending...' : 'Send Password Reset Email'}
        </button>
      </div>

      {result && (
        <div style={{
          background: '#f5f5f5',
          padding: '15px',
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          <h3>Result:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}