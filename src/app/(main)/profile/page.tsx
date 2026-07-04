import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserStats } from '@/lib/stats';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const stats = await getUserStats(user.userId);

  return <ProfileClient stats={stats} />;
}
