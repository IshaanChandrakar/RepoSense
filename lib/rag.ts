import * as lancedb from '@lancedb/lancedb';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
}

async function getEmbedding(text: string): Promise<number[]> {
    if (!genAI) {
        throw new Error("Missing API Key for Gemini API");
    }
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
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
        const results = await table.search(queryVector).limit(limit).toArray();
        return results;
    } catch (error) {
        console.error(`Error querying repo ${repoName}:`, error);
        return [];
    }
}
