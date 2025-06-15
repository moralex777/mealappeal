'use client'

import { useState } from 'react'

export default function DebugNetworkPage() {
  const [results, setResults] = useState<any[]>([])
  
  const addResult = (test: string, result: any) => {
    setResults(prev => [...prev, { test, result, time: new Date().toISOString() }])
  }

  const runTests = async () => {
    setResults([])
    
    // Test 1: Basic fetch
    try {
      addResult('Basic fetch test', 'Starting...')
      const response = await fetch('/api/health')
      const data = await response.json()
      addResult('Basic fetch test', { status: response.status, data })
    } catch (error: any) {
      addResult('Basic fetch test', { error: error.message })
    }

    // Test 2: Supabase URL
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      addResult('Supabase URL', supabaseUrl || 'NOT SET')
      
      if (supabaseUrl) {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          }
        })
        addResult('Supabase connection', { status: response.status })
      }
    } catch (error: any) {
      addResult('Supabase connection', { error: error.message })
    }

    // Test 3: Check localStorage
    try {
      const authToken = localStorage.getItem('supabase.auth.token')
      addResult('Auth token in localStorage', authToken ? 'Present' : 'Not found')
    } catch (error: any) {
      addResult('localStorage access', { error: error.message })
    }

    // Test 4: Navigator info
    addResult('User Agent', navigator.userAgent)
    addResult('Online Status', navigator.onLine)
    addResult('Cookie Enabled', navigator.cookieEnabled)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Network Debug Page</h1>
      
      <button 
        onClick={runTests}
        style={{ 
          padding: '10px 20px', 
          background: '#10b981', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Run Network Tests
      </button>

      <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px' }}>
        <h2>Test Results:</h2>
        {results.length === 0 ? (
          <p>Click "Run Network Tests" to start</p>
        ) : (
          results.map((result, i) => (
            <div key={i} style={{ marginBottom: '10px', padding: '10px', background: 'white', borderRadius: '5px' }}>
              <strong>{result.test}:</strong>
              <pre style={{ margin: '5px 0', fontSize: '12px' }}>
                {JSON.stringify(result.result, null, 2)}
              </pre>
              <small style={{ color: '#666' }}>{result.time}</small>
            </div>
          ))
        )}
      </div>
    </div>
  )
}