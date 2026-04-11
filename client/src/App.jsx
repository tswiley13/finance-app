import { supabase } from './supabase'

function App() {
  console.log('supabase client:', supabase)

  return (
    <div>
      <h1>Bravo Six</h1>
      <p>Slate - Personal Finance Dashboard</p>
    </div>
  )
}

export default App