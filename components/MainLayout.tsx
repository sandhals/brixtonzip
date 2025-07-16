import { ReactNode, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'

interface Props {
  children: ReactNode
}

export default function MainLayout({ children }: Props) {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '/script.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="container">
      <Header variant="home" />
      <div className="content">
        {children}
      </div>
      <div className="sourcecode" id="sourceCodeContainer"></div>
      <Footer />
    </div>
  )
}
