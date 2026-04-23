import { useEffect, useState, ReactElement } from 'react'

type Theme = 'light' | 'dark' | 'warm'

const nextTheme: Record<Theme, Theme> = {
  light: 'warm',
  warm: 'dark',
  dark: 'light',
}

const nextLabel: Record<Theme, string> = {
  light: 'warm mode',
  warm: 'dark mode',
  dark: 'light mode',
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
    </svg>
  )
}

function SunHorizonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <line x1="2" y1="16" x2="22" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 16 A7 7 0 0 1 19 16" fill="currentColor" />
      <line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="3.5" y1="5.5" x2="5.5" y2="7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="20.5" y1="5.5" x2="18.5" y2="7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="5" fill="currentColor" />
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const icons: Record<Theme, ReactElement> = {
  light: <SunIcon />,
  dark: <MoonIcon />,
  warm: <SunHorizonIcon />,
}

function setSunlitInitial(t: Theme) {
  const b = document.body
  b.classList.remove('sunlit-dark', 'sunlit-warm', 'sunlit-hidden')
  if (t === 'dark') b.classList.add('sunlit-dark', 'sunlit-hidden')
  else if (t === 'warm') b.classList.add('sunlit-warm')
  else b.classList.add('sunlit-hidden')
}

export default function ThemeToggle({ inline = false }: { inline?: boolean }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    let initial: Theme = 'light'
    if (stored && ['light', 'dark', 'warm'].includes(stored)) {
      initial = stored
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      initial = 'dark'
    }
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
    // Suppress transitions on first paint so dark/light loads without animation
    document.body.classList.add('sunlit-notransition')
    setSunlitInitial(initial)
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.body.classList.remove('sunlit-notransition')
      )
    )
    setMounted(true)
  }, [])

  const toggle = () => {
    const next = nextTheme[theme]
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)

    const b = document.body

    if (theme === 'warm' && next === 'dark') {
      // Close shutters, then fade overlay out
      b.classList.remove('sunlit-warm', 'sunlit-hidden')
      b.classList.add('sunlit-dark')
      setTimeout(() => b.classList.add('sunlit-hidden'), 1800)

    } else if (next === 'warm') {
      // Snap shutters to closed (no transition), fade overlay in,
      // then animate shutters open once overlay is partially visible
      b.classList.remove('sunlit-dark', 'sunlit-hidden')
      b.classList.add('sunlit-warm', 'sunlit-shutters-closed', 'sunlit-shutters-notransition')
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          b.classList.remove('sunlit-shutters-notransition')
          setTimeout(() => b.classList.remove('sunlit-shutters-closed'), 350)
        })
      )

    } else {
      // dark ↔ light: no sunlit animation, keep overlay hidden
      b.classList.toggle('sunlit-dark', next === 'dark')
      b.classList.remove('sunlit-warm')
      b.classList.add('sunlit-hidden')
    }
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      className={inline ? 'theme-toggle theme-toggle--inline' : 'theme-toggle'}
      aria-label={`Switch to ${nextLabel[theme]}`}
      title={`Switch to ${nextLabel[theme]}`}
      style={inline ? { color: 'rgba(247,247,247,0.7)' } : undefined}
    >
      {icons[theme]}
      <style jsx>{`
        .theme-toggle {
          position: fixed;
          top: 0.65rem;
          right: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--black);
          opacity: 0.4;
          padding: 0.3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 200ms;
          line-height: 0;
          z-index: 10;
        }
        .theme-toggle:hover {
          opacity: 1;
        }
        /* Inline variant: used inside the marquee bar on mobile.
           Bar is always dark so icon needs a fixed light color regardless of theme. */
        .theme-toggle--inline {
          position: static;
          color: rgba(247, 247, 247, 0.7) !important;
          opacity: 1;
          padding: 0;
        }
        .theme-toggle--inline:hover {
          color: rgba(247, 247, 247, 1) !important;
          opacity: 1;
        }
        @media (max-width: 640px) {
          /* Hide the fixed toggle on mobile — marquee slot takes over */
          .theme-toggle:not(.theme-toggle--inline) {
            display: none;
          }
        }
      `}</style>
    </button>
  )
}
