'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function MobileTestPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [email, setEmail] = useState('')
  
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${time}] ${msg}`])
  }

  useEffect(() => {
    // Test environment on load
    addLog(`User Agent: ${navigator.userAgent}`)
    addLog(`Platform: ${navigator.platform}`)
    addLog(`Cookies enabled: ${navigator.cookieEnabled}`)
    
    // Test localStorage
    try {
      localStorage.setItem('test', 'value')
      localStorage.removeItem('test')
      addLog('localStorage: ✅ Working')
    } catch (e) {
      addLog('localStorage: ❌ Blocked')
    }

    // Test sessionStorage
    try {
      sessionStorage.setItem('test', 'value')
      sessionStorage.removeItem('test')
      addLog('sessionStorage: ✅ Working')
    } catch (e) {
      addLog('sessionStorage: ❌ Blocked')
    }
  }, [])

  const testAuth = async () => {
    addLog('Starting auth test...')
    
    try {
      // Test 1: Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        addLog(`Session error: ${sessionError.message}`)
      } else {
        addLog(`Session: ${session ? 'Active' : 'None'}`)
      }

      // Test 2: Try to get auth URL
      const { data: urlData, error: urlError } = await supabase.auth.signInWithOtp({
        email: email || 'test@example.com',
        options: {
          shouldCreateUser: false,
        }
      })
      
      if (urlError) {
        addLog(`OTP test error: ${urlError.message}`)
      } else {
        addLog('OTP test: Can connect to auth')
      }

      // Test 3: Check Supabase URL
      addLog(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...`)
      
    } catch (err: any) {
      addLog(`Exception: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Mobile Auth Test</h1>
      
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          marginBottom: '10px',
          border: '1px solid #ccc',
          borderRadius: '5px',
        }}
      />
      
      <button
        onClick={testAuth}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          marginBottom: '20px',
        }}
      >
        Test Auth Connection
      </button>

      <div style={{
        background: '#f5f5f5',
        padding: '15px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        maxHeight: '400px',
        overflow: 'auto',
      }}>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>This page tests:</p>
        <ul>
          <li>Browser storage capabilities</li>
          <li>Supabase connection</li>
          <li>Authentication flow</li>
        </ul>
        <p>Share the logs to debug mobile issues.</p>
      </div>
    </div>
  )
}