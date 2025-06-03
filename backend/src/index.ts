// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// riceve clienti
app.get('/api/clienti', async (req, res) => {
  const clienti = await prisma.cliente.findMany();
  res.json(clienti);
});

// manda clienti
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

// edita clienti
app.put('/api/clienti/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const data = req.body;
  try {
    const cliente = await prisma.cliente.update({
      where: { id },
      data,
    });
    res.json(cliente);
  } catch (error) {
    console.error('Errore nell\'aggiornamento del cliente:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del cliente' });
  }
});

// elimina clienti
app.delete('/api/clienti/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.cliente.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    console.error('Errore nella cancellazione del cliente:', error);
    res.status(500).json({ error: 'Errore nella cancellazione del cliente' });
  }
});

// riceve imballaggi
app.get('/api/imballaggi', async (req, res) => {
  const imballaggi = await prisma.imballaggio.findMany();
  res.json(imballaggi);
});

// manda imballaggi
app.post('/api/imballaggi', async (req, res) => {
  const { id, synced, ...data } = req.body;
  try {
    const nuovo = await prisma.imballaggio.create({
      data: {
        ...data,
        capacitaKg: parseInt(data.capacitaKg)
      }
    });
    res.status(201).json(nuovo);
  } catch (error) {
    console.error('❌ Errore nel salvataggio dell’imballaggio:', error);
    res.status(500).json({ error: 'Errore nel salvataggio dell’imballaggio' });
  }
});

// edita imballaggi
app.put('/api/imballaggi/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const data = req.body;
  try {
    const imballaggio = await prisma.imballaggio.update({
      where: { id },
      data,
    });
    res.json(imballaggio);
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'imballaggio:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'imballaggio' });
  }
});

// elimina imballaggio
app.delete('/api/imballaggi/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.imballaggio.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    console.error('Errore nella cancellazione dell\'imballaggio:', error);
    res.status(500).json({ error: 'Errore nella cancellazione dell\'imballaggio' });
  }
});

// manda bolle
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

// rimane in ascolto del backend
app.listen(PORT, () => {
  console.log(`🚀 Server backend pronto su http://localhost:${PORT}`);
});