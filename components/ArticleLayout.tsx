import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'

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
      <Footer />
    </div>
  )
}
