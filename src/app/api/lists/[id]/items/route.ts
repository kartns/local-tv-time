import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const listId = parseInt(id, 10);
    if (isNaN(listId)) {
      return NextResponse.json({ error: 'Invalid list ID' }, { status: 400 });
    }

    const { tmdbShowId, showName, posterPath } = await req.json();
    if (!tmdbShowId) {
      return NextResponse.json({ error: 'tmdbShowId is required' }, { status: 400 });
    }

    // Verify ownership
    const list = await prisma.customList.findFirst({
      where: { id: listId, userId: user.userId },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Add item
    const item = await prisma.customListItem.create({
      data: {
        listId,
        tmdbShowId,
        showName: showName || '',
        posterPath,
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error adding item to list:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Show is already in this list' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const listId = parseInt(id, 10);
    if (isNaN(listId)) {
      return NextResponse.json({ error: 'Invalid list ID' }, { status: 400 });
    }

    const tmdbShowIdStr = req.nextUrl.searchParams.get('tmdbShowId');
    if (!tmdbShowIdStr) {
      return NextResponse.json({ error: 'tmdbShowId is required' }, { status: 400 });
    }
    const tmdbShowId = parseInt(tmdbShowIdStr, 10);

    // Verify ownership
    const list = await prisma.customList.findFirst({
      where: { id: listId, userId: user.userId },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Remove item
    await prisma.customListItem.deleteMany({
      where: {
        listId,
        tmdbShowId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing item from list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
