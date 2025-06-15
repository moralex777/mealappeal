'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugSignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }

  const testSignup = async () => {
    setLogs([])
    setLoading(true)
    
    addLog('Starting signup test...')
    addLog(`Device: ${navigator.userAgent}`)
    addLog(`Online: ${navigator.onLine}`)
    addLog(`Cookies enabled: ${navigator.cookieEnabled}`)
    
    try {
      // Test 1: Check Supabase connection
      addLog('Testing Supabase connection...')
      const { data: healthCheck } = await supabase.from('profiles').select('count').limit(1)
      addLog(`Supabase connection: ${healthCheck ? 'OK' : 'Failed'}`)
      
      // Test 2: Attempt signup
      addLog(`Attempting signup with email: ${email}`)
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
        options: {
          data: {
            full_name: 'Test User',
          },
        },
      })
      
      if (error) {
        addLog(`Signup error: ${error.message}`)
        addLog(`Error code: ${error.status || 'none'}`)
        addLog(`Error details: ${JSON.stringify(error)}`)
      } else if (data.user) {
        addLog(`Signup successful! User ID: ${data.user.id}`)
        addLog(`Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`)
        
        // Test 3: Check if profile was created
        addLog('Checking for profile creation...')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
          
        if (profile) {
          addLog('Profile created successfully!')
        } else {
          addLog(`Profile not created: ${profileError?.message || 'Unknown error'}`)
        }
      } else {
        addLog('Signup returned no data or error')
      }
      
    } catch (err: any) {
      addLog(`Exception caught: ${err.message}`)
      addLog(`Stack: ${err.stack}`)
    } finally {
      setLoading(false)
      addLog('Test complete')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Debug Signup Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="email"
          placeholder="test@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            fontSize: '16px', // Prevents zoom on iOS
          }}
        />
        
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            fontSize: '16px', // Prevents zoom on iOS
          }}
        />
        
        <button
          onClick={testSignup}
          disabled={loading || !email || !password || password.length < 6}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#ccc' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Testing...' : 'Test Signup'}
        </button>
      </div>

      <div style={{ 
        background: '#f0f0f0', 
        padding: '15px', 
        borderRadius: '5px',
        maxHeight: '400px',
        overflow: 'auto',
      }}>
        <h3>Debug Logs:</h3>
        {logs.length === 0 ? (
          <p>No logs yet. Click "Test Signup" to start.</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ 
              fontFamily: 'monospace', 
              fontSize: '12px',
              marginBottom: '5px',
              whiteSpace: 'pre-wrap',
            }}>
              {log}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>Instructions for your friend:</p>
        <ol>
          <li>Go to: {typeof window !== 'undefined' ? `${window.location.origin}/debug-signup` : '/debug-signup'}</li>
          <li>Enter a test email and password</li>
          <li>Click "Test Signup"</li>
          <li>Screenshot or copy the debug logs</li>
        </ol>
      </div>
    </div>
  )
}