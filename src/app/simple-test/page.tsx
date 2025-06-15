'use client'

import { useState } from 'react'

export default function SimpleTestPage() {
  const [email, setEmail] = useState('marina.morari03@gmail.com')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const testSignup = async () => {
    setMessage('Testing...')
    
    try {
      const response = await fetch('/api/test-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      setMessage(JSON.stringify(data, null, 2))
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Simple Signup Test</h2>
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        style={{
          display: 'block',
          width: '100%',
          padding: '10px',
          marginBottom: '10px',
          fontSize: '16px',
        }}
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        style={{
          display: 'block',
          width: '100%',
          padding: '10px',
          marginBottom: '10px',
          fontSize: '16px',
        }}
      />
      
      <button
        onClick={testSignup}
        style={{
          display: 'block',
          width: '100%',
          padding: '10px',
          fontSize: '16px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
        }}
      >
        Test Signup
      </button>
      
      <div style={{
        marginTop: '20px',
        padding: '10px',
        background: '#f0f0f0',
        borderRadius: '5px',
        whiteSpace: 'pre-wrap',
        fontSize: '14px',
      }}>
        {message || 'Click Test Signup to begin'}
      </div>
    </div>
  )
}