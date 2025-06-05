// backend/scripts/resetProdotti.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function reset() {
  try {
    await prisma.prodotto.deleteMany();
    console.log('✔️ Tutti i prodotti sono stati eliminati');
  } catch (e) {
    console.error('❌ Errore durante la cancellazione:', e);
  } finally {
    await prisma.$disconnect();
  }
}

reset();