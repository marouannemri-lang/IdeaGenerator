import { prisma } from '@talentflow/database';

export class InvoiceService {
    private async generateInvoiceNumber(userId: string): Promise<string> {
        const count = await prisma.invoice.count({ where: { userId } });
        const year = new Date().getFullYear().toString();
        // Format: F2026-001
        return `F${year}-${(count + 1).toString().padStart(3, '0')}`;
    }

    async createFromQuote(userId: string, quoteId: string) {
        // Check if invoice already exists for this quote
        const existingInfo = await prisma.invoice.findUnique({
            where: { quoteId }
        });
        if (existingInfo) return existingInfo;

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

    async findAll(userId: string, search?: string) {
        const where: any = { userId };
        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { client: { companyName: { contains: search, mode: 'insensitive' } } },
                { client: { firstName: { contains: search, mode: 'insensitive' } } },
                { client: { lastName: { contains: search, mode: 'insensitive' } } },
            ];
        }

        return prisma.invoice.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                client: true,
                items: true
            }
        });
    }

    async findOne(userId: string, invoiceId: string) {
        return prisma.invoice.findFirst({
            where: { id: invoiceId, userId },
            include: { items: true, client: true }
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

    async update(userId: string, invoiceId: string, data: any) {
        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, userId },
        });

        if (!invoice) throw new Error('Invoice not found');

        let itemUpdates = {};
        let totalsUpdate = {};

        if (data.items) {
            // Delete existing items
            await prisma.invoiceItem.deleteMany({ where: { invoiceId } });

            // Calculate new totals
            let subtotal = 0;
            const itemsWithTotal = data.items.map((item: any) => {
                const total = item.quantity * item.unitPrice;
                subtotal += total;
                return { ...item, total };
            });

            const tvaRate = 0.20;
            const tvaAmount = subtotal * tvaRate;
            const total = subtotal + tvaAmount;

            itemUpdates = {
                items: {
                    create: itemsWithTotal
                }
            };
            totalsUpdate = { subtotal, tvaAmount, total };
        }

        return prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                title: data.title,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                status: data.status,
                ...itemUpdates,
                ...totalsUpdate
            },
            include: { items: true, client: true }
        });
    }
}

export const invoiceService = new InvoiceService();
