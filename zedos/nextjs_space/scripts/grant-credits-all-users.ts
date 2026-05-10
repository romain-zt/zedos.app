import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting credit grant process...');

  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users`);

  if (users.length === 0) {
    console.log('No users to grant credits to.');
    return;
  }

  const GRANT_AMOUNT = 1000;
  let successCount = 0;
  let errorCount = 0;

  for (const user of users) {
    try {
      const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            creditBalance: user.creditBalance + GRANT_AMOUNT,
          },
        }),
        prisma.creditTransaction.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            type: 'grant',
            amount: GRANT_AMOUNT,
            balanceAfter: user.creditBalance + GRANT_AMOUNT,
            createdAt: new Date(),
          },
        } as any),
      ]);

      console.log(`✓ ${user.email}: ${user.creditBalance} → ${updatedUser.creditBalance}`);
      successCount++;
    } catch (error: any) {
      console.error(`✗ ${user.email}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\nCompleted: ${successCount} users credited, ${errorCount} errors`);
  console.log(`Total credits distributed: ${successCount * GRANT_AMOUNT}`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
