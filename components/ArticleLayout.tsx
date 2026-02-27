import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import SourceBleed from './SourceBleed'

interface Props {
  children: ReactNode
}

export default function ArticleLayout({ children }: Props) {
  return (
    <div className="container">
      <Header variant="article" />
      <div className="content">
        {children}
      </div>
      <SourceBleed />
      <Footer />
    </div>
  )
}
