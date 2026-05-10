import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('johndoe123', 12)
  const starterCredits = parseInt(process.env.STARTER_CREDITS ?? '20', 10)

  const user = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      passwordHash,
      name: 'John Doe',
      creditBalance: starterCredits,
      starterCreditsGranted: true,
    },
  })

  // Create starter credit transaction
  const existingTx = await prisma.creditTransaction.findFirst({
    where: { userId: user.id, type: 'grant' },
  })
  if (!existingTx) {
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        type: 'grant',
        amount: starterCredits,
        balanceAfter: starterCredits,
        operationType: 'starter_grant',
        metadata: { reason: 'New account starter credits' },
      },
    })
  }

  console.log('Seed completed successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
