import '../styles/globals.css'
import { useEffect, useState } from 'react'

export default function App({ Component, pageProps }) {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    try {
      const storedTheme = typeof window !== 'undefined' && localStorage.getItem('theme')
      if (storedTheme === 'light' || storedTheme === 'dark') setTheme(storedTheme)
    } catch (e) {}
  }, [])

  useEffect(() => {
    try {
      const html = document.documentElement
      if (theme === 'light') html.classList.add('theme-light')
      else html.classList.remove('theme-light')
      localStorage.setItem('theme', theme)
    } catch (e) {}
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 10, gap: 8 }}>
        <button className="btn" onClick={toggleTheme}>
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
      <Component {...pageProps} />
    </>
  )
}
