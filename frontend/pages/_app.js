import '../src/app/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>CodeCraft AI | Create React Components with AI</title>
        <meta name="description" content="Create beautiful React components with AI. CodeCraft AI helps developers build components using natural language prompts." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  )
} 