import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

function App() {
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('Conectando...')

  // Sessão do usuário
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // Realtime (Supabase v2 - CORRETO)
  useEffect(() => {
    const channel = supabase
      .channel('rides-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
        },
        payload => {
          console.log('Mudança em rides:', payload)
          setStatus('Atualização em tempo real recebida')
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>🚗 Já Vai - App Online</h1>

      <p>Status: <strong>{status}</strong></p>

      {session ? (
        <>
          <p>✅ Usuário logado:</p>
          <pre>{JSON.stringify(session.user.email, null, 2)}</pre>

          <button
            onClick={async () => {
              await supabase.auth.signOut()
            }}
          >
            Sair
          </button>
        </>
      ) : (
        <>
          <p>❌ Não logado</p>
          <button
            onClick={async () => {
              await supabase.auth.signInWithPassword({
                email: 'teste@teste.com',
                password: '123456',
              })
            }}
          >
            Login de teste
          </button>
        </>
      )}
    </div>
  )
}

export default App


