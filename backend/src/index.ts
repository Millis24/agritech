// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/clienti', async (req, res) => {
  const clienti = await prisma.cliente.findMany();
  res.json(clienti);
});

app.post('/api/clienti', async (req, res) => {
  const { id, synced, ...data } = req.body;
  try {
    const esiste = await prisma.cliente.findFirst({
      where: { partitaIva: data.partitaIva }
    });
    if (esiste) {
      return res.status(409).json({ error: 'Cliente già esistente' });
    }
    const nuovo = await prisma.cliente.create({ data });
    res.status(201).json(nuovo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nel salvataggio del cliente' });
  }
});

app.get('/api/imballaggi', async (req, res) => {
  const imballaggi = await prisma.imballaggio.findMany();
  res.json(imballaggi);
});

app.post('/api/imballaggi', async (req, res) => {
  const { id, synced, ...data } = req.body;

  try {
    // Evita duplicati basati su tipo + dimensioni + capacità
    const esiste = await prisma.imballaggio.findFirst({
      where: {
        tipo: data.tipo,
        dimensioni: data.dimensioni,
        capacitaKg: data.capacitaKg
      }
    });

    if (esiste) {
      return res.status(409).json({ error: 'Imballaggio già esistente' });
    }

    const nuovo = await prisma.imballaggio.create({ data });
    res.status(201).json(nuovo);
  } catch (error) {
    console.error('❌ Errore salvataggio imballaggio:', error);
    res.status(500).json({ error: 'Errore durante il salvataggio' });
  }
});

app.post('/api/bolle', async (req, res) => {
  try {
    const {
      numero,
      data,
      causale,
      clienteId,
      articoli,
      imballaggiResi
    } = req.body;

    const nuovaBolla = await prisma.bolla.create({
      data: {
        numero,
        data: new Date(data),
        causale,
        clienteId,
        articoli: {
          create: articoli
        },
        imballaggiResi: {
          create: imballaggiResi
        }
      },
      include: {
        articoli: true,
        imballaggiResi: true
      }
    });

    res.status(201).json(nuovaBolla);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nel salvataggio della bolla' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server backend pronto su http://localhost:${PORT}`);
});