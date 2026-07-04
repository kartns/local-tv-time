import { NextResponse } from 'next/server';
import { getGenres } from '@/lib/tmdb';

export async function GET() {
  try {
    const data = await getGenres();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get genres error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
