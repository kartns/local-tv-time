import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import ShowsClient from './ShowsClient';

export default async function ShowsPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const tracked = await prisma.showTracking.findMany({
    where: { userId: user.userId },
    orderBy: { updatedAt: 'desc' }
  });

  return <ShowsClient initialShows={tracked} />;
}
