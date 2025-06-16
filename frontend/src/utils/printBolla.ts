// File: src/utils/printBolla.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoDataUrl from '../assets/logo_bolle.png';
import type { Bolla } from '../storage/bolleDB';
import { getAllImballaggi } from '../storage/imballaggiDB';
import type { Imballaggio } from '../storage/imballaggiDB';

/**
 * Stampa una bolla in PDF, con layout completo.
 */
export async function handlePrint(bolla: Bolla) {
  const imballaggi: Imballaggio[] = await getAllImballaggi();
  const doc = new jsPDF('p', 'mm', 'a4');
  const M = 10;             // margine
  doc.setFont('helvetica');

  const pageWidth = doc.internal.pageSize.getWidth();

  // Logo
  const logoW = 60;
  const logoH = 30;
  const logoX = (pageWidth - logoW) / 2;
  const logoY = 10;
  let cursorY = M;
  doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, logoH);
  doc.setFontSize(16);

  // Spazio sotto logo
  cursorY = 25; // ridotto gap sotto logo

  // MITTENTE
  const mittX = M;
  const mittW = 90;
  cursorY += 24;
  doc.setLineWidth(0.5);
  doc.rect(mittX, cursorY, mittW, 50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Morselli Dottor Antonio', mittX + 4, cursorY + 8);
  doc.setFont('helvetica', 'regular');
  doc.setFontSize(9);
  doc.text('Via Gallerana 28, 41030 Staggia (MO)', mittX + 4, cursorY + 14);
  doc.text('Tel. 329 97 80 703 · Fax 059 90 60 01', mittX + 4, cursorY + 19);
  doc.text('Mail: anguriadimodena@gmail.com', mittX + 4, cursorY + 24);
  doc.text('PEC: antonio.morselli@pec.agritel.it', mittX + 4, cursorY + 29);
  doc.text('P.IVA 03235970369 · Cod. Fisc. MRSNTN81A12E897H', mittX + 4, cursorY + 34);
  doc.text('Iscriz. B.N.D.O.O. n°059906001', mittX + 4, cursorY + 39);

  // DESTINATARIO
  const destX = mittX + mittW + 10;
  const destW = 90;
  doc.rect(destX, cursorY, destW, 50);
  doc.setFontSize(10);
  doc.text('Destinatario:', destX + 4, cursorY + 6);
  doc.setFontSize(12);
  doc.text(`${bolla.destinatarioNome} ${bolla.destinatarioCognome}`, destX + 4, cursorY + 16);
  doc.setFontSize(9);
  const indirizzo = `via ${bolla.destinatarioVia ?? ''}, n. ${bolla.destinatarioNumeroCivico ?? ''}`.trim();
  doc.text(indirizzo, destX + 4, cursorY + 22);
  doc.text(`Mail: ${bolla.destinatarioEmail}`, destX + 4, cursorY + 28);
  doc.text(`Tel.: ${bolla.destinatarioTelefonoCell}`, destX + 4, cursorY + 33);
  doc.text(`P.IVA: ${bolla.destinatarioPartitaIva}`, destX + 4, cursorY + 38);
  doc.text(`SDI: ${bolla.destinatarioCodiceSDI}`, destX + 4, cursorY + 43);

  // Linea separazione
  doc.setLineWidth(0.5);
  const boxBottom = cursorY + 50;
  doc.line(mittX, boxBottom + 5, destX + destW, boxBottom + 5);

  // DOCUMENTO DI TRASPORTO + NUMERO
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`DOCUMENTO DI TRASPORTO (D.P.R. 472 del 14/08/96):`, mittX, boxBottom + 12);
  doc.text(`${bolla.numeroBolla}`, mittX, boxBottom + 18);
  doc.setFont('helvetica', 'regular');
  doc.text(`Data: ${new Date(bolla.dataOra).toLocaleString()}`, destX, boxBottom + 12);

  // Spazio tra sezioni
  cursorY = boxBottom + 25;
  doc.setFontSize(12);

  // INDIRIZZO DESTINAZIONE & SEDE
  doc.setFontSize(10);
  doc.rect(M, cursorY, 95, 8);
  doc.rect(M + 95, cursorY, 95, 8);
  doc.setFont('helvetica', 'bold');
  doc.text('Indirizzo di destinazione:', M + 2, cursorY + 6);
  doc.setFont('helvetica', 'regular');
  doc.text(bolla.indirizzoDestinazione, M + 97, cursorY + 6);

  // CAUSALE
  cursorY += 16;
  doc.rect(M, cursorY, 95, 8);
  doc.rect(M + 95, cursorY, 95, 8); 
  doc.setFont('helvetica', 'bold');
  doc.text('Causale del trasporto:', M + 2, cursorY + 6);
  doc.setFont('helvetica', 'regular');
  doc.text(bolla.causale, M + 97, cursorY + 6);

  // TABELLA PRODOTTI
  cursorY += 16;
  const prodotti = JSON.parse(bolla.prodotti) as Array<any>;
  autoTable(doc, {
    startY: cursorY,
    margin: { left: M, right: M },
    tableWidth: pageWidth - 2 * M,
    head: [['Prodotto','Qualità','Prezzo','Imballaggio','N° Colli','Peso lordo','Peso netto']],
    body: prodotti.map(p => [
      p.nomeProdotto, p.qualita, p.prezzo.toString(), p.nomeImballaggio,
      p.numeroColli.toString(), p.pesoLordo.toString(), p.pesoNetto.toString()
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { textColor: [255,255,255] }
  });
  const afterTableY = (doc as any).lastAutoTable.finalY || cursorY;

  // TOTALI KG
  const totKg = prodotti.reduce((s, p) => s + p.totKgSpediti, 0);
  doc.setFontSize(9);
  doc.text(`Totale kg spediti in questa consegna: ${totKg}`, M, afterTableY + 6);
  doc.text(`Totale KG angurie spediti in questa stagione:`, M + 110, afterTableY + 6);

  // IMBALLAGGI A RENDERE
  const trasportoArr = JSON.parse(bolla.daTrasportare) as Array<any>;
  const rendArr = JSON.parse(bolla.daRendere) as Array<any>;
  const imballaggiData = trasportoArr.map((d) => ({
    nomeImballaggio: d.nomeImballaggio,
    numeroColli: d.numeroColli,
    prezzo: imballaggi.find(im => im.tipo === d.nomeImballaggio)?.prezzo
  }));
  autoTable(doc, {
    startY: afterTableY + 12,
    margin: { left: M, right: M },
    tableWidth: pageWidth - 2 * M,
    head: [['Tipologia','Valore','Da trasporto attuale','Totali a rendere']],
    body: imballaggiData.map((r, i) => [
      r.nomeImballaggio,
      r.prezzo?.toString() ?? '',
      r.numeroColli.toString(),
      rendArr[i]?.numeroColli.toString() ?? ''
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { textColor: [255,255,255] }
  });
  const afterImbY = (doc as any).lastAutoTable.finalY || (afterTableY + 12);

  // BARRA RESTITUZIONE E NOTE
  const restY = afterImbY + 8;
  doc.rect(M, restY, pageWidth - 2 * M, 20);  // usa larghezza piena con margini
  doc.setFontSize(12);
  doc.setFont('helvetica','bold');
  const tempoText = 'Tempo concesso per la restituzione degli imballaggi a rendere (in giorni): 15';
  doc.text(tempoText, M + 2, restY + 6);
  const tmpWidth = doc.getTextWidth(tempoText);
  doc.setLineWidth(0.5);
  doc.line(M + 2, restY + 7, M + 2 + tmpWidth, restY + 7);
  doc.setFont('helvetica','regular');
  doc.setFontSize(8);
  doc.text(`Si ricorda che, in base agli accordi contrattuali presi, la mancata e/o la parziale restituzione entro i termini prefissati comporta penale.`, M + 2, restY + 11);
  doc.text(`Per contestazione qualità, peso o prezzo, restituzione entro 48h. Spese a carico cedente.`, M + 2, restY + 16);

  // FIRME & Vettore
  const fY = restY + 30;
  doc.rect(M, fY, mittW, 12);
  doc.text('Consegna a carico del:', M + 2, fY + 6);
  doc.text(bolla.consegnaACarico, M + mittW - 40, fY + 6);
  const vettX = M + mittW + 10;
  doc.rect(vettX, fY, mittW, 12);
  doc.text('Vettore:', vettX + 2, fY + 6);
  doc.text(bolla.vettore, vettX + mittW - 40, fY + 6);

  // Linee firme
  doc.text('Firma Conducente 1', M, fY + 22);
  doc.line(M, fY + 24, M + 50, fY + 24);
  doc.text('Firma Conducente 2', M + 60, fY + 22);
  doc.line(M + 60, fY + 24, M + 110, fY + 24);
  doc.text('Firma Destinatario', M + 115, fY + 22);
  doc.line(M + 115, fY + 24, M + 175, fY + 24);

  // Salva PDF
  doc.save(`bolla n. ${bolla.numeroBolla}.pdf`);
}
