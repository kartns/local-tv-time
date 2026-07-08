import 'dotenv/config';
import { prisma } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  const username = process.argv[2];
  const newPassword = process.argv[3];
  if (!username || !newPassword) {
    console.error('Usage: npx tsx scripts/fix_password.ts <username> <new_password>');
    process.exit(1);
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { username },
    data: { passwordHash: hash }
  });
  console.log(`Password updated successfully for user "${username}"!`);
}

main().finally(() => prisma.$disconnect());
