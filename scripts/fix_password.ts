import 'dotenv/config';
import { prisma } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  const hash = await bcrypt.hash('NEW_PASSWORD_HERE', 10);
  await prisma.user.update({
    where: { username: 'USERNAME_HERE' },
    data: { passwordHash: hash }
  });
  console.log('Password updated successfully to NEW_PASSWORD_HERE!');
}

main().finally(() => prisma.$disconnect());
