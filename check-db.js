const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const reviews = await prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
        include: { repository: true, pullRequest: true }
    });

    console.log(`Found ${reviews.length} reviews.`);

    const problematic = reviews.find(r => r.status === 'REVIEWED_WITH_ISSUES');
    if (problematic) {
        console.log("PROBLEM REVIEW:");
        console.log(JSON.stringify(problematic, null, 2));
    } else {
        console.log("No reviews with issues found.");
    }
}

check()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
