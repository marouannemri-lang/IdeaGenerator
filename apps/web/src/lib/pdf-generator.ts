import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Ajout pour TypeScript
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

export const generateQuotePdf = (quote: any, user: any) => {
    const doc = new jsPDF();

    // En-tête / Logo
    doc.setFontSize(20);
    doc.text(user.businessName || 'Mon Entreprise', 14, 22);

    doc.setFontSize(10);
    doc.text(`${user.firstName} ${user.lastName}`, 14, 30);
    doc.text(user.email, 14, 35);

    // Info Devis
    doc.setFontSize(16);
    doc.text('DEVIS', 140, 22);
    doc.setFontSize(10);
    doc.text(`Numéro: ${quote.quoteNumber}`, 140, 30);
    doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, 140, 35);
    if (quote.validUntil) {
        doc.text(`Validité: ${new Date(quote.validUntil).toLocaleDateString()}`, 140, 40);
    }

    // Info Client
    doc.text('Client:', 14, 55);
    doc.setFontSize(11);
    doc.text(`${quote.client.firstName} ${quote.client.lastName}`, 14, 62);
    if (quote.client.companyName) doc.text(quote.client.companyName, 14, 67);
    if (quote.client.address) doc.text(quote.client.address, 14, 72);

    // Tableau
    const tableColumn = ["Description", "Quantité", "Prix Unitaire", "Total HT"];
    const tableRows: any[] = [];

    quote.items.forEach((item: any) => {
        const itemData = [
            item.description,
            item.quantity,
            `${item.unitPrice.toFixed(2)} €`,
            `${item.total.toFixed(2)} €`,
        ];
        tableRows.push(itemData);
    });

    autoTable(doc, {
        startY: 85,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [66, 66, 66] },
    });

    // Totaux
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.text(`Sous-total HT: ${quote.subtotal.toFixed(2)} €`, 140, finalY);
    doc.text(`TVA (${quote.tvaRate}%): ${quote.tvaAmount.toFixed(2)} €`, 140, finalY + 5);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL TTC: ${quote.total.toFixed(2)} €`, 140, finalY + 12);

    // Pied de page
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Merci de votre confiance.', 14, 280);

    doc.save(`Devis_${quote.quoteNumber}.pdf`);
};

export const generateInvoicePdf = (invoice: any, user: any) => {
    const doc = new jsPDF();

    // En-tête / Logo
    doc.setFontSize(20);
    doc.text(user.businessName || 'Mon Entreprise', 14, 22);

    doc.setFontSize(10);
    doc.text(`${user.firstName} ${user.lastName}`, 14, 30);
    doc.text(user.email, 14, 35);

    // Info Facture
    doc.setFontSize(16);
    doc.text('FACTURE', 140, 22);
    doc.setFontSize(10);
    doc.text(`Numéro: ${invoice.invoiceNumber}`, 140, 30);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 140, 35);
    if (invoice.dueDate) {
        doc.text(`Echéance: ${new Date(invoice.dueDate).toLocaleDateString()}`, 140, 40);
    }

    // Info Client
    doc.text('Client:', 14, 55);
    doc.setFontSize(11);
    if (invoice.client) {
        doc.text(`${invoice.client.firstName} ${invoice.client.lastName}`, 14, 62);
        if (invoice.client.companyName) doc.text(invoice.client.companyName, 14, 67);
    }

    // Tableau
    const tableColumn = ["Description", "Quantité", "Prix Unitaire", "Total HT"];
    const tableRows: any[] = [];

    invoice.items.forEach((item: any) => {
        const itemData = [
            item.description,
            item.quantity,
            `${item.unitPrice.toFixed(2)} €`,
            `${item.total.toFixed(2)} €`,
        ];
        tableRows.push(itemData);
    });

    autoTable(doc, {
        startY: 85,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }, // Bleu différent pour facture
    });

    // Totaux
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.text(`Sous-total HT: ${invoice.subtotal.toFixed(2)} €`, 140, finalY);
    doc.text(`TVA (20%): ${invoice.tvaAmount.toFixed(2)} €`, 140, finalY + 5);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`NET À PAYER: ${invoice.total.toFixed(2)} €`, 140, finalY + 12);

    // Pied de page
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('En cas de retard de paiement, une pénalité de 3 fois le taux d\'intérêt légal sera appliquée.', 14, 280);

    doc.save(`Facture_${invoice.invoiceNumber}.pdf`);
};
