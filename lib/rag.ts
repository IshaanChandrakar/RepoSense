import * as lancedb from 'lancedb';
import { OpenAIEmbeddings } from '@langchain/openai'; // Note: User needs to ensure this package is allowed or use direct OpenAI calls.
// Using direct OpenAI for simplicity if langchain is overkill or not in package.json (it wasn't in my initial list).
// Let's implement a simple embedding wrapper.

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function getEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
    });
    return response.data[0].embedding;
}

export async function connectToVectorDB(dbPath: string = 'data/lancedb') {
    const db = await lancedb.connect(dbPath);
    return db;
}

export async function indexRepository(repoName: string, files: { path: string; content: string }[]) {
    const db = await connectToVectorDB();
    const tableName = `repo_${repoName.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const data = [];
    for (const file of files) {
        // Basic chunking could be added here, for now indexing whole files if small, or first 2000 chars
        const contentPreview = file.content.slice(0, 2000);
        const embedding = await getEmbedding(contentPreview);

        data.push({
            path: file.path,
            content: contentPreview,
            vector: embedding,
        });
    }

    // Check if table exists, overwrite if so (simple re-indexing strategy)
    try {
        await db.openTable(tableName);
        await db.dropTable(tableName);
    } catch (e) {
        // Table might not exist
    }

    await db.createTable(tableName, data);
    console.log(`Indexed ${files.length} files for ${repoName}`);
}

export async function queryRepository(repoName: string, query: string, limit: number = 3) {
    const db = await connectToVectorDB();
    const tableName = `repo_${repoName.replace(/[^a-zA-Z0-9]/g, '_')}`;

    try {
        const table = await db.openTable(tableName);
        const queryVector = await getEmbedding(query);
        const results = await table.search(queryVector).limit(limit).execute();
        return results;
    } catch (error) {
        console.error(`Error querying repo ${repoName}:`, error);
        return [];
    }
}
