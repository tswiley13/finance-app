import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import AuthPage from './components/Auth'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { 
      setSession(session)
  })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (!session) {
    return <AuthPage />
  }

  return (
    <div>
      <h1>Welcome to Slate</h1>
      <p>You are logged in.</p>
      <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
    </div>
  )
}

export default App