const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("Checking PRs...");
    const prs = await prisma.pullRequest.findMany();
    console.log(prs);

    const reviews = await prisma.review.findMany({
        include: { pullRequest: true }
    });
    console.log("\nReviews pointing to:");
    reviews.forEach(r => console.log(`Review ${r.id} -> PR #${r.pullRequest.number}`));
}

check()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
