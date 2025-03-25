import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware ensures proper routing by intercepting and handling
// requests that might be causing issues with the router
export function middleware(request: NextRequest) {
  // We don't need any custom middleware logic anymore
  // Just pass all requests through to Next.js routing
  return NextResponse.next();
}

// Disable middleware completely
export const config = {
  matcher: [],
}; 