const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const lastReview = await prisma.review.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { pullRequest: true }
    });

    console.log("---------------------------------------------------");
    console.log("RAW DB RECORD:");
    console.log(lastReview);
    console.log("---------------------------------------------------");

    if (lastReview?.issues) {
        console.log("ISSUES JSON PARSED:");
        console.log(JSON.parse(lastReview.issues));
    }
}

check()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
