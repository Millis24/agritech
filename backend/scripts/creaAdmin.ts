import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const nomeUtente = 'admin';
  const plainPassword = 'password123';

  const esiste = await prisma.utente.findUnique({ where: { nomeUtente } });
  if (esiste) {
    console.log('⚠️ Utente già esistente');
    return;
  }

  const hashed = await bcrypt.hash(plainPassword, 10);
  const utente = await prisma.utente.create({
    data: { nomeUtente, password: hashed }
  });

  console.log(`✅ Utente creato: ${utente.nomeUtente}`);
}

main().catch((e) => {
  console.error(e);
}).finally(() => {
  prisma.$disconnect();
});