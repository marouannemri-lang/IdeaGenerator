import { prisma } from '@talentflow/database';

export class SettingsService {
    async getAllSettings(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                businessSettings: true,
                aiSettings: true,
                serviceCatalog: true,
                settings: true,
            }
        });

        // Structure the response to match frontend expectations
        // combining User info + specific settings tables
        return {
            ...user,
            business_settings: user?.businessSettings,
            ai_settings: user?.aiSettings
        };
    }

    async updateBusinessSettings(userId: string, data: any) {
        return prisma.businessSettings.upsert({
            where: { userId },
            update: data,
            create: {
                userId,
                ...data
            }
        });
    }

    async updateAiSettings(userId: string, data: any) {
        return prisma.aiSettings.upsert({
            where: { userId },
            update: data,
            create: {
                userId,
                ...data
            }
        });
    }

    async getServices(userId: string) {
        return prisma.serviceCatalog.findMany({
            where: { userId },
            orderBy: [
                { displayOrder: 'asc' },
                { name: 'asc' }
            ]
        });
    }

    async createService(userId: string, data: any) {
        return prisma.serviceCatalog.create({
            data: {
                userId,
                ...data
            }
        });
    }

    async updateService(userId: string, serviceId: string, data: any) {
        const s = await prisma.serviceCatalog.findFirst({ where: { id: serviceId, userId } });
        if (!s) throw new Error('Service not found');
        return prisma.serviceCatalog.update({
            where: { id: serviceId },
            data
        });
    }

    async deleteService(userId: string, serviceId: string) {
        const s = await prisma.serviceCatalog.findFirst({ where: { id: serviceId, userId } });
        if (!s) throw new Error('Service not found');
        return prisma.serviceCatalog.delete({
            where: { id: serviceId }
        });
    }

    async updateGeneralInfo(userId: string, data: any) {
        // Update User fields
        if (data.businessName || data.contactEmail) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    businessName: data.businessName,
                    // Only update email if provided and different (careful with auth)
                    // For now mapping contactEmail to email field as per legacy UI
                    ...(data.contactEmail ? { email: data.contactEmail } : {})
                }
            });
        }

        // Update Legacy UserSettings (SMS Template)
        if (data.smsTemplate !== undefined) {
            await prisma.userSettings.upsert({
                where: { userId },
                create: {
                    userId,
                    autoResponseSms: data.smsTemplate,
                    missedCallEnabled: true // Default
                },
                update: {
                    autoResponseSms: data.smsTemplate
                }
            });
        }

        return this.getAllSettings(userId);
    }
}

export const settingsService = new SettingsService();
