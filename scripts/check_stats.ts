import 'dotenv/config';
import { prisma } from '../src/lib/db';

async function main() {
  const stats = await prisma.showTracking.groupBy({
    by: ['status'],
    _count: { status: true }
  });
  console.log(stats);
}

main().finally(() => prisma.$disconnect());
