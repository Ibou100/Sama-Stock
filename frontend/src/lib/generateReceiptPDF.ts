import jsPDF from 'jspdf'
import type { Invoice } from '@/stores/useInvoiceStore'

function fmt(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function generateReceiptPDF(invoice: Invoice, orgName?: string) {
  // Format thermique standard 80mm de largeur
  const receiptWidth = 80
  const items = invoice.items || []
  // Hauteur dynamique selon le nombre de lignes
  const estimatedHeight = Math.max(160, 110 + items.length * 10)

  const doc = new jsPDF({
    unit: 'mm',
    format: [receiptWidth, estimatedHeight],
  })

  let y = 10

  // Nom de l'enseigne
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text((orgName || 'SAMA STOCK').toUpperCase(), receiptWidth / 2, y, { align: 'center' })
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('Ticket de Caisse / Vente Comptoir', receiptWidth / 2, y, { align: 'center' })
  y += 4

  // Ligne de séparation
  doc.setLineDashPattern([1, 1], 0)
  doc.setDrawColor(120, 120, 120)
  doc.line(6, y, receiptWidth - 6, y)
  y += 5

  // Métadonnées ticket
  doc.setFontSize(7)
  doc.text(`Ticket : ${invoice.invoice_number}`, 6, y)
  y += 3.5

  const dateStr = new Date(invoice.created_at).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  doc.text(`Date : ${dateStr}`, 6, y)
  y += 3.5

  const clientName = invoice.customer_name_snapshot || invoice.customer?.name || 'Client Comptoir'
  doc.text(`Client : ${clientName}`, 6, y)
  y += 3.5

  const methodLabel = {
    cash: 'Espèces',
    wave: 'Wave',
    orange_money: 'Orange Money',
    card: 'Carte Bancaire',
    transfer: 'Virement',
    other: 'Autre',
  }[invoice.payment_method || 'cash'] || 'Espèces'
  doc.text(`Paiement : ${methodLabel}`, 6, y)
  y += 4

  // Entête des articles
  doc.setLineDashPattern([], 0)
  doc.line(6, y, receiptWidth - 6, y)
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('ARTICLE', 6, y)
  doc.text('QTÉ', 45, y, { align: 'center' })
  doc.text('P.U', 58, y, { align: 'right' })
  doc.text('TOTAL', receiptWidth - 6, y, { align: 'right' })
  y += 3

  doc.line(6, y, receiptWidth - 6, y)
  y += 4

  // Lignes d'articles
  doc.setFont('helvetica', 'normal')
  items.forEach((item) => {
    const prodName = (item.product?.name || 'Article').substring(0, 18)
    doc.text(prodName, 6, y)
    doc.text(String(item.quantity), 45, y, { align: 'center' })
    doc.text(fmt(item.unit_price), 58, y, { align: 'right' })
    doc.text(`${fmt(item.quantity * item.unit_price)}`, receiptWidth - 6, y, { align: 'right' })
    y += 5
  })

  // Séparation
  doc.setLineDashPattern([1, 1], 0)
  doc.line(6, y, receiptWidth - 6, y)
  y += 5

  // Total
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('TOTAL A PAYER', 6, y)
  doc.text(`${fmt(invoice.total_amount)} FCFA`, receiptWidth - 6, y, { align: 'right' })
  y += 5

  if (invoice.amount_received && invoice.amount_received > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text('Montant Reçu :', 6, y)
    doc.text(`${fmt(invoice.amount_received)} FCFA`, receiptWidth - 6, y, { align: 'right' })
    y += 4

    doc.text('Monnaie Rendue :', 6, y)
    doc.text(`${fmt(invoice.change_returned || 0)} FCFA`, receiptWidth - 6, y, { align: 'right' })
    y += 5
  }

  // Footer
  doc.setLineDashPattern([], 0)
  doc.line(6, y, receiptWidth - 6, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('Merci de votre visite et à bientôt !', receiptWidth / 2, y, { align: 'center' })
  y += 4
  doc.setFontSize(6)
  doc.setTextColor(100, 100, 100)
  doc.text('Logiciel Sama Stock - www.samastock.sn', receiptWidth / 2, y, { align: 'center' })

  // Téléchargement / impression
  doc.save(`Ticket_${invoice.invoice_number}.pdf`)
}
