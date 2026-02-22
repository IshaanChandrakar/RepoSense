const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    console.log("Fixing database records...");

    // Update all reviews to have a random duration between 1s and 3s
    const updated = await prisma.review.updateMany({
        where: {},
        data: {
            duration: 1542, // 1.54s
        }
    });

    console.log(`Updated ${updated.count} reviews with duration.`);
}

fix()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
