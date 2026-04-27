import "@/styles/globals.css";
import type { AppProps } from "next/app";
import '../styles/archive.css';
import { useRouter } from 'next/router';
import DappledLight from '@/components/DappledLight';
import ThemeToggle from '@/components/ThemeToggle';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isUnzip = router.pathname === '/unzip';

  return (
    <>
      {/* SVG filter for warm-mode image toning: maps black→rgb(38,31,18), white→white */}
      <svg style={{ display: 'none' }} aria-hidden="true">
        <defs>
          <filter id="warm-tone-filter" colorInterpolationFilters="sRGB">
            {/* Step 1: grayscale via luminance weights */}
            <feColorMatrix type="matrix" values="
              0.2126 0.7152 0.0722 0 0
              0.2126 0.7152 0.0722 0 0
              0.2126 0.7152 0.0722 0 0
              0      0      0      1 0
            " result="gray"/>
            {/* Step 2: remap [0→1] to [rgb(38,31,18) → rgb(245,238,217)]
                output = L * (white - black) + black per channel
                R: L*0.812 + 0.149   G: L*0.811 + 0.122   B: L*0.780 + 0.071 */}
            <feColorMatrix in="gray" type="matrix" values="
              0.812 0     0     0 0.149
              0     0.811 0     0 0.122
              0     0     0.780 0 0.071
              0     0     0     1 0
            "/>
          </filter>
        </defs>
      </svg>
      {!isUnzip && <DappledLight />}
      {!isUnzip && <ThemeToggle />}
      <Component {...pageProps} />
    </>
  );
}
