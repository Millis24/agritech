import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = 'segreto_super_sicuro';

app.use(cors());
app.use(express.json());

// middleware per autenticazione
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

// -------------------- LOGIN - AUTENTICAZIONE --------------------

app.post('/api/register', async (req: Request, res: Response) => {
  const { nomeUtente, password } = req.body;
  try {
    const esistente = await prisma.utente.findUnique({ where: { nomeUtente } });
    if (esistente) return res.status(409).json({ error: 'Utente già registrato' });

    const hashed = await bcrypt.hash(password, 10);
    const nuovo = await prisma.utente.create({ data: { nomeUtente, password: hashed } });
    res.status(201).json({ id: nuovo.id, nomeUtente: nuovo.nomeUtente });
  } catch (error) {
    console.error('❌ Errore registrazione:', error);
    res.status(500).json({ error: 'Errore nella registrazione' });
  }
});

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
    console.error('❌ Errore login:', error);
    res.status(500).json({ error: 'Errore interno' });
  }
});

// -------------------- CLIENTI --------------------

app.get('/api/clienti', async (req, res) => {
  try {
    const clienti = await prisma.cliente.findMany();
    res.json(clienti);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel caricamento dei clienti' });
  }
});

app.post('/api/clienti', async (req, res) => {
  console.log('📦 POST /clienti body:', req.body);
  const { id, synced, ...data } = req.body;
  try {
    // verifica duplicati
    const esiste = await prisma.cliente.findFirst({ 
      where: { 
        partitaIva: data.partitaIva 
      } });
    if (esiste) {
      return res.status(409).json({ error: 'Cliente già esistente con questa Partita IVA' });
    }
  
    const nuovo = await prisma.cliente.create({ 
      data: {
        ...data
      }
    });
    res.status(201).json(nuovo);
  } catch (error) {
    console.error('❌ Errore POST clienti:', error);
    res.status(500).json({ error: 'Errore nel salvataggio del cliente' });
  }
});

app.put('/api/clienti/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const clienteAggiornato = await prisma.cliente.update({ 
      where: { id }, 
      data: req.body 
    });
    res.json(clienteAggiornato);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento del cliente' });
  }
});

app.delete('/api/clienti/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.cliente.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Errore nella cancellazione del cliente' });
  }
});

// -------------------- IMBALLAGGI --------------------
app.get('/api/imballaggi', async (req, res) => {
  try {
    const imballaggi = await prisma.imballaggio.findMany();
    res.json(imballaggi);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel caricamento degli imballaggi' });
  }
});

app.post('/api/imballaggi', async (req, res) => {
  console.log('📦 POST /imballaggi body:', req.body);
  const { id, synced, ...data } = req.body;
  try {
    // verifica duplicati
    const esiste = await prisma.imballaggio.findFirst({
      where: {
        prezzo: parseFloat(data.prezzo),
        tipo: data.tipo,
        dimensioni: data.dimensioni,
        capacitaKg: parseFloat(data.capacitaKg)
      }
    });
    if (esiste) {
      return res.status(409).json({ error: 'Imballaggio già esistente' });
    }

    const nuovo = await prisma.imballaggio.create({
      data: {
        ...data,
        prezzo: parseFloat(data.prezzo),
        capacitaKg: parseFloat(data.capacitaKg)
      }
    });
    res.status(201).json(nuovo);
  } catch (error) {
    console.error('❌ Errore POST imballaggi:', error);
    res.status(500).json({ error: 'Errore nel salvataggio dell’imballaggio' });
  }
});

app.put('/api/imballaggi/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { prezzo, ...resto } = req.body;

    const imballaggioAggiornato = await prisma.imballaggio.update({
      where: { id },
      data: {
        ...resto,
        prezzo: parseFloat(prezzo)
      }
    });

    res.json(imballaggioAggiornato);
  } catch (error) {
    console.error('❌ Errore PUT imballaggio:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'imballaggio' });
  }
});

app.delete('/api/imballaggi/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.imballaggio.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Errore nella cancellazione dell\'imballaggio' });
  }
});

// -------------------- PRODOTTI --------------------
app.get('/api/prodotti', async (req, res) => {
  try{
    const prodotti = await prisma.prodotto.findMany();
    res.json(prodotti);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel caricamento degi prodotti' });
  }
});

app.post('/api/prodotti', async (req, res) => {
  console.log('📦 POST /prodotti body:', req.body);
  const { id, synced, ...data } = req.body;
  try {
      // verifica duplicati
    const esiste = await prisma.prodotto.findFirst({ 
      where: {
        nome: data.nome,
        varieta: data.varieta,
        calibro: data.calibro,
        colore: data.colore
      }
    });
    if (esiste) {
      return res.status(409).json({ error: 'Prodotto già esistente' });
    }

    const nuovo = await prisma.prodotto.create({
      data
    });
    res.status(201).json(nuovo);
  } catch (error) {
    console.error('❌ Errore POST Prodotti:', error);
    res.status(500).json({ error: 'Errore nel salvataggio del prodotto' });
  }
});

app.put('/api/prodotti/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const prodottoAggiornato = await prisma.prodotto.update({ 
      where: { id }, 
      data: req.body 
    });
    res.json(prodottoAggiornato);
  } catch (error) {
    res.status(500).json({ error: 'Errore aggiornamento prodotto' });
  }
});

app.delete('/api/prodotti/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.prodotto.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Errore eliminazione prodotto' });
  }
});

// -------------------- BOLLE --------------------
app.get('/api/bolle', async (req, res) => {
  try {
    const bolle = await prisma.bolla.findMany({
      include: {
        articoli: true,
        imballaggiResi: true
      }
    });
    res.json(bolle);
  } catch (error) {
    console.error('Errore nel recupero bolle:', error);
    res.status(500).json({ error: 'Errore nel recupero bolle' });
  }
});

app.post('/api/bolle', async (req, res) => {
  console.log('📦 POST /bolle body:', req.body);

  try {
    const {
      id,
      synced,
      modifiedOffline,
      dataOra,
      createdAt,
      ...rest
    } = req.body;

    // converte i campi Date
    const data = {
      ...rest,
      dataOra: new Date(dataOra),
      createdAt: new Date(createdAt)
    };

    // verifica duplicati usando solo numeroBolla (che è unique)
    const esiste = await prisma.bolla.findUnique({
      where: { numeroBolla: data.numeroBolla }
    });
    if (esiste) {
      return res.status(409).json({ error: 'Bolla già esistente' });
    }

    const nuova = await prisma.bolla.create({ data });
    res.status(201).json(nuova);
  } catch (error) {
    console.error('❌ Errore POST bolle:', error);
    res.status(500).json({ error: 'Errore nel salvataggio della bolla' });
  }
});

app.put('/api/bolle/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Logging per debug
    console.log('➡️ Update richiesta per ID:', id, '\nBody:', req.body);
    const {
      dataOra,
      destinatarioNome,
      destinatarioIndirizzo,
      destinatarioEmail,
      destinatarioTelefono,
      destinatarioPartitaIva,
      destinatarioCodiceSDI,
      indirizzoDestinazione,
      causale,
      prodotti,
      daTrasportare,
      daRendere,
      consegnaACarico,
      vettore
    } = req.body;

    const updated = await prisma.bolla.update({
      where: { id },
      data: {
        dataOra: new Date(dataOra),
        destinatarioNome,
        destinatarioIndirizzo,
        destinatarioEmail,
        destinatarioTelefono,
        destinatarioPartitaIva,
        destinatarioCodiceSDI,
        indirizzoDestinazione,
        causale,
        prodotti,
        daTrasportare,
        daRendere,
        consegnaACarico,
        vettore
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Errore aggiornamento bolla:', error);
    res.status(500).json({ error: 'Errore aggiornamento bolla' });
  }
});

app.delete('/api/bolle/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID non valido' });

  try {
    // Elimina entità collegate
    await prisma.articolo.deleteMany({ where: { bollaId: id } });
    await prisma.imballaggioReso.deleteMany({ where: { bollaId: id } });

    // Poi elimina la bolla
    await prisma.bolla.delete({ where: { id } });

    res.status(200).json({ message: 'Bolla eliminata con successo' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      console.warn(`⚠️ Tentata eliminazione bolla ID ${id}, ma non esiste più`);
      return res.status(404).json({ error: 'La bolla non esiste già più' });
    }

    console.error('❌ Errore DELETE bolla:', err);
    res.status(500).json({ error: 'Errore durante l\'eliminazione' });
  }
});

// -------------------- AVVIO SERVER --------------------

app.listen(PORT, () => {
  console.log(`🚀 Server backend attivo su http://localhost:${PORT}`);
});