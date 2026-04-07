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
      {!isUnzip && <DappledLight />}
      {!isUnzip && <ThemeToggle />}
      <Component {...pageProps} />
    </>
  );
}
