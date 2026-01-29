import { prisma } from '@talentflow/database';

export interface UpdateSettingsInput {
    businessName?: string;
    contactEmail?: string;
    smsTemplate?: string;
}

export class UserSettingsService {
    async getSettings(userId: string) {
        let settings = await prisma.userSettings.findUnique({
            where: { userId }
        });

        if (!settings) {
            settings = await prisma.userSettings.create({
                data: {
                    userId,
                    businessName: '',
                    smsTemplate: "Bonjour, je suis actuellement indisponible. Merci de laisser un message, je vous rappelle rapidement."
                }
            });
        }

        return settings;
    }

    async updateSettings(userId: string, data: UpdateSettingsInput) {
        // Upsert garantit que ça crée ou met à jour
        return prisma.userSettings.upsert({
            where: { userId },
            create: {
                userId,
                ...data
            },
            update: data
        });
    }
}

export const userSettingsService = new UserSettingsService();
