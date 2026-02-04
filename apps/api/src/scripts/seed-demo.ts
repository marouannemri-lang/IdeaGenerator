import { prisma } from '@talentflow/database';
// @ts-ignore
import bcrypt from 'bcryptjs';

async function main() {
    console.log('🌱 Seeding database with demo data...');

    const email = 'marouanprojet@gmail.com';
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 12);

    // ==================== USER ====================
    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            passwordHash,
            firstName: 'Marouan',
            lastName: 'Elec',
            businessName: 'Marouan Électricité Pro',
            plan: 'PRO',
            whatsappNumber: '33612345678',
            whatsappVerified: true,
            phoneNumber: '0612345678',
        }
    });
    console.log(`✅ User created: ${user.email}`);

    // ==================== SETTINGS ====================
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
            serviceArea: ["Paris", "Boulogne-Billancourt", "Issy-les-Moulineaux"],
            baseRatePerHour: 65,
            travelFee: 45
        }
    });

    await prisma.aiSettings.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            aiName: "ElectroBot",
            aiTone: "friendly",
            welcomeMessage: "Bonjour ! Je suis l'assistant de Marouan Elec. Comment puis-je vous aider ?",
            specialties: ["Électricité Générale", "Domotique", "Bornes IRVE", "Tableaux Électriques"],
            maxAutoQuoteAmount: 500
        }
    });
    console.log('✅ Settings configured');

    // ==================== SERVICE CATALOG ====================
    const services = await prisma.serviceCatalog.createMany({
        data: [
            { userId: user.id, name: "Recherche de panne", category: "Dépannage", basePrice: 120, unit: "forfait", estimatedDuration: 60 },
            { userId: user.id, name: "Installation Prise GreenUp", category: "Installation", basePrice: 250, unit: "unité", estimatedDuration: 120 },
            { userId: user.id, name: "Remplacement Tableau Électrique", category: "Rénovation", basePrice: 1200, unit: "forfait", estimatedDuration: 480 },
            { userId: user.id, name: "Installation Interrupteur", category: "Installation", basePrice: 80, unit: "unité", estimatedDuration: 30 },
            { userId: user.id, name: "Déplacement", category: "Frais", basePrice: 45, unit: "forfait", estimatedDuration: 0 },
        ],
        skipDuplicates: true
    });
    console.log(`✅ ${services.count} services added`);

    // ==================== CLIENT 1: Jean Dupont (Prospect → Client) ====================
    const client1 = await prisma.client.create({
        data: {
            userId: user.id,
            firstName: "Jean",
            lastName: "Dupont",
            email: "jean.dupont@gmail.com",
            phoneNumber: "+33601020304",
            companyName: "Dupont SA",
            address: "12 Rue de la Paix, 75002 Paris",
            type: "CLIENT",
            status: "ACTIVE",
            totalRevenue: 1680,
            lastInteraction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
            notes: "Client régulier, préfère être contacté par email"
        }
    });

    // Messages WhatsApp Client 1
    await prisma.message.createMany({
        data: [
            {
                clientId: client1.id,
                role: "user",
                content: "Bonjour, j'ai un problème avec mon tableau électrique",
                phoneNumber: "+33601020304",
                direction: "inbound",
                intent: "DEPANNAGE",
                urgency: "HIGH",
                aiProcessed: true,
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            },
            {
                clientId: client1.id,
                role: "assistant",
                content: "Bonjour Jean ! Je comprends, c'est urgent. Je peux intervenir dès demain matin. Ça vous convient ?",
                phoneNumber: "+33601020304",
                direction: "outbound",
                model: "llama-3.3-70b",
                tokens: 45,
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000)
            },
            {
                clientId: client1.id,
                role: "user",
                content: "Oui parfait !",
                phoneNumber: "+33601020304",
                direction: "inbound",
                sentiment: "POSITIVE",
                aiProcessed: true,
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000)
            }
        ]
    });

    // Quote Client 1
    const quote1 = await prisma.quote.create({
        data: {
            userId: user.id,
            clientId: client1.id,
            quoteNumber: "DEV-2024-001",
            title: "Remplacement Tableau Électrique",
            description: "Remplacement complet du tableau électrique vétuste",
            status: "ACCEPTED",
            subtotal: 1200,
            tvaRate: 20,
            tvaAmount: 240,
            total: 1440,
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            validityDays: 30,
            markupPercentage: 35,
            estimatedDuration: "1 journée",
            items: {
                create: [
                    { description: "Remplacement tableau 3 rangées avec disjoncteurs", quantity: 1, unitPrice: 1200, total: 1200, order: 0 }
                ]
            }
        }
    });

    // Commentaire sur le devis
    await prisma.quoteComment.create({
        data: {
            quoteId: quote1.id,
            content: "Client a accepté par téléphone, intervention planifiée pour demain",
            author: "admin",
            source: "web"
        }
    });

    // Invoice Client 1
    const invoice1 = await prisma.invoice.create({
        data: {
            userId: user.id,
            clientId: client1.id,
            quoteId: quote1.id,
            invoiceNumber: "FAC-2024-001",
            title: "Remplacement Tableau Électrique - Acompte 30%",
            status: "PAID",
            subtotal: 400,
            tvaAmount: 80,
            total: 480,
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            items: {
                create: [
                    { description: "Acompte 30% sur intervention", quantity: 1, unitPrice: 400, total: 400 }
                ]
            }
        }
    });

    // Intervention Client 1
    await prisma.intervention.create({
        data: {
            clientId: client1.id,
            quoteId: quote1.id,
            status: "COMPLETED",
            scheduledDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
            address: client1.address,
            notes: "Intervention réussie. Client très satisfait.",
            technicianName: "Marouan"
        }
    });

    console.log(`✅ Client 1: ${client1.firstName} ${client1.lastName} (avec quote, invoice, intervention)`);

    // ==================== CLIENT 2: Sophie Martin (Prospect actif) ====================
    const client2 = await prisma.client.create({
        data: {
            userId: user.id,
            firstName: "Sophie",
            lastName: "Martin",
            email: "sophie.martin@outlook.fr",
            phoneNumber: "+33678901234",
            address: "45 Avenue Victor Hugo, 92100 Boulogne-Billancourt",
            type: "PROSPECT",
            status: "ACTIVE",
            totalRevenue: 0,
            lastInteraction: new Date(Date.now() - 1 * 60 * 60 * 1000), // Il y a 1h
            notes: "Intéressée par installation borne IRVE"
        }
    });

    await prisma.message.createMany({
        data: [
            {
                clientId: client2.id,
                role: "user",
                content: "Bonjour, je voudrais installer une borne de recharge pour ma voiture électrique",
                phoneNumber: "+33678901234",
                direction: "inbound",
                intent: "DEVIS",
                urgency: "NORMAL",
                aiProcessed: true,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
            },
            {
                clientId: client2.id,
                role: "assistant",
                content: "Parfait ! Je peux vous proposer plusieurs options. Avez-vous une prise dédiée ou faut-il tirer une ligne ?",
                phoneNumber: "+33678901234",
                direction: "outbound",
                model: "llama-3.3-70b",
                tokens: 52,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 3 * 60 * 1000)
            }
        ]
    });

    const quote2 = await prisma.quote.create({
        data: {
            userId: user.id,
            clientId: client2.id,
            quoteNumber: "DEV-2024-002",
            title: "Installation Borne IRVE",
            description: "Installation borne GreenUp avec tirage de ligne dédiée",
            status: "SENT",
            subtotal: 650,
            tvaRate: 20,
            tvaAmount: 130,
            total: 780,
            validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            validityDays: 30,
            markupPercentage: 30,
            estimatedDuration: "Demi-journée",
            sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            items: {
                create: [
                    { description: "Installation Prise GreenUp", quantity: 1, unitPrice: 250, total: 250, order: 0 },
                    { description: "Tirage ligne dédiée 20m", quantity: 1, unitPrice: 350, total: 350, order: 1 },
                    { description: "Déplacement", quantity: 1, unitPrice: 50, total: 50, order: 2 }
                ]
            }
        }
    });

    await prisma.quoteComment.create({
        data: {
            quoteId: quote2.id,
            content: "Devis envoyé par email, en attente de retour client",
            author: "admin",
            source: "web"
        }
    });

    console.log(`✅ Client 2: ${client2.firstName} ${client2.lastName} (prospect avec devis en cours)`);

    // ==================== CLIENT 3: Ahmed Benali (Client fidèle) ====================
    const client3 = await prisma.client.create({
        data: {
            userId: user.id,
            firstName: "Ahmed",
            lastName: "Benali",
            email: "a.benali@entreprise.com",
            phoneNumber: "+33612334455",
            companyName: "Benali Immobilier",
            address: "78 Boulevard Haussmann, 75008 Paris",
            type: "CLIENT",
            status: "ACTIVE",
            totalRevenue: 3200,
            lastInteraction: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            notes: "Client professionnel, gère un parc immobilier. Demande systématiquement une facture avec TVA."
        }
    });

    const quote3 = await prisma.quote.create({
        data: {
            userId: user.id,
            clientId: client3.id,
            quoteNumber: "DEV-2024-003",
            title: "Rénovation électrique appartement - 50m²",
            description: "Mise aux normes complète d'un appartement de 50m²",
            status: "ACCEPTED",
            subtotal: 2800,
            tvaRate: 20,
            tvaAmount: 560,
            total: 3360,
            validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            validityDays: 30,
            markupPercentage: 40,
            estimatedDuration: "3 jours",
            items: {
                create: [
                    { description: "Remplacement tableau électrique", quantity: 1, unitPrice: 1200, total: 1200, order: 0 },
                    { description: "Installation prises et interrupteurs (x15)", quantity: 15, unitPrice: 80, total: 1200, order: 1 },
                    { description: "Tirage câbles et mise aux normes", quantity: 1, unitPrice: 400, total: 400, order: 2 }
                ]
            }
        }
    });

    await prisma.intervention.create({
        data: {
            clientId: client3.id,
            quoteId: quote3.id,
            status: "SCHEDULED",
            scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
            address: client3.address,
            notes: "RDV confirmé. Apporter échelle et matériel complet.",
            technicianName: "Marouan"
        }
    });

    console.log(`✅ Client 3: ${client3.firstName} ${client3.lastName} (client B2B avec intervention planifiée)`);

    // ==================== CLIENT 4: Marie Lefebvre (Nouveau prospect) ====================
    const client4 = await prisma.client.create({
        data: {
            userId: user.id,
            firstName: "Marie",
            lastName: "Lefebvre",
            phoneNumber: "+33698765432",
            address: "23 Rue Molière, 92130 Issy-les-Moulineaux",
            type: "PROSPECT",
            status: "ACTIVE",
            totalRevenue: 0,
            lastInteraction: new Date(Date.now() - 30 * 60 * 1000), // Il y a 30min
            notes: "Premier contact via WhatsApp"
        }
    });

    await prisma.message.createMany({
        data: [
            {
                clientId: client4.id,
                role: "user",
                content: "Salut, j'ai une panne d'électricité dans ma cuisine, vous pouvez venir ?",
                phoneNumber: "+33698765432",
                direction: "inbound",
                intent: "URGENCE",
                urgency: "HIGH",
                sentiment: "STRESSED",
                aiProcessed: true,
                createdAt: new Date(Date.now() - 30 * 60 * 1000)
            },
            {
                clientId: client4.id,
                role: "assistant",
                content: "Bonjour Marie ! Je comprends votre urgence. Je peux intervenir cet après-midi vers 15h. Est-ce que ça vous convient ?",
                phoneNumber: "+33698765432",
                direction: "outbound",
                model: "llama-3.3-70b",
                tokens: 38,
                createdAt: new Date(Date.now() - 28 * 60 * 1000)
            },
            {
                clientId: client4.id,
                role: "user",
                content: "Oui merci beaucoup !",
                phoneNumber: "+33698765432",
                direction: "inbound",
                sentiment: "POSITIVE",
                aiProcessed: true,
                createdAt: new Date(Date.now() - 25 * 60 * 1000)
            }
        ]
    });

    const quote4 = await prisma.quote.create({
        data: {
            userId: user.id,
            clientId: client4.id,
            quoteNumber: "DEV-2024-004",
            title: "Dépannage électrique cuisine",
            description: "Recherche de panne + réparation",
            status: "DRAFT",
            subtotal: 165,
            tvaRate: 20,
            tvaAmount: 33,
            total: 198,
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            validityDays: 7,
            markupPercentage: 25,
            estimatedDuration: "1-2 heures",
            items: {
                create: [
                    { description: "Recherche de panne", quantity: 1, unitPrice: 120, total: 120, order: 0 },
                    { description: "Déplacement", quantity: 1, unitPrice: 45, total: 45, order: 1 }
                ]
            }
        }
    });

    console.log(`✅ Client 4: ${client4.firstName} ${client4.lastName} (nouveau prospect avec urgence)`);

    // ==================== CONVERSATION SUMMARIES ====================
    await prisma.conversationSummary.createMany({
        data: [
            {
                phoneNumber: "+33601020304",
                lastIntent: "DEPANNAGE",
                lastMessageAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                messageCount: 3
            },
            {
                phoneNumber: "+33678901234",
                lastIntent: "DEVIS",
                lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                messageCount: 2
            },
            {
                phoneNumber: "+33698765432",
                lastIntent: "URGENCE",
                lastMessageAt: new Date(Date.now() - 25 * 60 * 1000),
                messageCount: 3
            }
        ]
    });

    console.log('✅ Conversation summaries created');

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - 1 User: ${user.email}`);
    console.log(`   - 4 Clients (2 actifs, 2 prospects)`);
    console.log(`   - 4 Quotes (1 accepted, 1 sent, 1 scheduled, 1 draft)`);
    console.log(`   - 1 Invoice (paid)`);
    console.log(`   - 2 Interventions (1 completed, 1 scheduled)`);
    console.log(`   - 8 Messages WhatsApp`);
    console.log(`   - 3 Conversation Summaries`);

    process.exit(0);
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
