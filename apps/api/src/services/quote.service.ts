import { prisma } from '@talentflow/database';

export interface CreateQuoteInput {
    clientId: string;
    title?: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
    }[];
    validUntil?: string; // Date string
}

export class QuoteService {
    private async generateQuoteNumber(userId: string): Promise<string> {
        const count = await prisma.quote.count({ where: { userId } });
        const year = new Date().getFullYear().toString().substr(-2);
        // Format: D-24-001
        return `D-${year}-${(count + 1).toString().padStart(3, '0')}`;
    }

    async create(userId: string, data: CreateQuoteInput) {
        const quoteNumber = await this.generateQuoteNumber(userId);

        // Calcul des totaux
        let subtotal = 0;
        const itemsWithTotal = data.items.map((item, index) => {
            const total = item.quantity * item.unitPrice;
            subtotal += total;
            return { ...item, total, order: index };
        });

        const tvaRate = 20.0;
        const tvaAmount = subtotal * (tvaRate / 100);
        const total = subtotal + tvaAmount;

        return prisma.quote.create({
            data: {
                userId,
                clientId: data.clientId,
                quoteNumber,
                title: data.title,
                status: 'DRAFT',
                subtotal,
                tvaRate,
                tvaAmount,
                total,
                validUntil: data.validUntil ? new Date(data.validUntil) : null,
                items: {
                    create: itemsWithTotal,
                },
            },
            include: {
                items: true,
                client: true,
            },
        });
    }

    async findAll(userId: string, search?: string) {
        const where: any = { userId };
        if (search) {
            where.OR = [
                { quoteNumber: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { client: { companyName: { contains: search, mode: 'insensitive' } } },
                { client: { firstName: { contains: search, mode: 'insensitive' } } },
                { client: { lastName: { contains: search, mode: 'insensitive' } } },
            ];
        }

        return prisma.quote.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                client: true,
                invoice: true,
            },
            take: 50,
        });
    }

    async findOne(userId: string, quoteId: string) {
        return prisma.quote.findFirst({
            where: { id: quoteId, userId },
            include: {
                client: true,
                items: { orderBy: { order: 'asc' } },
            },
        });
    }

    async update(userId: string, quoteId: string, data: Partial<CreateQuoteInput> & { status?: any }) {
        const quote = await prisma.quote.findFirst({
            where: { id: quoteId, userId },
        });

        if (!quote) throw new Error('Quote not found');

        let itemUpdates = {};
        let totalsUpdate = {};

        if (data.items) {
            // Delete existing items
            await prisma.quoteItem.deleteMany({ where: { quoteId } });

            // Calculate new totals
            let subtotal = 0;
            const itemsWithTotal = data.items.map((item, index) => {
                const total = item.quantity * item.unitPrice;
                subtotal += total;
                return { ...item, total, order: index };
            });

            const tvaRate = (quote as any).tvaRate || 20.0;
            const tvaAmount = subtotal * (tvaRate / 100);
            const total = subtotal + tvaAmount;

            itemUpdates = {
                items: {
                    create: itemsWithTotal
                }
            };
            totalsUpdate = { subtotal, tvaAmount, total };
        }

        return prisma.quote.update({
            where: { id: quoteId },
            data: {
                title: data.title,
                status: data.status,
                clientId: data.clientId ? data.clientId : undefined,
                validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
                ...itemUpdates,
                ...totalsUpdate
            },
            include: { items: true, client: true }
        });
    }
}

export const quoteService = new QuoteService();
