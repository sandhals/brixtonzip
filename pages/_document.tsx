import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)t='dark';t=t||'light';document.documentElement.setAttribute('data-theme',t);if(t!=='warm')document.body.classList.add('sunlit-hidden');if(t==='dark')document.body.classList.add('sunlit-dark');}catch(e){}})();`
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
