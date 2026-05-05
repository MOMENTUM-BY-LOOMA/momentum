import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function InitialLoading() {
  const navigate = useNavigate()
  const timeoutRef = useRef<number | null>(null)
  const navigatingRef = useRef(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // Decidir ruta según si hay token
    const token = localStorage.getItem('authToken')
    const targetRoute = token ? '/inicio' : '/login'

    // auto-advance after 6 seconds
    timeoutRef.current = window.setTimeout(() => handleAdvance(targetRoute), 6000)

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleAdvance(targetRoute: string) {
    if (navigatingRef.current) return
    navigatingRef.current = true

    // add a small exit animation before navigating
    setExiting(true)
    // wait for animation (300ms) then navigate
    setTimeout(() => navigate(targetRoute), 300)
  }

  return (
    <section
      className={`onboarding-screen onboarding-screen--splash ${exiting ? 'fade-out' : ''}`}
      aria-label="Pantalla de carga inicial"
      onClick={() => {
        const token = localStorage.getItem('authToken')
        const targetRoute = token ? '/inicio' : '/login'
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
        handleAdvance(targetRoute)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const token = localStorage.getItem('authToken')
          const targetRoute = token ? '/inicio' : '/login'
          if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
          handleAdvance(targetRoute)
        }
      }}
    >
      <img className="onboarding-screen__splash-logo" src="/img/logo_momentum.png" alt="Momentum" />
    </section>
  )
}

export default InitialLoading