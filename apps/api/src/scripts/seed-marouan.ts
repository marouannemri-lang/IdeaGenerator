import { prisma } from '@talentflow/database';
// @ts-ignore
import bcrypt from 'bcryptjs';

async function main() {
    console.log('Seeding Marouan...');

    const email = 'marouanprojet@gmail.com';
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 12);

    // 1. Create/Upsert User
    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            passwordHash,
            firstName: 'Marouan',
            lastName: 'Projet',
            businessName: 'Marouan Elec',
            plan: 'PRO',
            whatsappNumber: '33612345678',
            whatsappVerified: true
        }
    });

    console.log(`User created: ${user.id}`);

    // 2. Business Settings
    await prisma.businessSettings.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            workingHours: {
                mon: { enabled: true, start: "08:00", end: "18:00" },
                tue: { enabled: true, start: "08:00", end: "18:00" },
                wed: { enabled: true, start: "08:00", end: "18:00" },
                thu: { enabled: true, start: "08:00", end: "18:00" },
                fri: { enabled: true, start: "08:00", end: "17:00" },
                sat: { enabled: false },
                sun: { enabled: false }
            },
            serviceArea: ["Paris", "Lyon", "Marseille"],
            baseRatePerHour: 65,
            travelFee: 45
        }
    });

    // 3. AI Settings
    await prisma.aiSettings.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            aiName: "ElectroBot",
            aiTone: "friendly",
            welcomeMessage: "Bonjour ! Je suis l'assistant de Marouan Elec. Comment puis-je vous éclairer ?",
            specialties: ["Électricité Générale", "Domotique", "Bornes IRVE"],
            maxAutoQuoteAmount: 800
        }
    });

    // 4. Service Catalog
    const existingServices = await prisma.serviceCatalog.findMany({ where: { userId: user.id } });
    if (existingServices.length === 0) {
        await prisma.serviceCatalog.createMany({
            data: [
                { userId: user.id, name: "Recherche de panne", category: "Dépannage", basePrice: 120, unit: "forfait", estimatedDuration: 60 },
                { userId: user.id, name: "Installation Prise GreenUp", category: "Installation", basePrice: 250, unit: "unité", estimatedDuration: 120 },
                { userId: user.id, name: "Remplacement Tableau Électrique", category: "Rénovation", basePrice: 1200, unit: "forfait", estimatedDuration: 480 }
            ]
        });
    }

    // 5. Client
    const client = await prisma.client.create({
        data: {
            userId: user.id,
            firstName: "Jean",
            lastName: "Dupont",
            email: "jean.dupont@example.com",
            phoneNumber: "0600000001",
            companyName: "Dupont SA",
            type: "CLIENT"
        }
    });

    // 6. Quote
    const quote = await prisma.quote.create({
        data: {
            userId: user.id,
            clientId: client.id,
            quoteNumber: "DEV-2024-001",
            title: "Remplacement Tableau Électrique",
            status: "SENT",
            subtotal: 1200,
            total: 1440, // +20% TVA
            items: {
                create: [
                    { description: "Remplacement tableau 3 rangées", quantity: 1, unitPrice: 1200, total: 1200 }
                ]
            },
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
    });

    // 7. Invoice
    await prisma.invoice.create({
        data: {
            userId: user.id,
            clientId: client.id,
            quoteId: quote.id,
            invoiceNumber: "FAC-2024-001",
            title: "Acompte Remplacement Tableau",
            status: "PAID",
            subtotal: 400,
            total: 480,
            dueDate: new Date(),
            items: {
                create: [
                    { description: "Acompte 30%", quantity: 1, unitPrice: 400, total: 400 }
                ]
            }
        }
    });

    console.log('Seeding completed!');
    process.exit(0);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
