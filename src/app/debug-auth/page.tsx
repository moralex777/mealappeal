'use client'

import { useEffect, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function DebugAuthPage() {
  const { user, loading: authLoading } = useAuth()
  const [profileData, setProfileData] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  useEffect(() => {
    debugAuth()
  }, [user])

  const debugAuth = async () => {
    addLog(`Auth loading: ${authLoading}`)
    addLog(`User: ${user ? user.id : 'null'}`)
    
    if (!user) {
      addLog('No user found')
      return
    }

    try {
      // Test query 1: with user_id
      addLog('Testing query with user_id...')
      const { data: data1, error: error1 } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      addLog(`Query 1 result: ${JSON.stringify({ data: data1, error: error1 })}`)

      // Test query 2: with id
      addLog('Testing query with id...')
      const { data: data2, error: error2 } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      
      addLog(`Query 2 result: ${JSON.stringify({ data: data2, error: error2 })}`)

      // Test query 3: get all profiles for this email
      addLog('Testing query with email...')
      const { data: data3, error: error3 } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
      
      addLog(`Query 3 result: ${JSON.stringify({ data: data3, error: error3 })}`)

      setProfileData(data1 || data2 || (data3 && data3[0]) || null)
    } catch (err: any) {
      addLog(`Error: ${err.message}`)
      setError(err.message)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Debug Auth Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Auth Status</h2>
        <p>Loading: {authLoading ? 'Yes' : 'No'}</p>
        <p>User ID: {user?.id || 'None'}</p>
        <p>Email: {user?.email || 'None'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Profile Data</h2>
        <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
          {profileData ? JSON.stringify(profileData, null, 2) : 'No profile data'}
        </pre>
      </div>

      {error && (
        <div style={{ marginBottom: '20px', color: 'red' }}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2>Debug Logs</h2>
        <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px', fontSize: '12px' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '5px' }}>{log}</div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => window.location.reload()} 
        style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        Refresh Page
      </button>
    </div>
  )
}