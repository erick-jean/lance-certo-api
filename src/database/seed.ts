import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { HashService } from 'src/common/hash/hash.service';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const hashService = new HashService();

async function main() {
  const count = await prisma.user.count();

  if (count > 0) {
    console.log('Seed ignorado: já existem usuários');
    return;
  }

  const adminPassword = await hashService.hash('123456');
  const userPassword = await hashService.hash('123456');

  await prisma.user.createMany({
    data: [
      {
        name: 'Admin',
        email: 'admin@email.com',
        password: adminPassword,
        role: 'admin',
      },
      {
        name: 'User',
        email: 'user@email.com',
        password: userPassword,
        role: 'user',
      },
    ],
  });

  console.log('Seed executado com sucesso');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
