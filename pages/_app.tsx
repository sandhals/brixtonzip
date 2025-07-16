import "@/styles/globals.css";
import type { AppProps } from "next/app";
import '../styles/archive.css'; // adjust path if needed


export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
