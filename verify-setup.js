// This script helps debug the GitHub App setup locally.
// Run it with: node verify-setup.js

require('dotenv').config(); // Ensure we load environment variables
const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- CONFIGURATION ---
// REPLACE THESE WITH YOUR ACTUAL VALUES FROM A PREVIOUS WEBHOOK OR GITHUB
const INSTALLATION_ID = 109301764; // Found in webhook payload or GitHub Settings -> App -> Install App -> URL
const REPO_OWNER = "IshaanChandrakar";
const REPO_NAME = "test-ai-review2";
const PR_NUMBER = 1; // Pick an existing PR number
// ---------------------

async function main() {
    console.log("🚀 Starting verification script...");
    console.log("-----------------------------------");

    try {
        // 1. Check Environment Variables
        console.log("🔑 Checking Environment Variables...");
        if (!process.env.GITHUB_APP_ID) throw new Error("Missing GITHUB_APP_ID");
        if (!process.env.GITHUB_PRIVATE_KEY) throw new Error("Missing GITHUB_PRIVATE_KEY");
        if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
        console.log("✅ Env vars present.");

        // 2. Authenticate with GitHub
        console.log("\n📡 Connecting to GitHub...");
        const octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: process.env.GITHUB_APP_ID,
                privateKey: process.env.GITHUB_PRIVATE_KEY,
                installationId: INSTALLATION_ID,
            },
        });

        try {
            const { data: app } = await octokit.apps.getAuthenticated();
            console.log(`✅ Authenticated as GitHub App: ${app.name}`);
        } catch (e) {
            console.error("❌ GitHub Authentication Failed. Check App ID/Private Key.");
            throw e;
        }

        // 3. Fetch PR Diff
        console.log(`\n📥 Fetching diff for PR #${PR_NUMBER} in ${REPO_OWNER}/${REPO_NAME}...`);
        let diffRaw;
        try {
            const { data } = await octokit.pulls.get({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                pull_number: PR_NUMBER,
                mediaType: { format: "diff" },
            });
            diffRaw = data;
            console.log(`✅ Diff fetched successfully (${diffRaw.length} chars).`);
        } catch (e) {
            console.error("❌ Failed to fetch PR diff. Check repo name/PR number and Installation ID permissions.");
            console.error("   Ensure the App is installed on this repository.");
            throw e;
        }

        // 4. Test Database Connection
        console.log("\n💾 Testing Database Connection...");
        try {
            const count = await prisma.repository.count();
            console.log(`✅ Connected to database. Repository count: ${count}`);
        } catch (e) {
            console.error("❌ Database connection failed.");
            throw e;
        }

        console.log("\n🎉 Verification Complete! The core components are working.");
        console.log("If this script works but the webhook fails, check:");
        console.log("1. The webhook secret in GitHub settings matches .env");
        console.log("2. The webhook URL is correct (ngrok/api/webhook)");

    } catch (error) {
        console.error("\n🔥 VERIFICATION FAILED:", error.message);
        if (error.response) {
            console.error("   GitHub API Error:", error.response.status, error.response.data);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
