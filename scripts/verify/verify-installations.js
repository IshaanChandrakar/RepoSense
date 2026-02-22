// Debug script to check what the GitHub App can actually see.
require('dotenv').config();
const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');
const jwt = require('jsonwebtoken');

async function main() {
    console.log("🚀 Starting permission check...");

    if (!process.env.GITHUB_APP_ID || !process.env.GITHUB_PRIVATE_KEY) {
        console.error("❌ Missing params in .env");
        return;
    }

    // 1. Authenticate as the APP (JWT)
    const appOctokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: process.env.GITHUB_APP_ID,
            privateKey: process.env.GITHUB_PRIVATE_KEY,
        },
    });

    try {
        const { data: app } = await appOctokit.apps.getAuthenticated();
        console.log(`✅ Authenticated as App: ${app.name} (ID: ${app.id})`);

        // 2. List Installations
        console.log("\n📋 Listing Installations...");
        const { data: installations } = await appOctokit.apps.listInstallations();

        console.log(`Found ${installations.length} installations:`);

        for (const install of installations) {
            console.log(`\n🔹 Installation ID: ${install.id}`);
            console.log(`   Account: ${install.account.login} (${install.account.type})`);

            // 3. Get Access Token for this Installation
            const installOctokit = await appOctokit.auth({
                type: "installation",
                installationId: install.id,
            }); // returns an Octokit instance with auth hooked up if using authStrategy, 
            // BUT appOctokit.auth({type: 'installation'}) returns a token object usually.
            // Let's use the explicit way:

            // obtain token to list repos
            const token = await appOctokit.apps.createInstallationAccessToken({
                installation_id: install.id
            });

            const repoOctokit = new Octokit({
                auth: token.data.token
            });

            // 4. List Repositories for this Installation
            const { data: repos } = await repoOctokit.apps.listInstallationReposForAuthenticatedUser();
            console.log(`   Create Date: ${install.created_at}`);
            console.log(`   Permissions:`, install.permissions);
            console.log(`   Accessible Repositories (${repos.total_count}):`);
            repos.repositories.forEach(r => console.log(`     - ${r.full_name} (Private: ${r.private})`));
        }

    } catch (e) {
        console.error("🔥 Error:", e.message);
        if (e.response) console.error(e.response.data);
    }
}

main();
