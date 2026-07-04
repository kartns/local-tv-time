import { NextResponse } from 'next/server';
import { getTrending } from '@/lib/tmdb';

export async function GET() {
  try {
    const data = await getTrending('week');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get trending error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
