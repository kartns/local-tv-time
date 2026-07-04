import { NextRequest, NextResponse } from 'next/server';
import { getShowDetails } from '@/lib/tmdb';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const data = await getShowDetails(parseInt(id, 10));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get show details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
