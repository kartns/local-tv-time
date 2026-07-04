import { NextRequest, NextResponse } from 'next/server';
import { discoverByGenre } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const genreId = searchParams.get('genre');
    
    if (!genreId) {
      return NextResponse.json({ error: 'Missing genre param' }, { status: 400 });
    }

    const data = await discoverByGenre(parseInt(genreId, 10));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Discover error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
