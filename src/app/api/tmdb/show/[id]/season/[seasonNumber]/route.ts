import { NextRequest, NextResponse } from 'next/server';
import { getSeasonDetails } from '@/lib/tmdb';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; seasonNumber: string }> }
) {
  try {
    const { id, seasonNumber } = await params;
    if (!id || !seasonNumber) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const data = await getSeasonDetails(parseInt(id, 10), parseInt(seasonNumber, 10));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get season details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
