import jsPDF from 'jspdf'
import type { Invoice } from '@/stores/useInvoiceStore'

// Format number with regular space as thousands separator (jsPDF can't render non-breaking spaces)
function fmt(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function generateInvoicePDF(invoice: Invoice) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // ---- HEADER ----
  doc.setFillColor(30, 30, 50)
  doc.rect(0, 0, pageWidth, 45, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('SAMA STOCK', 20, 22)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Gestion de stock multi-locataire', 20, 30)
  doc.text('www.samastock.sn', 20, 36)

  // Invoice number on the right
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE', pageWidth - 20, 18, { align: 'right' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.invoice_number, pageWidth - 20, 26, { align: 'right' })

  const invoiceDate = new Date(invoice.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
  doc.setFontSize(9)
  doc.text(invoiceDate, pageWidth - 20, 33, { align: 'right' })

  // ---- STATUS BADGE ----
  const statusLabels: Record<string, string> = { draft: 'Brouillon', paid: 'Payée', cancelled: 'Annulée' }
  const statusColors: Record<string, [number, number, number]> = {
    draft: [245, 158, 11],
    paid: [16, 185, 129],
    cancelled: [239, 68, 68],
  }
  const statusColor = statusColors[invoice.status] || [100, 100, 100]
  doc.setFillColor(...statusColor)
  const statusText = statusLabels[invoice.status] || invoice.status
  const statusWidth = doc.getTextWidth(statusText) + 12
  doc.roundedRect(pageWidth - 20 - statusWidth, 36, statusWidth, 7, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(statusText, pageWidth - 20 - statusWidth / 2, 41, { align: 'center' })

  // ---- CLIENT INFO ----
  let y = 58

  doc.setTextColor(100, 100, 100)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURER À :', 20, y)
  y += 6

  doc.setTextColor(30, 30, 50)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.customer?.name || 'Client non spécifié', 20, y)
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  if ((invoice.customer as any)?.email) {
    doc.text((invoice.customer as any).email, 20, y)
    y += 4
  }
  if ((invoice.customer as any)?.phone) {
    doc.text((invoice.customer as any).phone, 20, y)
    y += 4
  }
  if ((invoice.customer as any)?.address) {
    doc.text((invoice.customer as any).address, 20, y)
    y += 4
  }

  // ---- TABLE HEADER ----
  y += 8
  doc.setFillColor(245, 245, 250)
  doc.rect(20, y - 5, pageWidth - 40, 10, 'F')

  doc.setTextColor(80, 80, 100)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('PRODUIT', 24, y + 1)
  doc.text('QTÉ', 105, y + 1, { align: 'center' })
  doc.text('PRIX UNITAIRE', 135, y + 1, { align: 'center' })
  doc.text('TOTAL', pageWidth - 24, y + 1, { align: 'right' })

  y += 10

  // ---- TABLE ROWS ----
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 30, 50)
  doc.setFontSize(9)

  const items = invoice.items || []
  items.forEach((item, index) => {
    if (y > 260) {
      doc.addPage()
      y = 20
    }

    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 255)
      doc.rect(20, y - 4, pageWidth - 40, 8, 'F')
    }

    doc.setTextColor(30, 30, 50)
    doc.text(item.product?.name || 'Produit', 24, y)
    doc.text(String(item.quantity), 105, y, { align: 'center' })
    doc.text(`${fmt(item.unit_price)} FCFA`, 135, y, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.text(`${fmt(item.quantity * item.unit_price)} FCFA`, pageWidth - 24, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')

    y += 8
  })

  // ---- SEPARATOR ----
  y += 2
  doc.setDrawColor(220, 220, 230)
  doc.setLineWidth(0.5)
  doc.line(20, y, pageWidth - 20, y)

  // ---- TOTAL ----
  y += 10
  doc.setFillColor(30, 30, 50)
  doc.roundedRect(pageWidth - 90, y - 5, 70, 14, 3, 3, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('TOTAL', pageWidth - 86, y + 2)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`${fmt(invoice.total_amount)} FCFA`, pageWidth - 24, y + 3, { align: 'right' })

  // ---- NOTES ----
  if (invoice.notes) {
    y += 22
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('NOTES :', 20, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    doc.text(invoice.notes, 20, y)
  }

  // ---- FOOTER ----
  const footerY = doc.internal.pageSize.getHeight() - 15
  doc.setDrawColor(220, 220, 230)
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5)
  doc.setTextColor(160, 160, 160)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Sama Stock — Gestion de stock multi-locataire | WhatsApp: +221 77 455 90 26', pageWidth / 2, footerY, { align: 'center' })
  doc.text(`Facture générée le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, footerY + 4, { align: 'center' })

  // ---- SAVE ----
  doc.save(`Facture_${invoice.invoice_number}.pdf`)
}
