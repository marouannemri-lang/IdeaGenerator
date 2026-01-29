import { prisma } from '@talentflow/database';
import { CreateClientDto } from '@talentflow/shared';

// Type temporaire en attendant que @talentflow/shared soit mis à jour
export interface CreateClientInput {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    type?: 'PROSPECT' | 'CLIENT' | 'INACTIVE';
}

export class ClientService {
    async create(userId: string, data: CreateClientInput) {
        return prisma.client.create({
            data: {
                ...data,
                userId,
                totalRevenue: 0,
                type: data.type || 'PROSPECT',
            },
        });
    }

    async findAll(userId: string) {
        return prisma.client.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { quotes: true, invoices: true },
                },
            },
        });
    }

    async findOne(userId: string, clientId: string) {
        return prisma.client.findFirst({
            where: { id: clientId, userId },
            include: {
                quotes: { orderBy: { createdAt: 'desc' }, take: 5 },
                invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
            },
        });
    }

    async update(userId: string, clientId: string, data: Partial<CreateClientInput>) {
        // Vérifier l'appartenance
        const client = await prisma.client.findFirst({ where: { id: clientId, userId } });
        if (!client) throw new Error('Client not found');

        return prisma.client.update({
            where: { id: clientId },
            data,
        });
    }
}

export const clientService = new ClientService();
