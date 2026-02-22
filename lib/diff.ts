export class DiffParser {
    static parse(diff: string): { file: string; content: string; lines: string[] }[] {
        const files = diff.split('diff --git a/');
        const results = [];

        for (const chunk of files) {
            if (!chunk.trim()) continue;

            const lines = chunk.split('\n');
            const header = lines[0]; // e.g., "src/main.ts b/src/main.ts"
            const fileName = header.split(' ')[0]; // taking "src/main.ts"

            // Skip deleted files or binary files if needed
            if (chunk.includes("deleted file mode")) continue;

            results.push({
                file: fileName,
                content: chunk,
                lines: lines
            });
        }
        return results;
    }
}
