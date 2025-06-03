import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function creaUtente() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const utente = await prisma.utente.create({
    data: {
      nomeUtente: 'admin',
      password: hashedPassword,
    },
  });

  console.log('Utente creato:', utente.nomeUtente);
  await prisma.$disconnect();
}

creaUtente();