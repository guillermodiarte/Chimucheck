
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@chimucheck.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    console.log(`User ${email} found. Updating password...`);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    console.log('Password updated.');
  } else {
    console.log(`User ${email} not found. Creating...`);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
      },
    });
    console.log('Admin user created.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
