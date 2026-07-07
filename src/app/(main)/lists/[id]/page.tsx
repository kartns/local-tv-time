import ListClient from './ListClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Custom List | Local TV Time',
  description: 'View custom list of tracked shows.',
};

export default async function ListPage({ params }: { params: { id: string } }) {
  // Await the params object before using its properties
  const { id } = await params;
  return <ListClient listId={id} />;
}
