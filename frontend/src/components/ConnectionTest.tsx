import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { api, httpClient } from '../lib/api'

export const ConnectionTest = () => {
  const [supabaseStatus, setSupabaseStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [backendStatus, setBackendStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    testConnections()
  }, [])

  const testConnections = async () => {
    // Test Supabase connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      if (error) throw error
      setSupabaseStatus('connected')
    } catch (err) {
      setSupabaseStatus('error')
      setError(prev => prev + `Supabase: ${err instanceof Error ? err.message : 'Unknown error'}\n`)
    }

    // Test backend connection
    try {
      const response = await httpClient.get('/health')
      if (response.success) {
        setBackendStatus('connected')
      } else {
        throw new Error(response.error?.message || 'Backend health check failed')
      }
    } catch (err) {
      setBackendStatus('error')
      setError(prev => prev + `Backend: ${err instanceof Error ? err.message : 'Unknown error'}\n`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return '✅ Connected'
      case 'error': return '❌ Error'
      default: return '⏳ Loading...'
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Connection Status</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span>Supabase:</span>
          <span className={getStatusColor(supabaseStatus)}>
            {getStatusText(supabaseStatus)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Backend API:</span>
          <span className={getStatusColor(backendStatus)}>
            {getStatusText(backendStatus)}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-medium">Errors:</h3>
          <pre className="text-red-600 text-sm mt-1 whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      <button 
        onClick={testConnections}
        className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Test Again
      </button>
    </div>
  )
}
