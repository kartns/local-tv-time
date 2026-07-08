import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lists = await prisma.customList.findMany({
      where: { userId: user.userId },
      include: {
        _count: { select: { items: true } },
        items: {
          take: 4, // Get up to 4 items for thumbnail previews
          orderBy: { addedAt: 'desc' },
          select: { posterPath: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 });
    }

    const list = await prisma.customList.create({
      data: {
        userId: user.userId,
        name: name.trim(),
      },
    });

    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Error creating list:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A list with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
