import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();


const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'segreto_super_sicuro';

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

app.post('/api/login', async (req, res) => {
  const { nomeUtente, password } = req.body;
  const user = await prisma.utente.findUnique({ where: { nomeUtente } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Credenziali non valide' });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
  return res.json({ token });
});


// -------------------- UTENTE - PAGINA IMPOSTAZIONI --------------------

// GET /api/user/profile
app.get('/api/user/profile', verificaToken, async (req, res) => {
  const userId = (req as any).user.userId;
  const utente = await prisma.utente.findUnique({ where: { id: userId } });
  if (!utente) return res.status(404).json({ error: 'Utente non trovato' });
  // Includi nomeUtente oltre agli altri campi
  res.json({
    nomeUtente: utente.nomeUtente,
    email:      utente.email,
  });
});

// PUT /api/user/profile
app.put('/api/user/profile', verificaToken, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { nomeUtente, email } = req.body;
  try {
    await prisma.utente.update({
      where: { id: userId },
      data: { nomeUtente, email },
    });
    res.sendStatus(200);
  } catch {
    res.status(500).json({ error: 'Errore aggiornamento profilo' });
  }
});

// POST /api/user/change-password
app.post('/api/user/change-password', verificaToken, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { oldPassword, newPassword } = req.body;
  const utente = await prisma.utente.findUnique({ where: { id: userId } });
  if (!utente) return res.status(404).json({ error: 'Utente non trovato' });
  const match = await bcrypt.compare(oldPassword, utente.password);
  if (!match) return res.status(400).json({ error: 'Password attuale errata' });
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.utente.update({ where: { id: userId }, data: { password: hashed } });
  res.sendStatus(200);
});

// -------------------- CLIENTI --------------------

app.get('/api/clienti', async (req, res) => {
  try {
    const clienti = await prisma.cliente.findMany();
    res.json(clienti);
  } catch (error) {
    console.error('❌ Errore nella route /api/clienti:', error);
    res.status(500).json({ error: 'Errore nel caricamento dei clienti' });
  }
});

app.post('/api/clienti', async (req, res) => {
  console.log('📦 POST /clienti body:', req.body);
  const { id, synced, ...data } = req.body;
  try {
    // verifica duplicati
    // const esiste = await prisma.cliente.findFirst({ 
    //   where: { 
    //     partitaIva: data.partitaIva 
    //   } });
    // if (esiste) {
    //   return res.status(409).json({ error: 'Cliente già esistente con questa Partita IVA' });
    // }
  
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

// -------------------- CORRIERI --------------------
app.get('/api/corrieri', async (req, res) => {
  try {
    const corrieri = await prisma.corriere.findMany({
      orderBy: { nome: 'asc' }
    });
    res.json(corrieri);
  } catch (error) {
    console.error('❌ Errore GET corrieri:', error);
    res.status(500).json({ error: 'Errore nel caricamento dei corrieri' });
  }
});

app.post('/api/corrieri', async (req, res) => {
  console.log('📦 POST /corrieri body:', req.body);
  const { nome, email } = req.body;
  try {
    // verifica duplicati
    const esiste = await prisma.corriere.findFirst({
      where: { nome }
    });
    if (esiste) {
      return res.status(409).json({ error: 'Corriere già esistente' });
    }

    const nuovo = await prisma.corriere.create({
      data: {
        nome,
        ...(email && { email })
      }
    });
    res.status(201).json(nuovo);
  } catch (error) {
    console.error('❌ Errore POST corrieri:', error);
    res.status(500).json({ error: 'Errore nel salvataggio del corriere' });
  }
});

app.put('/api/corrieri/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, email } = req.body;
    const corriereAggiornato = await prisma.corriere.update({
      where: { id },
      data: {
        nome,
        ...(email !== undefined && { email })
      }
    });
    res.json(corriereAggiornato);
  } catch (error) {
    console.error('❌ Errore PUT corriere:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del corriere' });
  }
});

app.delete('/api/corrieri/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.corriere.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    console.error('❌ Errore DELETE corriere:', error);
    res.status(500).json({ error: 'Errore nella cancellazione del corriere' });
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
  console.log('✅ BODY RICEVUTO:', JSON.stringify(req.body, null, 2)); // log formattato leggibile

  try {
    const {
      id,
      synced,
      modifiedOffline,
      clienteId,
      cap,
      paese,
      provincia,
      ...resto
    } = req.body;

    let valoriAggiuntivi: any = {};
    if ((!cap || !paese || !provincia) && clienteId) {
      const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
      if (cliente) {
        valoriAggiuntivi.cap = cap || cliente.cap;
        valoriAggiuntivi.paese = paese || cliente.paese;
        valoriAggiuntivi.provincia = provincia || cliente.provincia;
      }
    }

    const esiste = await prisma.bolla.findFirst({
      where: { numeroBolla: String(resto.numeroBolla) }
    });
    if (esiste) {
      return res.status(409).json({ error: 'Bolla già esistente' });
    }

    const nuova = await prisma.bolla.create({
      data: {
        ...resto,
        dataOra: new Date(resto.dataOra),
        createdAt: new Date(resto.createdAt),
        cliente: {
          connect: { id: clienteId }
        },
        cap,
        paese,
        provincia
      }
    });

    res.status(201).json(nuova);
  } catch (error) {
    console.error('❌ Errore POST bolle:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('💥 Prisma error:', error.code, error.meta);
    }
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
      destinatarioVia,
      destinatarioNumeroCivico,
      destinatarioEmail,
      destinatarioTelefonoFisso,
      destinatarioTelefonoCell,
      destinatarioPartitaIva,
      destinatarioCodiceSDI,
      indirizzoDestinazione,
      causale,
      prodotti,
      daTrasportare,
      daRendere,
      consegnaACarico,
      vettore,
      synced,
      createdAt,
      cap,
      paese,
      provincia,
      clienteId
    } = req.body;

    const updated = await prisma.bolla.update({
      where: { id },
      data: {
        dataOra: new Date(dataOra),
        destinatarioNome,
        destinatarioVia,
        destinatarioNumeroCivico,
        destinatarioEmail,
        destinatarioTelefonoFisso,
        destinatarioTelefonoCell,
        destinatarioPartitaIva,
        destinatarioCodiceSDI,
        indirizzoDestinazione,
        causale,
        prodotti,
        daTrasportare,
        daRendere,
        consegnaACarico,
        vettore,
        synced: synced ?? true,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        cap,
        paese,
        provincia,
        cliente: clienteId ? { connect: { id: clienteId } } : undefined
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

app.listen(process.env.PORT || 4000, () => console.log('Server avviato'));