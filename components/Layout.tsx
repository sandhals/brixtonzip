import { ReactNode } from 'react'
import Head from 'next/head'
import MainLayout from './MainLayout'
import ArticleLayout from './ArticleLayout'
import { Analytics } from "@vercel/analytics/next"

type LayoutVariant = 'home' | 'article'

interface LayoutProps {
  children: ReactNode
  variant?: LayoutVariant
  title?: string
  description?: string
}

export default function Layout({
  children,
  variant = 'article',
  title = 'brixton.zip',
  description = 'site of brixton.zip – copywriting, language, life in Seoul'
}: LayoutProps) {
  const sharedHead = (
    <Head>
      <title>{title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charSet="UTF-8" />
      <meta name="description" content={description} />
      <link rel="stylesheet" href="/style.css" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet" />

        <link
        rel="preload"
        as="font"
        href="/fonts/apple-garamond/AppleGaramond-Light.ttf"
        type="font/ttf"
        crossOrigin="anonymous"
        />
        <link
        rel="preload"
        as="font"
        href="/fonts/apple-garamond/AppleGaramond-LightItalic.ttf"
        type="font/ttf"
        crossOrigin="anonymous"
        />
        
        <link
        rel="preload"
        as="font"
        href="/fonts/ocr/OCRAStd.otf"
        type="font/ttf"
        crossOrigin="anonymous"
        />


      <script async src="https://www.googletagmanager.com/gtag/js?id=G-WW9W8X84EF"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WW9W8X84EF');
          `
        }}
      />
    </Head>
  )

  if (variant === 'home') {
    return (
      <>
        {sharedHead}
        <MainLayout>{children}</MainLayout>
      </>
    )
  }

  return (
    <>
      {sharedHead}
      <ArticleLayout>{children}</ArticleLayout>
    </>
  )
}
