import { prisma } from '@talentflow/database';

export class InvoiceService {
    private async generateInvoiceNumber(userId: string): Promise<string> {
        const count = await prisma.invoice.count({ where: { userId } });
        const year = new Date().getFullYear().toString();
        // Format: F2026-001
        return `F${year}-${(count + 1).toString().padStart(3, '0')}`;
    }

    async createFromQuote(userId: string, quoteId: string) {
        const quote = await prisma.quote.findUnique({
            where: { id: quoteId, userId },
            include: { items: true }
        });

        if (!quote) throw new Error('Quote not found');

        const invoiceNumber = await this.generateInvoiceNumber(userId);

        // Date d'échéance par défaut : +30 jours
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        const invoice = await prisma.invoice.create({
            data: {
                userId,
                clientId: quote.clientId,
                quoteId: quote.id,
                invoiceNumber,
                title: quote.title,
                status: 'PENDING',
                dueDate,
                subtotal: quote.subtotal,
                tvaAmount: quote.tvaAmount,
                total: quote.total,
                items: {
                    create: quote.items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.total
                    }))
                }
            }
        });

        // Mettre à jour le statut du devis
        await prisma.quote.update({
            where: { id: quoteId },
            data: { status: 'ACCEPTED' }
        });

        return invoice;
    }

    async findAll(userId: string) {
        return prisma.invoice.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { client: true }
        });
    }

    async updateStatus(userId: string, invoiceId: string, status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED') {
        const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
        if (!invoice) throw new Error('Invoice not found');

        return prisma.invoice.update({
            where: { id: invoiceId },
            data: { status }
        });
    }
}

export const invoiceService = new InvoiceService();
