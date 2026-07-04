import { NextRequest, NextResponse } from 'next/server';
import { searchShows } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    
    if (!q) {
      return NextResponse.json({ results: [] });
    }

    const data = await searchShows(q);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
