import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('Gucci2025!', 10)

  await prisma.utente.upsert({
    where: { nomeUtente: 'camilla' },
    update: {},
    create: {
      nomeUtente: 'adm_camilla',
      email: 'info@camillacinodesigndev.it',
      password: password,
      superAdmin: true,
    },
  })

  console.log('Super Admin creato o già esistente.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })