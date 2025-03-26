export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
} 