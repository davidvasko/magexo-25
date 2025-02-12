import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from './components/Header'
import Footer from './components/Footer'
import Providers from './components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Magexo Shopify Store',
  description: 'Your trusted partner in e-commerce solutions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/magexo_icon.png" />
      </head>
      <body className="flex flex-col min-h-screen bg-white">
        <Providers>
          <Header />
          <main className="flex-grow py-8">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
