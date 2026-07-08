import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const showIdStr = req.nextUrl.searchParams.get('tmdbShowId');
    if (!showIdStr) {
      return NextResponse.json({ error: 'tmdbShowId is required' }, { status: 400 });
    }
    const tmdbShowId = parseInt(showIdStr, 10);

    const listItems = await prisma.customListItem.findMany({
      where: {
        tmdbShowId,
        list: { userId: user.userId } // only lists owned by this user
      },
      select: {
        listId: true
      }
    });

    const listIds = listItems.map(item => item.listId);
    return NextResponse.json({ listIds });
  } catch (error) {
    console.error('Error fetching list membership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
