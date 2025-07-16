import { useEffect } from 'react'

interface HeaderProps {
  variant?: 'home' | 'article'
}

export default function Header({ variant = 'article' }: HeaderProps) {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '/script.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const homeCopy = `IT'S `
  const articleCopy = `IT'S CURRENTLY `

  return (
<div className="header">
  <div className="status-marquee-box">
    <div className="status-marquee">
      {variant === 'home' ? homeCopy : articleCopy}
      <span id="currentWeekday"></span>
      <span id="currentTime"></span>
      {variant === 'home' ? 'IN SEOUL, SO I’M PROBABLY' : 'IN SEOUL ON A '}
      <span id="myStatus"></span>
      RIGHT NOW
    </div>
  </div>
</div>

  )
}
