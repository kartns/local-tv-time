import { NextResponse } from 'next/server';
import { getPopular } from '@/lib/tmdb';

export async function GET() {
  try {
    const data = await getPopular();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get popular error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
