// backend/src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.utente

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = 'segreto_super_sicuro';

app.use(cors());
app.use(express.json());

// Middleware autenticazione JWT
function verificaToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token mancante' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    (req as any).user = payload;
    next();
  } catch {
    return res.status(403).json({ error: 'Token non valido' });
  }
}

// REGISTRAZIONE UTENTE
app.post('/api/register', async (req: Request, res: Response) => {
  const { nomeUtente, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const nuovo = await prisma.utente.create({
      data: { nomeUtente, password: hashed }
    });
    res.status(201).json({ id: nuovo.id, nomeUtente: nuovo.nomeUtente });
  } catch (error) {
    console.error('Errore registrazione:', error);
    res.status(500).json({ error: 'Errore nella registrazione' });
  }
});

// LOGIN
app.post('/api/login', async (req: Request, res: Response) => {
  const { nomeUtente, password } = req.body;
  try {
    const user = await prisma.utente.findUnique({ where: { nomeUtente } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({ error: 'Errore interno' });
  }
});

// --- CLIENTI ---
app.get('/api/clienti', /* verificaToken, */ async (req: Request, res: Response) => {
  const clienti = await prisma.cliente.findMany();
  res.json(clienti);
});

app.post('/api/clienti', async (req: Request, res: Response) => {
  const { id, synced, ...data } = req.body;
  try {
    const esiste = await prisma.cliente.findFirst({ where: { partitaIva: data.partitaIva } });
    if (esiste) return res.status(409).json({ error: 'Cliente già esistente' });

    const nuovo = await prisma.cliente.create({ data });
    res.status(201).json(nuovo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nel salvataggio del cliente' });
  }
});

app.put('/api/clienti/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const cliente = await prisma.cliente.update({ where: { id }, data: req.body });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento del cliente' });
  }
});

app.delete('/api/clienti/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.cliente.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Errore nella cancellazione del cliente' });
  }
});

// --- IMBALLAGGI ---
app.get('/api/imballaggi', async (req: Request, res: Response) => {
  const imballaggi = await prisma.imballaggio.findMany();
  res.json(imballaggi);
});

app.post('/api/imballaggi', async (req: Request, res: Response) => {
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
    res.status(500).json({ error: 'Errore nel salvataggio dell’imballaggio' });
  }
});

app.put('/api/imballaggi/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const imballaggio = await prisma.imballaggio.update({ where: { id }, data: req.body });
    res.json(imballaggio);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'imballaggio' });
  }
});

app.delete('/api/imballaggi/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.imballaggio.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Errore nella cancellazione dell\'imballaggio' });
  }
});

// --- BOLLE ---
app.post('/api/bolle', async (req: Request, res: Response) => {
  try {
    const { numero, data, causale, clienteId, articoli, imballaggiResi } = req.body;

    const nuovaBolla = await prisma.bolla.create({
      data: {
        numero,
        data: new Date(data),
        causale,
        clienteId,
        articoli: { create: articoli },
        imballaggiResi: { create: imballaggiResi }
      },
      include: { articoli: true, imballaggiResi: true }
    });

    res.status(201).json(nuovaBolla);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel salvataggio della bolla' });
  }
});

// --- AVVIO SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server backend pronto su http://localhost:${PORT}`);
});