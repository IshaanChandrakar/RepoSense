const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("Fetching dashboard data...");

    const totalReviews = await prisma.review.count();
    console.log("Total Reviews:", totalReviews);

    const issuesFound = await prisma.review.aggregate({
        _sum: { issuesFound: true },
    });
    console.log("Issues Found:", issuesFound);

    const avgDuration = await prisma.review.aggregate({
        _avg: { duration: true },
    });
    console.log("Avg Duration:", avgDuration);
}

check()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
