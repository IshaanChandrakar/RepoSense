import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import fetch from "node-fetch"; // Standard fetch in Next.js/Node 18+ can also be used globally
import * as tar from "tar-stream"; // Need to add tar-stream
import * as zlib from "zlib";

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

// Helper to fetch entire repository content for RAG indexing
export async function fetchFullRepository(octokit: Octokit, owner: string, repo: string): Promise<{ path: string; content: string }[]> {
    // 1. Get the repository archive link (tarball)
    const { data: archiveData } = await octokit.rest.repos.downloadTarballArchive({
        owner,
        repo,
        ref: "main", // or master, ideally you'd look up the default branch
    });

    const buffer = Buffer.from(archiveData as ArrayBuffer);
    const files: { path: string, content: string }[] = [];

    // 2. Unpack the tar.gz in memory
    return new Promise((resolve, reject) => {
        const extract = tar.extract();
        const gunzip = zlib.createGunzip();

        extract.on('entry', (header, stream, next) => {
            // Ignore directories or massive binary files early on if possible
            if (header.type === 'file' && !header.name.includes('/node_modules/') && !header.name.includes('/.git/')) {
                const chunks: Buffer[] = [];
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => {
                    const content = Buffer.concat(chunks).toString('utf-8');

                    // Simple heuristic: Only keep text-like content (skip binaries/images)
                    if (!content.includes('\u0000')) {
                        // Strip the top-level directory name which GitHub tarballs include
                        const relativePath = header.name.split('/').slice(1).join('/');
                        if (relativePath) {
                            files.push({ path: relativePath, content });
                        }
                    }
                    next();
                });
            } else {
                stream.on('end', () => next());
                stream.resume(); // skip it
            }
        });

        extract.on('finish', () => resolve(files));
        extract.on('error', (err) => reject(err));

        // Pipe buffer through gunzip and into tar extraction
        const { Readable } = require('stream');
        const readable = new Readable();
        readable._read = () => { };
        readable.push(buffer);
        readable.push(null);

        readable.pipe(gunzip).pipe(extract);
    });
}
