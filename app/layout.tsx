import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bachelor Party Casino Tracker',
  description: 'Track bets, settle scores, and crown champions',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-800 min-h-screen`}>
        <main className="pt-6 px-4 md:px-6 max-w-7xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
