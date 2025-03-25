import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

// Client-side only imports
const ErrorBoundary = dynamic(() => import('./components/ErrorBoundary'), { ssr: false });
const AppNavigation = dynamic(() => import('./components/AppNavigation'), { ssr: false });

// Client-side browser patches
const BrowserPatchesScript = () => (
  <Script 
    id="browser-patches" 
    strategy="beforeInteractive"
    dangerouslySetInnerHTML={{
      __html: `
        // Immediately-invoked function to patch browser APIs
        (function() {
          try {
            if (typeof window !== 'undefined' && window.MutationObserver) {
              const originalObserve = window.MutationObserver.prototype.observe;
              
              window.MutationObserver.prototype.observe = function(target, options) {
                // Handle null or undefined targets
                if (!target) {
                  console.warn('Prevented MutationObserver error with null target');
                  return undefined;
                }
                
                // Check if target is a valid Node
                try {
                  if (!(target instanceof Node)) {
                    console.warn('Prevented MutationObserver error with invalid target type');
                    return undefined;
                  }
                } catch (e) {
                  console.warn('Error checking target type', e);
                  return undefined;
                }
                
                try {
                  return originalObserve.call(this, target, options);
                } catch (error) {
                  console.warn('Caught and suppressed MutationObserver error');
                  return undefined;
                }
              };
              
              console.debug('MutationObserver patched successfully');
            }
          } catch (error) {
            console.warn('Could not patch MutationObserver:', error);
          }
        })();
      `
    }}
  />
);

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
      <head>
        <BrowserPatchesScript />
      </head>
      <body className={`${inter.className} bg-white text-gray-800 min-h-screen`}>
        <ErrorBoundary>
          <AppNavigation />
          <main className="pt-6 px-4 md:px-6 max-w-7xl mx-auto">
            {children}
          </main>
        </ErrorBoundary>
      </body>
    </html>
  );
}
