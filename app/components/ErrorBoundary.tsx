'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Filter out and suppress solanaActions errors which come from browser extensions
    if (
      error.stack && (
        error.stack.includes('solanaActions') || 
        error.message.includes('MutationObserver') ||
        error.message.includes('observe') ||
        (error.message.includes('Failed to execute') && error.message.includes('is not of type'))
      )
    ) {
      console.warn('Suppressed browser extension error:', error);
      this.setState({ hasError: false, error: null });
      
      // Attempt to patch MutationObserver when this specific error occurs
      try {
        if (typeof window !== 'undefined' && window.MutationObserver) {
          const originalObserve = window.MutationObserver.prototype.observe;
          window.MutationObserver.prototype.observe = function (target, options) {
            if (target) {
              try {
                return originalObserve.call(this, target, options);
              } catch (e) {
                console.warn('Caught and suppressed MutationObserver error');
                return undefined;
              }
            }
            console.warn('Prevented MutationObserver error with null target');
            return undefined;
          };
          console.log('MutationObserver patched by ErrorBoundary');
        }
      } catch (e) {
        console.warn('Could not patch MutationObserver', e);
      }
      
      return;
    }
    
    console.error('Uncaught error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 bg-gray-800 text-white rounded-md shadow-lg max-w-2xl mx-auto my-8">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-gray-300 mb-4">
            We're sorry, but an unexpected error occurred. Our team has been notified.
          </p>
          <div className="bg-gray-900 p-4 rounded-md mb-6 w-full overflow-auto">
            <code className="text-sm text-red-400">{this.state.error?.message}</code>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Try again
            </button>
            <Link 
              href="/"
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            >
              Go Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 