import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function SourceBleed() {
  const router = useRouter()
  const [source, setSource] = useState('')

  useEffect(() => {
    const pagePath = router.pathname === '/' ? 'index' : router.pathname.slice(1)

    fetch(`/api/source?page=${encodeURIComponent(pagePath)}`)
      .then(res => {
        if (res.ok) return res.text()
        // Fallback to GitHub raw
        const encoded = router.pathname === '/' ? '/index' : router.pathname.replace(/\[/g, '%5B').replace(/\]/g, '%5D')
        return fetch(`https://raw.githubusercontent.com/sandhals/brixtonzip/main/pages${encoded}.tsx`)
          .then(r => r.ok ? r.text() : '')
      })
      .then(code => setSource(code))
      .catch(() => {})
  }, [router.pathname])

  return <div className="sourcecode">{source}</div>
}
