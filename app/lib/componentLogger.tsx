'use client';

/**
 * Component Logger - Utility to track component loading and rendering
 * 
 * Usage: 
 * 1. Import this in your component: import { logComponent } from '@/lib/componentLogger';
 * 2. Add at top of component: logComponent('YourComponentName');
 */

import { useEffect } from 'react';

// Collection to track components that have been logged
const loadedComponents = new Set<string>();

// Safe check for browser environment
const isBrowser = typeof window !== 'undefined';

// Log component loading on the client
export function logComponent(componentName: string, props?: any) {
  // Skip in production unless debugging is enabled
  if (!isBrowser) return;
  
  if (process.env.NODE_ENV === 'production' && !window.location.search.includes('debug=true')) {
    return;
  }

  // Log only on client side
  if (!loadedComponents.has(componentName)) {
    console.log(`🧩 Component loaded: ${componentName}`, props ? { props } : '');
    loadedComponents.add(componentName);
  }
}

// Hook to track component lifecycle
export function useComponentLogger(componentName: string, props?: any) {
  useEffect(() => {
    // Skip if not in browser or in production without debug flag
    if (!isBrowser) return;
    
    if (process.env.NODE_ENV === 'production' && !window.location.search.includes('debug=true')) {
      return;
    }
    
    console.log(`🔄 Component mounted: ${componentName}`, props ? { props } : '');
    
    return () => {
      console.log(`🚫 Component unmounted: ${componentName}`);
    };
  }, [componentName, props]);
}

// Error boundary specifically for logging component errors
export function withErrorLogging(Component: React.ComponentType<any>) {
  return function WithErrorLogging(props: any) {
    try {
      return <Component {...props} />;
    } catch (error) {
      // Only log errors in browser
      if (isBrowser) {
        console.error(`💥 Error rendering component:`, error);
      }
      return <div className="p-4 bg-red-100 text-red-800 rounded">Component Error: See console for details</div>;
    }
  };
} 