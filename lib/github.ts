import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

export function getOctokit(installationId: number) {
    return new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: process.env.GITHUB_APP_ID,
            privateKey: process.env.GITHUB_PRIVATE_KEY,
            installationId: installationId,
        },
    });
}

// Helper to fetch PR diff
export async function getPRDiff(octokit: Octokit, owner: string, repo: string, pullNumber: number) {
    const { data } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
        mediaType: {
            format: "diff",
        },
    });
    return data as unknown as string; // Octokit types can be tricky with mediaType
}
